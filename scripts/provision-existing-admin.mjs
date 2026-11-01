/**
 * Newborn Photography Nepal — Studio Manager
 * Trusted Admin Account Provisioning Script
 * 
 * Target Account:
 *   Project ID: booking-b7580
 *   Email: newbornphotographynepal.studio@gmail.com
 *   UID: 99NIadNmrqVKWyWMngiMoAmYfOf1
 *   Role: admin
 *   Active: true
 *   DisplayName: Newborn Photography Nepal Admin
 * 
 * Usage:
 *   node scripts/provision-existing-admin.mjs [path-to-serviceAccountKey.json]
 *   Or with environment variable:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/provision-existing-admin.mjs
 *   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}' node scripts/provision-existing-admin.mjs
 */

import fs from "fs";
import path from "path";
import os from "os";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const TARGET_PROJECT_ID = "booking-b7580";
const TARGET_UID = "99NIadNmrqVKWyWMngiMoAmYfOf1";
const TARGET_EMAIL = "newbornphotographynepal.studio@gmail.com";
const TARGET_DISPLAY_NAME = "Newborn Photography Nepal Admin";
const TARGET_ROLE = "admin";

function findServiceAccountKey() {
  // 1. Check CLI argument
  const cliArg = process.argv[2];
  if (cliArg && fs.existsSync(cliArg)) {
    console.log(`[AUTH] Using credentials from command-line argument: ${cliArg}`);
    return JSON.parse(fs.readFileSync(cliArg, "utf8"));
  }

  // 2. Check GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.log(`[AUTH] Using credentials from GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    return JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
  }

  // 3. Check FIREBASE_SERVICE_ACCOUNT_KEY env var (path or raw JSON)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const val = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    if (val.startsWith("{")) {
      console.log(`[AUTH] Using credentials from FIREBASE_SERVICE_ACCOUNT_KEY JSON string`);
      return JSON.parse(val);
    }
    if (fs.existsSync(val)) {
      console.log(`[AUTH] Using credentials from FIREBASE_SERVICE_ACCOUNT_KEY path: ${val}`);
      return JSON.parse(fs.readFileSync(val, "utf8"));
    }
  }

  // 4. Check workspace root and common directories
  const candidatePaths = [
    path.resolve("./serviceAccountKey.json"),
    path.resolve("./booking-b7580-key.json"),
    path.join(os.homedir(), "Downloads", "booking-b7580.json"),
  ];

  // Also scan Downloads for any booking-b7580 or b7580 admin key
  try {
    const downloadsDir = path.join(os.homedir(), "Downloads");
    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir);
      for (const file of files) {
        if ((file.includes("booking-b7580") || file.includes("b7580")) && file.endsWith(".json")) {
          candidatePaths.push(path.join(downloadsDir, file));
        }
      }
    }
  } catch (err) {}

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
        if (parsed.project_id === TARGET_PROJECT_ID || !parsed.project_id) {
          console.log(`[AUTH] Detected service account key at: ${p}`);
          return parsed;
        }
      } catch (e) {}
    }
  }

  return null;
}

