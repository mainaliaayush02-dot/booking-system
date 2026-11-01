import fs from "fs";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

export function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // 1. Check FIREBASE_SERVICE_ACCOUNT_KEY env variable (inline JSON or file path)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const val = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      const credentials = val.startsWith("{") 
        ? JSON.parse(val) 
        : JSON.parse(fs.readFileSync(val, "utf8"));
      adminApp = initializeApp({
        credential: cert(credentials),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "booking-b7580",
      });
      return adminApp;
    } catch (err) {
      console.error("[FIREBASE-ADMIN] Failed to initialize with FIREBASE_SERVICE_ACCOUNT_KEY:", err);
    }
  }

  // 2. Check GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "booking-b7580",
      });
      return adminApp;
    } catch (err) {
      console.error("[FIREBASE-ADMIN] Failed to initialize with GOOGLE_APPLICATION_CREDENTIALS:", err);
    }
  }

  return null;
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}
