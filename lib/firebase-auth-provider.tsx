"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { StudioUser, UserRole } from "./types";

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  studioUser: StudioUser | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createStudioUser: (email: string, password: string, displayName: string, role: UserRole, phone?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  studioUser: null,
  loading: true,
  isAdmin: false,
  isStaff: false,
  signIn: async () => {},
  signOut: async () => {},
  createStudioUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [studioUser, setStudioUser] = useState<StudioUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data() as StudioUser;
            
            // Check if user account was disabled by studio director
            if (data.active === false) {
              await firebaseSignOut(auth);
              setStudioUser(null);
              setFirebaseUser(null);
              setLoading(false);
              return;
            }

            setStudioUser({
              uid: user.uid,
              email: user.email || data.email,
              displayName: data.displayName || user.displayName || "Studio Staff",
              role: data.role || "staff",
              phone: data.phone || "",
              active: true,
              createdAt: data.createdAt || new Date().toISOString(),
            });
          } else {
            // If user exists in Auth but has no Firestore profile yet,
            // default to lowest privilege role (staff) - NEVER self-assign admin!
            const defaultUser: StudioUser = {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "Studio Staff",
              role: "staff", // Secure default: staff only, never admin
              active: true,
              createdAt: new Date().toISOString(),
            };
            setStudioUser(defaultUser);
          }
        } catch (error) {
          console.error("Error fetching studio user profile:", error);
          setStudioUser({
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "Studio Staff",
            role: "staff",
            active: true,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setStudioUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, "users", credential.user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data() as StudioUser;
      if (data.active === false) {
        await firebaseSignOut(auth);
        throw new Error("This studio account has been deactivated. Please contact your studio administrator.");
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setStudioUser(null);
    setFirebaseUser(null);
  };

  // Provision new studio staff - trusted process by authenticated admin
  const createStudioUser = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    phone?: string
  ) => {
    if (studioUser?.role !== "admin") {
      throw new Error("Unauthorized: Only studio administrators can provision team member accounts.");
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    const userDocRef = doc(db, "users", cred.user.uid);
    const newUserData: StudioUser = {
      uid: cred.user.uid,
      email,
      displayName,
      role,
      phone: phone || "",
      active: true,
      createdAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, {
      ...newUserData,
      timestamp: serverTimestamp(),
    });
  };

  const isAdmin = studioUser?.role === "admin";
  const isStaff = studioUser?.role === "staff" || studioUser?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        studioUser,
        loading,
        isAdmin,
        isStaff,
        signIn,
        signOut,
        createStudioUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