async function main() {
  console.log("============================================================");
  console.log("Newborn Photography Nepal — Admin Account Provisioning");
  console.log("============================================================");
  console.log(`Target Project ID   : ${TARGET_PROJECT_ID}`);
  console.log(`Target UID          : ${TARGET_UID}`);
  console.log(`Target Email        : ${TARGET_EMAIL}`);
  console.log(`Target Display Name : ${TARGET_DISPLAY_NAME}`);
  console.log(`Target Role         : ${TARGET_ROLE}`);
  console.log(`Target Document     : users/${TARGET_UID}`);
  console.log("------------------------------------------------------------\n");

  const serviceAccount = findServiceAccountKey();

  if (!serviceAccount) {
    console.warn("⚠️  NO FIREBASE SERVICE ACCOUNT CREDENTIALS FOUND");
    console.log(`
To provision through the Firebase Admin SDK, a Service Account Private Key is required.

How to generate the Service Account Key:
1. Open Firebase Console: https://console.firebase.google.com/project/${TARGET_PROJECT_ID}/settings/serviceaccounts/adminsdk
2. Select 'Node.js' and click 'Generate new private key'.
3. Run this script passing the path to the downloaded JSON file:
   node scripts/provision-existing-admin.mjs ~/Downloads/booking-b7580-firebase-adminsdk-xxxxx.json

Direct Firebase Console Alternative (Immediate zero-setup):
You can also create/verify the document directly in Cloud Firestore:
1. Go to: https://console.firebase.google.com/project/${TARGET_PROJECT_ID}/firestore
2. In collection 'users', add/edit document ID: '${TARGET_UID}'
3. Set the following fields:
   - uid (string)         : "${TARGET_UID}"
   - email (string)       : "${TARGET_EMAIL}"
   - displayName (string) : "${TARGET_DISPLAY_NAME}"
   - role (string)        : "admin"
   - active (boolean)     : true
   - createdAt (string)   : "${new Date().toISOString()}"
   - updatedAt (string)   : "${new Date().toISOString()}"
`);
    process.exit(1);
  }

  // Verify project ID matches
  if (serviceAccount.project_id && serviceAccount.project_id !== TARGET_PROJECT_ID) {
    console.error(`[ERROR] Provided service account is for project '${serviceAccount.project_id}', but expected '${TARGET_PROJECT_ID}'.`);
    process.exit(1);
  }

  // Initialize Firebase Admin
  const app = getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
        projectId: TARGET_PROJECT_ID,
      })
    : getApps()[0];

  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log("[1/4] Verifying Firebase Authentication user record...");
  let authUser;
  try {
    authUser = await auth.getUser(TARGET_UID);
    console.log(`   ✓ Found Auth User UID: ${authUser.uid}`);
    console.log(`   ✓ Auth Email: ${authUser.email}`);
    console.log(`   ✓ Email Verified: ${authUser.emailVerified}`);
    console.log(`   ✓ Auth Disabled: ${authUser.disabled}`);

    if (authUser.email.toLowerCase() !== TARGET_EMAIL.toLowerCase()) {
      console.error(`   ✗ Email mismatch! Expected: ${TARGET_EMAIL}, Found: ${authUser.email}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`   ✗ Failed to find Firebase Auth record for UID '${TARGET_UID}':`, err.message);
    process.exit(1);
  }

  console.log("\n[2/4] Updating Firebase Auth profile & custom claims...");
  try {
    await auth.updateUser(TARGET_UID, {
      displayName: TARGET_DISPLAY_NAME,
    });
    await auth.setCustomUserClaims(TARGET_UID, {
      role: TARGET_ROLE,
      admin: true,
    });
    console.log(`   ✓ Updated Display Name to: ${TARGET_DISPLAY_NAME}`);
    console.log(`   ✓ Set Custom Claims: { role: "${TARGET_ROLE}", admin: true }`);
  } catch (err) {
    console.error("   ✗ Warning: Could not update auth claims:", err.message);
  }

  console.log("\n[3/4] Provisioning Firestore document: users/" + TARGET_UID + "...");
  const userDocRef = db.collection("users").doc(TARGET_UID);
  const userDocSnap = await userDocRef.get();
  const now = new Date().toISOString();
  let actionTaken = "";

  if (userDocSnap.exists) {
    actionTaken = "UPDATED";
    const existing = userDocSnap.data();
    console.log(`   • Existing Firestore document found (created: ${existing.createdAt || 'N/A'})`);
    await userDocRef.update({
      role: TARGET_ROLE,
      active: true,
      displayName: TARGET_DISPLAY_NAME,
      email: TARGET_EMAIL,
      updatedAt: now,
    });
    console.log(`   ✓ Successfully updated existing document at users/${TARGET_UID}`);
  } else {
    actionTaken = "CREATED";
    console.log(`   • No existing Firestore document found at users/${TARGET_UID}. Creating new...`);
    const newDocData = {
      uid: TARGET_UID,
      email: TARGET_EMAIL,
      displayName: TARGET_DISPLAY_NAME,
      role: TARGET_ROLE,
      phone: "",
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    await userDocRef.set(newDocData);
    console.log(`   ✓ Successfully created document at users/${TARGET_UID}`);
  }

  console.log("\n[4/4] Verifying Firestore document state...");
  const verifySnap = await userDocRef.get();
  if (!verifySnap.exists) {
    console.error("   ✗ Verification failed: Document does not exist after write!");
    process.exit(1);
  }

  const data = verifySnap.data();
  const checks = [
    { field: "Document Path", expected: `users/${TARGET_UID}`, actual: `users/${verifySnap.id}`, pass: verifySnap.id === TARGET_UID },
    { field: "UID", expected: TARGET_UID, actual: data.uid, pass: data.uid === TARGET_UID },
    { field: "Email", expected: TARGET_EMAIL, actual: data.email, pass: data.email?.toLowerCase() === TARGET_EMAIL.toLowerCase() },
    { field: "Display Name", expected: TARGET_DISPLAY_NAME, actual: data.displayName, pass: data.displayName === TARGET_DISPLAY_NAME },
    { field: "Role", expected: TARGET_ROLE, actual: data.role, pass: data.role === TARGET_ROLE },
    { field: "Active Status", expected: true, actual: data.active, pass: data.active === true },
  ];

  let allPassed = true;
  for (const c of checks) {
    const icon = c.pass ? "✓" : "✗";
    console.log(`   ${icon} ${c.field.padEnd(16)}: ${c.actual} (Expected: ${c.expected})`);
    if (!c.pass) allPassed = false;
  }

  if (!allPassed) {
    console.error("\n[FAILED] Verification checks did not all pass!");
    process.exit(1);
  }

  console.log("\n============================================================");
  console.log("PROVISIONING COMPLETE AND VERIFIED");
  console.log("============================================================");
  console.log(`Action: ${actionTaken}`);
  console.log(`Account: ${TARGET_EMAIL}`);
  console.log(`UID: ${TARGET_UID}`);
  console.log(`Role: ${TARGET_ROLE}`);
  console.log(`Status: active = true`);
  console.log(`Permissions: Full Administrator (All Studio Modules)`);
  console.log("============================================================\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\nUnexpected error during provisioning:", err);
  process.exit(1);
});
