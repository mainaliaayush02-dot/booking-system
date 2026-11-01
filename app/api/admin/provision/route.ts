import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

const TARGET_UID = "99NIadNmrqVKWyWMngiMoAmYfOf1";
const TARGET_EMAIL = "newbornphotographynepal.studio@gmail.com";
const TARGET_DISPLAY_NAME = "Newborn Photography Nepal Admin";
const TARGET_PROJECT_ID = "booking-b7580";

export async function POST(req: NextRequest) {
  try {
    let body: { serviceAccount?: Record<string, unknown> } = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional if server has FIREBASE_SERVICE_ACCOUNT_KEY
    }

    let auth = getAdminAuth();
    let db = getAdminDb();

    // If caller provided service account credentials in the request
    if ((!auth || !db) && body.serviceAccount) {
      const customApp = initializeApp(
        {
          credential: cert(body.serviceAccount as Parameters<typeof cert>[0]),
          projectId: TARGET_PROJECT_ID,
        },
        `provision-${Date.now()}`
      );
      auth = getAuth(customApp);
      db = getFirestore(customApp);
    }

    if (!auth || !db) {
      return NextResponse.json(
        {
          success: false,
          error: "Firebase Admin SDK not initialized. Please provide serviceAccount credentials or configure FIREBASE_SERVICE_ACCOUNT_KEY.",
          instructions: {
            step1: "Download Service Account JSON from Firebase Console (Project Settings > Service Accounts)",
            step2: "Run CLI: node scripts/provision-existing-admin.mjs [path-to-key.json]",
            step3: "Or POST credentials to this endpoint: /api/admin/provision",
          },
        },
        { status: 503 }
      );
    }

    // 1. Verify Firebase Auth user
    const authUser = await auth.getUser(TARGET_UID);
    if (authUser.email?.toLowerCase() !== TARGET_EMAIL.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: `Email mismatch. Expected ${TARGET_EMAIL}, found ${authUser.email}`,
        },
        { status: 400 }
      );
    }

    // 2. Update Auth profile & claims
    await auth.updateUser(TARGET_UID, { displayName: TARGET_DISPLAY_NAME });
    await auth.setCustomUserClaims(TARGET_UID, { role: "admin", admin: true });

    // 3. Create or update Firestore user document
    const userDocRef = db.collection("users").doc(TARGET_UID);
    const docSnap = await userDocRef.get();
    const now = new Date().toISOString();
    let action = "UPDATED";

    if (docSnap.exists) {
      await userDocRef.update({
        role: "admin",
        active: true,
        displayName: TARGET_DISPLAY_NAME,
        email: TARGET_EMAIL,
        updatedAt: now,
      });
    } else {
      action = "CREATED";
      await userDocRef.set({
        uid: TARGET_UID,
        email: TARGET_EMAIL,
        displayName: TARGET_DISPLAY_NAME,
        role: "admin",
        phone: "",
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 4. Read back and verify
    const verifiedSnap = await userDocRef.get();
    const verifiedData = verifiedSnap.data();

    return NextResponse.json({
      success: true,
      action,
      documentPath: `users/${TARGET_UID}`,
      data: verifiedData,
      auth: {
        uid: authUser.uid,
        email: authUser.email,
        displayName: TARGET_DISPLAY_NAME,
        emailVerified: authUser.emailVerified,
      },
    });
  } catch (error: any) {
    console.error("Provisioning API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to provision administrator account",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/admin/provision",
    target: {
      projectId: TARGET_PROJECT_ID,
      uid: TARGET_UID,
      email: TARGET_EMAIL,
      role: "admin",
      status: "active",
      documentPath: `users/${TARGET_UID}`,
    },
    status: "Ready for trusted administrative provisioning",
  });
}
