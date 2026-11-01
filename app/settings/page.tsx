"use client";

import React, { useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { useAuth } from "@/lib/firebase-auth";
import {
  Settings,
  Shield,
  Clock,
  Coins,
  Building,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react";
import { UserRole } from "@/lib/types";

export default function SettingsPage() {
  const { studioUser, isAdmin, createStudioUser } = useAuth();

  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<UserRole>("staff");
  const [staffPhone, setStaffPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await createStudioUser(
        staffEmail.trim(),
        staffPassword,
        staffName.trim(),
        staffRole,
        staffPhone.trim()
      );
      setSuccess(`Studio team member ${staffName} (${staffRole}) was successfully created.`);
      setStaffEmail("");
      setStaffPassword("");
      setStaffName("");
      setStaffPhone("");
    } catch (err: any) {
      console.error("Error creating staff:", err);
      setError(err.message || "Failed to create studio account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudioLayout>
      <div className="space-y-6">
        <div className="bg-white border border-[#EFE8DC] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-studio-600" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal-900">
                Studio Settings & Configuration
              </h2>
            </div>
            <p className="text-sm text-charcoal-500 mt-1">
              Internal studio metadata, timezone defaults, team access, and Firebase status.
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-studio-700 bg-studio-50 border border-studio-200 px-3 py-1.5 rounded-full">
            v1.0.0 Production
          </span>
        </div>

        {/* Studio System Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-studio-50 border border-studio-200 flex items-center justify-center text-studio-600 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-charcoal-400 font-semibold uppercase tracking-wider">Studio Name</p>
              <h4 className="text-sm font-semibold text-charcoal-900 mt-0.5">
                Newborn Photography Nepal
              </h4>
              <p className="text-[11px] text-charcoal-500 mt-1">Authorized Internal Portal</p>
            </div>
          </div>

          <div className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-studio-50 border border-studio-200 flex items-center justify-center text-studio-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-charcoal-400 font-semibold uppercase tracking-wider">System Timezone</p>
              <h4 className="text-sm font-semibold text-charcoal-900 mt-0.5">
                Asia/Kathmandu (NPT)
              </h4>
              <p className="text-[11px] text-charcoal-500 mt-1">GMT+5:45 for all booking schedules</p>
            </div>
          </div>

          <div className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-studio-50 border border-studio-200 flex items-center justify-center text-studio-600 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-charcoal-400 font-semibold uppercase tracking-wider">Studio Currency</p>
              <h4 className="text-sm font-semibold text-charcoal-900 mt-0.5">
                NPR (Nepalese Rupee)
              </h4>
              <p className="text-[11px] text-charcoal-500 mt-1">Default for all packages and sales</p>
            </div>
          </div>
        </div>

        {/* Database & Cloud Connection Status */}
        <div className="bg-white border border-[#EFE8DC] p-6 rounded-2xl shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-cream-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-studio-600" />
              <h3 className="font-serif font-semibold text-charcoal-900">
                Connected Cloud Infrastructure
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Online & Connected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
            <div>
              <span className="text-charcoal-400 block font-medium">Firebase Project:</span>
              <span className="font-mono text-charcoal-800 font-semibold">booking-b7580</span>
            </div>
            <div>
              <span className="text-charcoal-400 block font-medium">Auth Domain:</span>
              <span className="font-mono text-charcoal-800 font-semibold">booking-b7580.firebaseapp.com</span>
            </div>
            <div>
              <span className="text-charcoal-400 block font-medium">Database:</span>
              <span className="font-mono text-charcoal-800 font-semibold">Cloud Firestore</span>
            </div>
            <div>
              <span className="text-charcoal-400 block font-medium">Storage Bucket:</span>
              <span className="font-mono text-charcoal-800 font-semibold">booking-b7580.firebasestorage.app</span>
            </div>
          </div>
        </div>

        {/* Admin Team Management */}
        {isAdmin && (
          <div className="bg-white border border-[#EFE8DC] p-6 rounded-2xl shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-studio-600" />
                <h3 className="font-serif font-semibold text-charcoal-900">
                  Add Studio Team Member
                </h3>
              </div>
              <span className="text-xs text-charcoal-400">Admin Only</span>
            </div>

            <p className="text-xs text-charcoal-500">
              Create an internal staff, photographer, or admin login account. Clients do not have access to this portal.
            </p>

            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Suman Shakya"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@newbornphotonepal.com"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Studio Role
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500"
                >
                  <option value="staff">Staff (Bookings & Payments)</option>
                  <option value="photographer">Photographer (Calendar & Sessions)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E8DFD3] rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-studio-500/20 focus:border-studio-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-studio-600 hover:bg-studio-700 text-white text-xs font-semibold shadow-subtle transition-all disabled:opacity-60"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{submitting ? "Adding..." : "Add Team Member"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </StudioLayout>
  );
}

