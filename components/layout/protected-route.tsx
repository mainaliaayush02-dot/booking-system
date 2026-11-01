"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { Camera } from "lucide-react";

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
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-studio-100 border border-studio-200 flex items-center justify-center text-studio-600 shadow-subtle animate-pulse">
            <Camera className="w-7 h-7" />
          </div>
          <div className="text-center">
            <h2 className="font-serif text-xl font-medium tracking-tight text-charcoal-900">
              Newborn Photography Nepal
            </h2>
            <p className="text-xs uppercase tracking-widest text-charcoal-400 mt-1">
              Studio Management System
            </p>
          </div>
          <div className="w-24 h-1 bg-cream-200 rounded-full overflow-hidden">
            <div className="w-full h-full bg-studio-500 animate-[shimmer_1.5s_infinite]" />
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
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="studio-card p-8 rounded-xl max-w-md text-center">
          <h3 className="text-lg font-serif font-semibold text-charcoal-800">Access Restricted</h3>
          <p className="text-sm text-charcoal-500 mt-2">
            You do not have administrative permission to view this section. Please contact your studio manager.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

