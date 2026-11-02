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
import { initializeApp, deleteApp } from "firebase/app";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { StudioUser, UserRole } from "./types";

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  studioUser: StudioUser | null;
  loading: boolean;
  profileError: string | null;
  isAdmin: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<StudioUser>;
  signOut: () => Promise<void>;
  createStudioUser: (email: string, password: string, displayName: string, role: UserRole, phone?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  studioUser: null,
  loading: true,
  profileError: null,
  isAdmin: false,
  isStaff: false,
  signIn: async () => {
    throw new Error("AuthProvider not initialized");
  },
  signOut: async () => {},
  createStudioUser: async () => {},
});

const TARGET_ADMIN_UID = "99NIadNmrqVKWyWMngiMoAmYfOf1";
const TARGET_ADMIN_EMAIL = "newbornphotographynepal.studio@gmail.com";

// Helper to guarantee asynchronous operations never hang indefinitely
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

// Strictly verify and resolve studio user profile
async function resolveUserProfile(user: FirebaseUser, forceRefresh = false): Promise<StudioUser | null> {
  const userDocRef = doc(db, "users", user.uid);

  const [userDocSnap, idTokenResult] = await Promise.all([
    withTimeout(
      getDoc(userDocRef).catch((err) => {
        console.warn("[AUTH] Firestore getDoc failed (will check token claims):", err);
        return null;
      }),
      2500,
      null
    ),
    withTimeout(
      user.getIdTokenResult(forceRefresh).catch((err) => {
        console.warn("[AUTH] getIdTokenResult failed:", err);
        return null;
      }),
      2500,
      null
    ),
  ]);

  // Case 1: Firestore document exists
  if (userDocSnap && userDocSnap.exists()) {
    const data = userDocSnap.data() as Partial<StudioUser>;

    // Account explicitly deactivated by administrator
    if (data.active === false) {
      throw new Error("This studio account has been deactivated. Please contact your studio administrator.");
    }

    const effectiveRole = (data.role || (idTokenResult?.claims?.role as UserRole) || (user.uid === TARGET_ADMIN_UID ? "admin" : "staff")) as UserRole;

    return {
      uid: user.uid,
      email: user.email || data.email || "",
      displayName: data.displayName || user.displayName || (user.uid === TARGET_ADMIN_UID ? "Newborn Photography Nepal Admin" : "Studio Staff"),
      role: effectiveRole,
      phone: data.phone || "",
      active: true,
      createdAt: data.createdAt || new Date().toISOString(),
    };
  }

  // Case 2: User document is missing from Firestore, check cryptographic custom claims or verified target admin
  const hasAdminClaim = idTokenResult?.claims?.role === "admin" || (idTokenResult?.claims as any)?.admin === true;
  const isTargetAdmin = user.uid === TARGET_ADMIN_UID || user.email === TARGET_ADMIN_EMAIL;

  if (hasAdminClaim || isTargetAdmin) {
    const adminProfile: StudioUser = {
      uid: user.uid,
      email: user.email || TARGET_ADMIN_EMAIL,
      displayName: user.displayName || "Newborn Photography Nepal Admin",
      role: "admin",
      phone: "",
      active: true,
      createdAt: new Date().toISOString(),
    };

    // Auto-heal the Firestore user record so future lookups are immediate
    setDoc(
      userDocRef,
      {
        ...adminProfile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch((e) => console.warn("[AUTH] Auto-heal admin document warning:", e));

    return adminProfile;
  }

  // Case 3: Other verified custom role claim (staff / photographer)
  if (idTokenResult?.claims?.role) {
    const role = idTokenResult.claims.role as UserRole;
    return {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "Studio Staff",
      role,
      phone: "",
      active: true,
      createdAt: new Date().toISOString(),
    };
  }

  // Case 4: Neither Firestore profile nor valid studio custom claims exist
  // Security requirement: Never treat unknown users as staff
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [studioUser, setStudioUser] = useState<StudioUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    // Hard fallback safety timer: Guarantee loading NEVER stays true indefinitely
    const hardSafetyTimer = setTimeout(() => {
      if (isSubscribed) {
        setLoading(false);
      }
    }, 2500);

    // Support localhost automated testing and dev sessions
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      const devAuth = window.localStorage.getItem("__STUDIO_DEV_AUTH__");
      if (devAuth) {
        try {
          const parsed = JSON.parse(devAuth);
          if (parsed.uid && parsed.role) {
            clearTimeout(hardSafetyTimer);
            setFirebaseUser({ uid: parsed.uid, email: parsed.email || TARGET_ADMIN_EMAIL } as any);
            setStudioUser(parsed);
            setProfileError(null);
            setLoading(false);
            return () => {
              isSubscribed = false;
            };
          }
        } catch (e) {}
      }
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!isSubscribed) return;

        if (!user) {
          clearTimeout(hardSafetyTimer);
          setFirebaseUser(null);
          setStudioUser(null);
          setProfileError(null);
          setLoading(false);
          return;
        }

        setFirebaseUser(user);

        try {
          const profile = await resolveUserProfile(user, false);
          if (!isSubscribed) return;

          clearTimeout(hardSafetyTimer);
          if (profile) {
            setStudioUser(profile);
            setProfileError(null);
          } else {
            setStudioUser(null);
            setProfileError("No authorized studio profile found for this account.");
          }
        } catch (error: any) {
          console.error("[AUTH] Profile resolution error in auth listener:", error);
          if (!isSubscribed) return;
          clearTimeout(hardSafetyTimer);
          setStudioUser(null);
          setProfileError(error?.message || "Failed to verify studio permissions.");
        } finally {
          if (isSubscribed) {
            setLoading(false);
          }
        }
      },
      (authError) => {
        console.error("[AUTH] Firebase auth listener error:", authError);
        if (!isSubscribed) return;
        clearTimeout(hardSafetyTimer);
        setFirebaseUser(null);
        setStudioUser(null);
        setProfileError("Authentication listener failed.");
        setLoading(false);
      }
    );

    return () => {
      isSubscribed = false;
      clearTimeout(hardSafetyTimer);
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<StudioUser> => {
    setLoading(true);
    setProfileError(null);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;

      // Force refresh token to pull latest custom claims
      const profile = await resolveUserProfile(user, true);

      if (!profile) {
        await firebaseSignOut(auth);
        setFirebaseUser(null);
        setStudioUser(null);
        setLoading(false);
        throw new Error("Access Denied: No studio staff profile or role is configured for this account.");
      }

      setFirebaseUser(user);
      setStudioUser(profile);
      setProfileError(null);
      setLoading(false);
      return profile;
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("__STUDIO_DEV_AUTH__");
    }
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn("[AUTH] Error during signOut:", err);
    } finally {
      setStudioUser(null);
      setFirebaseUser(null);
      setProfileError(null);
      setLoading(false);
    }
  };

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

    const tempAppName = `provision-${Date.now()}`;
    const secondaryApp = initializeApp(auth.app.options, tempAppName);
    const secondaryAuth = (await import("firebase/auth")).getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await updateProfile(userCredential.user, { displayName });

      const newDocRef = doc(db, "users", userCredential.user.uid);
      const userDocData = {
        uid: userCredential.user.uid,
        email,
        displayName,
        role,
        phone: phone || "",
        active: true,
        createdAt: new Date().toISOString(),
      };

      const { serverTimestamp: st } = await import("firebase/firestore");
      await setDoc(newDocRef, { ...userDocData, timestamp: st() });
      await firebaseSignOut(secondaryAuth);
    } finally {
      await deleteApp(secondaryApp).catch(() => {});
    }
  };

  const isAdmin = studioUser?.role === "admin";
  const isStaff = studioUser?.role === "staff" || studioUser?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        studioUser,
        loading,
        profileError,
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
