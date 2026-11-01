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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#3D084B]" />
              <h2 className="font-serif text-2xl font-bold text-[#3D084B]">
                Studio Settings & Configuration
              </h2>
            </div>
            <p className="text-sm text-[#846F7F] mt-1">
              Internal studio metadata, timezone defaults, team access, and Firebase status.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#3D084B] bg-[#FAF2F7] border border-[#EBD8E1] px-3.5 py-1.5 rounded-full">
            v1.0.0 Production
          </span>
        </div>

        {/* Studio System Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B] shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#846F7F] font-bold uppercase tracking-wider">Studio Brand</p>
              <h4 className="text-sm font-bold text-[#332A34] mt-0.5">
                Newborn Photography Nepal
              </h4>
              <p className="text-[11px] text-[#68456E] mt-1 font-medium">By Navin • Internal Portal</p>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#846F7F] font-bold uppercase tracking-wider">System Timezone</p>
              <h4 className="text-sm font-bold text-[#332A34] mt-0.5">
                Asia/Kathmandu (NPT)
              </h4>
              <p className="text-[11px] text-[#68456E] mt-1 font-medium">GMT+5:45 appointment schedules</p>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B] shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#846F7F] font-bold uppercase tracking-wider">Studio Currency</p>
              <h4 className="text-sm font-bold text-[#332A34] mt-0.5">
                NPR (Nepalese Rupee)
              </h4>
              <p className="text-[11px] text-[#68456E] mt-1 font-medium">Default for all packages and sales</p>
            </div>
          </Card>
        </div>

        {/* Database & Cloud Connection Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EBD8E1]">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#3D084B]" />
              <h3 className="font-serif font-bold text-[#3D084B]">
                Connected Cloud Infrastructure
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Online & Connected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
            <div>
              <span className="text-[#846F7F] block font-medium">Firebase Project:</span>
              <span className="font-mono text-[#332A34] font-bold">booking-b7580</span>
            </div>
            <div>
              <span className="text-[#846F7F] block font-medium">Auth Domain:</span>
              <span className="font-mono text-[#332A34] font-bold">booking-b7580.firebaseapp.com</span>
            </div>
            <div>
              <span className="text-[#846F7F] block font-medium">Database:</span>
              <span className="font-mono text-[#332A34] font-bold">Cloud Firestore</span>
            </div>
            <div>
              <span className="text-[#846F7F] block font-medium">Storage Bucket:</span>
              <span className="font-mono text-[#332A34] font-bold">booking-b7580.firebasestorage.app</span>
            </div>
          </div>
        </Card>

        {/* Admin Team Management */}
        {isAdmin && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBD8E1]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#3D084B]" />
                <h3 className="font-serif font-bold text-[#3D084B]">
                  Provision Studio Staff Account
                </h3>
              </div>
              <span className="text-xs text-[#846F7F] font-semibold">Admin Authorization Only</span>
            </div>

            <p className="text-xs text-[#846F7F]">
              Internal user provisioning. Only authorized studio staff and photographers may have accounts.
            </p>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Suman Shakya"
                  className="w-full px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@newbornphotonepal.com"
                  className="w-full px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Studio Role
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
                >
                  <option value="staff">Staff (Bookings & Payments)</option>
                  <option value="photographer">Photographer (Calendar & Sessions)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold shadow-subtle"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{submitting ? "Adding..." : "Add Team Member"}</span>
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </StudioLayout>
  );
}
