"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "staff" | "photographer";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { firebaseUser, studioUser, loading, profileError, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Hard safety timeout: If loading takes longer than 2.5s, force resolve loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasTimedOut(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!loading && !firebaseUser && pathname !== "/login") {
      router.replace("/login");
      const fallback = setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }, 500);
      return () => clearTimeout(fallback);
    }
  }, [loading, firebaseUser, router, pathname]);

  // Loading Screen (shown only while authenticating, max 2.5s)
  if (loading && !hasTimedOut) {
    return (
      <div className="min-h-screen bg-[#F5E5EB] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 min-w-[64px] max-w-[64px] min-h-[64px] max-h-[64px] rounded-2xl bg-[#FFFAFC] border border-[#EBD8E1] p-1.5 flex items-center justify-center shadow-card animate-pulse shrink-0">
            <img
              src="/brand/logo.jpg"
              alt="Newborn Photography Nepal"
              width={52}
              height={52}
              className="w-full h-full max-w-full max-h-full object-contain aspect-square rounded-xl"
            />
          </div>
          <div className="text-center">
            <h2 className="font-serif text-base font-bold tracking-tight text-[#3D084B]">
              Newborn Photography Nepal
            </h2>
            <p className="text-[9px] uppercase tracking-widest text-[#846F7F] mt-0.5 font-bold">
              Studio Portal • By Navin
            </p>
          </div>
          <div className="w-20 h-1 bg-[#EBD8E1] rounded-full overflow-hidden">
            <div className="w-full h-full bg-[#3D084B] animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!firebaseUser) {
    return null;
  }

  // Authenticated in Firebase, but missing/invalid Firestore studio profile
  if (!studioUser) {
    return (
      <div className="min-h-screen bg-[#F5E5EB] flex items-center justify-center p-6">
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-8 rounded-3xl max-w-md w-full text-center shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-[#3D084B]">
              Studio Access Required
            </h3>
            <p className="text-xs text-[#846F7F] mt-2 leading-relaxed">
              Authenticated as <strong className="text-[#332A34]">{firebaseUser.email}</strong>, but no active studio staff document or authorized administrative role was found in the database.
            </p>
            {profileError && (
              <p className="text-[11px] text-amber-800 font-medium bg-amber-50 p-2 rounded-xl mt-2 border border-amber-200">
                {profileError}
              </p>
            )}
            <p className="text-[11px] text-[#846F7F] mt-2">
              Please contact the studio manager to verify your administrative access.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={async () => {
                await signOut();
                window.location.replace("/login");
              }}
              className="w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Return to Login</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Role check
  if (requiredRole && studioUser.role !== "admin" && studioUser.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-[#F5E5EB] flex items-center justify-center p-6">
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-8 rounded-3xl max-w-md text-center shadow-subtle space-y-3">
          <h3 className="text-lg font-serif font-bold text-[#3D084B]">Access Restricted</h3>
          <p className="text-xs text-[#846F7F] leading-relaxed">
            You are signed in as <strong className="capitalize">{studioUser.role}</strong> ({studioUser.email}). You do not have administrative permission to view this section.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.replace("/")}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
}
