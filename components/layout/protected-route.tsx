"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "staff" | "photographer";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { firebaseUser, studioUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !firebaseUser && pathname !== "/login") {
      router.push("/login");
    }
  }, [loading, firebaseUser, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5E5EB] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-2xl bg-[#FFFAFC] border border-[#EBD8E1] p-2 flex items-center justify-center shadow-card animate-pulse">
            <img
              src="/brand/logo.jpg"
              alt="Newborn Photography Nepal"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center">
            <h2 className="font-serif text-lg font-bold tracking-tight text-[#3D084B]">
              Newborn Photography Nepal
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-[#846F7F] mt-0.5 font-bold">
              Studio Portal • By Navin
            </p>
          </div>
          <div className="w-24 h-1 bg-[#EBD8E1] rounded-full overflow-hidden">
            <div className="w-full h-full bg-[#3D084B] animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  if (requiredRole && studioUser?.role !== "admin" && studioUser?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-[#F5E5EB] flex items-center justify-center p-6">
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-8 rounded-2xl max-w-md text-center shadow-subtle">
          <h3 className="text-lg font-serif font-bold text-[#3D084B]">Access Restricted</h3>
          <p className="text-xs text-[#846F7F] mt-2">
            You do not have administrative permission to view this section. Please contact your studio manager.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
