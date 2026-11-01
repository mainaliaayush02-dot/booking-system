"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { Camera, Lock, Mail, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, signIn, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && firebaseUser) {
      router.push("/");
    }
  }, [loading, firebaseUser, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      router.push("/");
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      let msg = "Invalid login credentials. Please check your email and password.";
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        msg = "Incorrect email or password. Please verify your studio credentials.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Access temporarily disabled due to multiple failed login attempts. Please try again later.";
      } else if (err.code === "auth/user-disabled") {
        msg = "This studio account has been disabled. Please contact the studio manager.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Subtle Studio Backdrop Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-[#F2ECE1]/60 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-8">
        {/* Studio Identity Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white border border-[#EFE8DC] shadow-card flex items-center justify-center text-studio-600 mb-5">
            <Camera className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
            Newborn Photography Nepal
          </h1>
          <p className="mt-2 text-[11px] uppercase tracking-widest font-bold text-studio-600">
            Studio Management System
          </p>
          <p className="mt-1 text-xs text-charcoal-500">
            Internal Authorized Staff Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#EFE8DC] shadow-card rounded-2xl p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-[#F2ECE1]">
            <h2 className="text-sm font-serif font-semibold text-charcoal-800">
              Studio Staff Sign In
            </h2>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Enter your provisioned studio credentials to proceed
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 leading-relaxed font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@newbornphotonepal.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-sm text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Security Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-sm text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={submitting}
                className="w-full text-xs font-semibold tracking-wider uppercase py-3"
              >
                Sign In to Studio Portal
              </Button>
            </div>
          </form>

          {/* Access Policy Notice */}
          <div className="mt-6 pt-5 border-t border-[#F2ECE1] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-charcoal-500">
              <ShieldAlert className="w-3.5 h-3.5 text-studio-600" />
              <span>Restricted Access: No public registration</span>
            </div>
            <p className="text-[11px] text-charcoal-400 mt-1 leading-relaxed">
              Studio accounts must be provisioned by a Studio Administrator.
            </p>
          </div>
        </div>

        {/* System Timezone & Security notice */}
        <div className="text-center text-[11px] text-charcoal-400">
          <span>Operating in Asia/Kathmandu (NPT) • System ID: booking-b7580</span>
        </div>
      </div>
    </div>
  );
}
