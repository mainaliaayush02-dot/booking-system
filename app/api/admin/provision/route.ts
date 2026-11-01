import { NextRequest, NextResponse } from "next/server";

/**
 * SECURITY NOTICE:
 * Remote provisioning endpoint has been explicitly DISABLED to prevent
 * unauthorized privilege elevation or unauthenticated endpoint probing.
 * 
 * To provision or update administrator accounts, run the trusted CLI script
 * directly in an authenticated server terminal:
 *   node scripts/provision-existing-admin.mjs [path-to-serviceAccountKey.json]
 */

export async function GET() {
  return NextResponse.json(
    {
      error: "Forbidden",
      message: "Remote provisioning endpoint is disabled for security. Use the trusted CLI provisioning script: node scripts/provision-existing-admin.mjs",
    },
    { status: 403 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Forbidden",
      message: "Remote provisioning endpoint is disabled for security. Use the trusted CLI provisioning script: node scripts/provision-existing-admin.mjs",
    },
    { status: 403 }
  );
}
