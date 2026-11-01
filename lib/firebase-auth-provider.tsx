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
            setStudioUser({
              uid: user.uid,
              email: user.email || data.email,
              displayName: data.displayName || user.displayName || "Studio Staff",
              role: data.role || "staff",
              phone: data.phone || "",
              active: data.active !== undefined ? data.active : true,
              createdAt: data.createdAt || new Date().toISOString(),
            });
          } else {
            // Initial seed/fallback: first authenticated user is set up as studio admin
            const newUser: StudioUser = {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "Studio Staff",
              role: "admin",
              active: true,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, {
              ...newUser,
              timestamp: serverTimestamp(),
            });
            setStudioUser(newUser);
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setStudioUser(null);
    setFirebaseUser(null);
  };

  const createStudioUser = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    phone?: string
  ) => {
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
