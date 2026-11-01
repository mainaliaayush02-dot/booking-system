"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { Lock, Mail, AlertCircle, ShieldAlert } from "lucide-react";
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
    <div className="min-h-screen bg-[#F5E5EB] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Soft Ambient Studio Backdrop Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-[#EAD1DC]/60 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-8">
        {/* Prominent Official Brand Logo */}
        <div className="text-center flex flex-col items-center">
          <div className="w-56 h-36 rounded-2xl bg-white border border-[#EBD8E1] shadow-card p-3 flex items-center justify-center mb-4 transition-transform hover:scale-[1.01]">
            <img
              src="/brand/logo.jpg"
              alt="Newborn Photography Nepal by Navin"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#3D084B]">
            Studio Management Portal
          </h1>
          <p className="mt-1 text-xs text-[#846F7F]">
            Authorized studio staff & photographer access only
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] shadow-card rounded-3xl p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-[#EBD8E1]">
            <h2 className="text-sm font-serif font-bold text-[#3D084B]">
              Staff Sign In
            </h2>
            <p className="text-xs text-[#846F7F] mt-0.5">
              Enter your provisioned studio credentials to proceed
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 leading-relaxed font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1.5">
                Staff Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#846F7F]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@newbornphotonepal.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] placeholder-[#846F7F]/60 focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1.5">
                Security Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#846F7F]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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
                className="w-full text-xs font-bold tracking-wider uppercase py-3 rounded-xl bg-[#3D084B] hover:bg-[#32063E] text-white shadow-subtle"
              >
                Sign In to Studio Portal
              </Button>
            </div>
          </form>

          {/* Access Policy Notice */}
          <div className="mt-6 pt-5 border-t border-[#EBD8E1] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#846F7F]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#3D084B]" />
              <span className="font-medium">Restricted Access: No public registration</span>
            </div>
            <p className="text-[11px] text-[#846F7F] mt-1 leading-relaxed">
              Studio accounts are provisioned exclusively by Studio Administration.
            </p>
          </div>
        </div>

        {/* System Timezone & Security notice */}
        <div className="text-center text-[11px] text-[#846F7F]">
          <span>Asia/Kathmandu (NPT) • Newborn Photography Nepal • By Navin</span>
        </div>
      </div>
    </div>
  );
}
