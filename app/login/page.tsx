"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { Camera, Lock, Mail, AlertCircle, Shield, CheckCircle2, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, signIn, createStudioUser, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // First-time studio setup toggle for initial admin creation
  const [showSetup, setShowSetup] = useState(false);
  const [setupName, setSetupName] = useState("Studio Director");
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);

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
      console.error("Login failed:", err);
      let msg = "Invalid login credentials. Please verify your email and password.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "Invalid email or password. If this is a fresh setup, use Studio Staff Setup below.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many failed login attempts. Please wait a few minutes and try again.";
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSetupSuccess(null);
    setSubmitting(true);

    try {
      await createStudioUser(
        email.trim(),
        password,
        setupName.trim() || "Studio Director",
        "admin"
      );
      setSetupSuccess("Admin profile successfully initialized! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err: any) {
      console.error("Setup error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This account already exists. Please log in directly with your password.");
        setShowSetup(false);
      } else {
        setError(err.message || "Failed to initialize studio account.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Subtle aesthetic backdrop accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#F2ECE1]/50 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-8">
        {/* Header with Studio Identity */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white border border-[#EFE8DC] shadow-card flex items-center justify-center text-studio-600 mb-5">
            <Camera className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
            Newborn Photography Nepal
          </h2>
          <p className="mt-2 text-xs uppercase tracking-widest font-semibold text-studio-600">
            Internal Studio Management Portal
          </p>
          <p className="mt-1 text-xs text-charcoal-500">
            Authorized studio staff & photographer access only
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#EFE8DC] shadow-card rounded-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 rounded-lg bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 leading-relaxed">{error}</p>
            </div>
          )}

          {setupSuccess && (
            <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 leading-relaxed">{setupSuccess}</p>
            </div>
          )}

          {!showSetup ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Studio Staff Email
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@newbornphotonepal.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-sm text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-sm text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-studio-600 hover:bg-studio-700 text-white text-sm font-semibold tracking-wide shadow-subtle hover:shadow transition-all disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Sign In to Studio"}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowSetup(true);
                  }}
                  className="text-xs text-studio-700 hover:text-studio-800 underline decoration-studio-300 font-medium inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Initial Studio Setup (First Admin)
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleInitialSetup} className="space-y-4">
              <div className="rounded-lg bg-sand-50 border border-sand-200 p-3 mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-studio-800">
                  <Shield className="w-4 h-4 text-studio-600" />
                  <span>First-Time Admin Setup</span>
                </div>
                <p className="text-[11px] text-charcoal-600 mt-1 leading-relaxed">
                  Use this form to initialize the primary studio administrator profile for Newborn Photography Nepal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Administrator Name
                </label>
                <input
                  type="text"
                  required
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="e.g. Studio Director / Aayush"
                  className="block w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@newbornphotonepal.com"
                  className="block w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Master Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-studio-600 hover:bg-studio-700 text-white text-sm font-semibold tracking-wide shadow-subtle hover:shadow transition-all disabled:opacity-60"
                >
                  {submitting ? "Initializing..." : "Create Admin Account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowSetup(false);
                  }}
                  className="text-xs text-charcoal-500 hover:text-charcoal-800 text-center py-1"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-[11px] text-charcoal-400">
            Protected internal system. IP logging and session auditing are active.
          </p>
        </div>
      </div>
    </div>
  );
}
