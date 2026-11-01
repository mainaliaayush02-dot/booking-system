/**
 * Trusted Provisioning Script for Newborn Photography Nepal
 * 
 * Usage:
 *   node scripts/provision-admin.mjs <email> <password> <displayName> [role] [phone]
 * 
 * Example:
 *   node scripts/provision-admin.mjs admin@newbornphotonepal.com StudioSecret123 "Studio Director" admin 9801000000
 */

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const [email, password, displayName = "Studio Administrator", role = "admin", phone = ""] = process.argv.slice(2);

if (!email || !password) {
  console.error("Error: Missing required arguments.");
  console.log("Usage: node scripts/provision-admin.mjs <email> <password> [displayName] [role] [phone]");
  process.exit(1);
}

async function provision() {
  console.log(`\n========================================`);
  console.log(`Newborn Photography Nepal — Provisioning`);
  console.log(`========================================`);
  console.log(`Target Email: ${email}`);
  console.log(`Display Name: ${displayName}`);
  console.log(`Role: ${role}`);
  console.log(`Project: ${firebaseConfig.projectId}`);

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    const userRef = doc(db, "users", cred.user.uid);
    await setDoc(userRef, {
      uid: cred.user.uid,
      email,
      displayName,
      role,
      phone,
      active: true,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });

    console.log(`\n[SUCCESS] User account successfully provisioned!`);
    console.log(`UID: ${cred.user.uid}`);
    console.log(`Status: Active ${role}`);
    console.log(`========================================\n`);
    process.exit(0);
  } catch (err) {
    console.error("\n[FAILED] Provisioning failed:", err.message);
    process.exit(1);
  }
}

provision();
