"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { Lock, Mail, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, studioUser, signIn, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated and verified, redirect to dashboard
  useEffect(() => {
    if (!loading && firebaseUser && studioUser && studioUser.active) {
      router.replace("/");
    }
  }, [loading, firebaseUser, studioUser, router]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (submitting) return;
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setSubmitting(true);

    try {
      const profile = await signIn(cleanEmail, password);

      // Verify that user profile and active status exist before redirecting
      if (!profile || !profile.active) {
        throw new Error("This account is not authorized or has been deactivated.");
      }

      // Successful authentication & authorization -> redirect to dashboard
      router.replace("/");

      // Fallback navigation in case client router transition is delayed
      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/login") {
          window.location.replace("/");
        }
      }, 500);
    } catch (err: any) {
      console.error("[LOGIN_ERROR]", err);
      let msg = "Invalid login credentials. Please check your email and password.";

      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        msg = "Incorrect email address or password. Please verify your studio credentials.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Access temporarily disabled due to multiple failed login attempts. Please try again in a few minutes.";
      } else if (err.code === "auth/user-disabled") {
        msg = "This studio account has been disabled. Please contact the studio manager.";
      } else if (err.code === "auth/network-request-failed") {
        msg = "Network connection failed. Please check your internet connection.";
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E5EB] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative overflow-hidden">
      {/* Soft Ambient Studio Backdrop Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-[#EAD1DC]/60 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-4">
        {/* Official Studio Brand Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-28 h-20 min-w-[112px] max-w-[112px] min-h-[80px] max-h-[80px] rounded-2xl bg-white border border-[#EBD8E1] shadow-card p-1.5 flex items-center justify-center mb-2 transition-transform hover:scale-[1.01] shrink-0">
            <img
              src="/brand/logo.jpg"
              alt="Newborn Photography Nepal by Navin"
              width={96}
              height={68}
              className="w-full h-full max-w-full max-h-full object-contain rounded-xl"
            />
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#3D084B]">
            Studio Management Portal
          </h1>
          <p className="mt-0.5 text-xs text-[#846F7F]">
            Authorized studio staff & administrator access only
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] shadow-card rounded-3xl p-6 sm:p-7">
          <div className="mb-4 pb-3 border-b border-[#EBD8E1]">
            <h2 className="text-xs font-serif font-bold text-[#3D084B] uppercase tracking-wider">
              Staff Sign In
            </h2>
            <p className="text-xs text-[#846F7F] mt-0.5">
              Enter your provisioned studio credentials to proceed
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 leading-relaxed font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignIn} noValidate className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1">
                Staff Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#846F7F]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@newbornphotonepal.com"
                  disabled={submitting}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] placeholder-[#846F7F]/60 focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1">
                Security Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#846F7F]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={submitting}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] placeholder-[#846F7F]/60 focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B] transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={submitting}
                disabled={submitting || !email.trim() || !password}
                className="w-full text-xs font-bold tracking-wider uppercase py-3 rounded-xl bg-[#3D084B] hover:bg-[#521363] text-white shadow-subtle cursor-pointer"
              >
                {submitting ? "Signing In..." : "Sign In to Studio Portal"}
              </Button>
            </div>
          </form>

          {/* Access Policy Notice */}
          <div className="mt-5 pt-3.5 border-t border-[#EBD8E1] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#846F7F]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#3D084B]" />
              <span className="font-medium">Restricted Access: No public registration</span>
            </div>
            <p className="text-[11px] text-[#846F7F] mt-0.5 leading-relaxed">
              Studio accounts are provisioned exclusively by Studio Administration.
            </p>
          </div>
        </div>

        {/* System Timezone & Security notice */}
        <div className="text-center text-[10px] text-[#846F7F]">
          <span>Asia/Kathmandu (NPT) • Newborn Photography Nepal • By Navin</span>
        </div>
      </div>
    </div>
  );
}
