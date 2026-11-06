"use client";

import React, { useEffect, useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import {
  Trash2,
  RotateCcw,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  X,
  Search,
} from "lucide-react";
import { getArchivedItems, restorePackage, restoreBooking } from "@/lib/firestore";
import { PhotographyPackage, Booking } from "@/lib/types";
import { useAuth } from "@/lib/firebase-auth";
import { formatNPR, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function TrashPage() {
  const { studioUser, isAdmin } = useAuth();
  const [archivedPackages, setArchivedPackages] = useState<PhotographyPackage[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"packages" | "bookings">("packages");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const { archivedPackages: pkgs, cancelledBookings: bks } = await getArchivedItems();
      setArchivedPackages(pkgs);
      setCancelledBookings(bks);
    } catch (err) {
      console.error("Error loading trash items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRestorePackage = async (pkg: PhotographyPackage) => {
    if (!studioUser || !isAdmin) {
      setFeedback({
        type: "error",
        message: "Unauthorized: Only studio administrators can restore packages.",
      });
      return;
    }
    try {
      await restorePackage(pkg.id, {
        uid: studioUser.uid,
        displayName: studioUser.displayName,
        role: studioUser.role,
      });
      setFeedback({
        type: "success",
        message: `Package "${pkg.name}" has been successfully restored to the active catalog.`,
      });
      await loadData();
    } catch (err: any) {
      console.error("Error restoring package:", err);
      setFeedback({
        type: "error",
        message: err?.message || "Failed to restore package.",
      });
    }
  };

  const handleRestoreBooking = async (b: Booking) => {
    if (!studioUser) return;
    try {
      await restoreBooking(b.id, "confirmed", {
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
      setFeedback({
        type: "success",
        message: `Booking #${b.bookingNumber} (${b.clientName}) has been restored to Confirmed status.`,
      });
      await loadData();
    } catch (err: any) {
      console.error("Error restoring booking:", err);
      setFeedback({
        type: "error",
        message: err?.message || "Failed to restore booking.",
      });
    }
  };

  return (
    <StudioLayout>
      <div className="space-y-5 pb-16 max-w-4xl mx-auto">
        {/* Header Bar */}
        <div className="bg-white border border-[#E8EBF0] p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[#D9272E]" />
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#252B38]">
                Studio Trash & Archive
              </h2>
            </div>
            <p className="text-xs text-[#8993A4] mt-0.5">
              Safely archived photography packages and cancelled booking sessions.
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border text-xs font-medium transition-all ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-current opacity-70 hover:opacity-100 p-1 cursor-pointer shrink-0 ml-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-white border border-[#E8EBF0] rounded-2xl shadow-sm w-fit">
          <button
            onClick={() => setActiveTab("packages")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "packages"
                ? "bg-[#D9272E] text-white shadow-subtle"
                : "text-[#8993A4] hover:text-[#252B38]"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Archived Packages ({archivedPackages.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "bookings"
                ? "bg-[#D9272E] text-white shadow-subtle"
                : "text-[#8993A4] hover:text-[#252B38]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Cancelled Bookings ({cancelledBookings.length})</span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="p-16 text-center bg-white border border-[#E8EBF0] rounded-3xl text-xs text-[#8993A4] animate-pulse">
            Loading archive...
          </div>
        ) : activeTab === "packages" ? (
          archivedPackages.length === 0 ? (
            <div className="p-16 text-center bg-white border border-[#E8EBF0] rounded-3xl">
              <Package className="w-8 h-8 text-[#8993A4] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-[#252B38]">No archived packages</p>
              <p className="text-xs text-[#8993A4] mt-1">
                Packages deleted with historical booking references are archived safely here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {archivedPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white border border-[#E8EBF0] rounded-3xl p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D084B] bg-[#FCEEEF] px-2.5 py-0.5 rounded-md">
                        {pkg.category}
                      </span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                        Archived
                      </span>
                    </div>

                    <h3 className="font-sans text-base font-bold text-[#252B38] mt-2.5">
                      {pkg.name}
                    </h3>
                    <p className="text-base font-bold text-[#252B38] mt-1">
                      {formatNPR(pkg.price)}
                    </p>

                    <div className="mt-2 text-xs text-[#8993A4] space-y-0.5">
                      {pkg.deletedAt && <p>Archived on: {formatDate(pkg.deletedAt)}</p>}
                      {pkg.deletedByName && <p>Archived by: {pkg.deletedByName}</p>}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E8EBF0] flex items-center justify-between">
                    <span className="text-[11px] text-[#8993A4]">
                      Historical references preserved
                    </span>
                    {isAdmin && (
                      <Button
                        variant="action"
                        size="sm"
                        onClick={() => handleRestorePackage(pkg)}
                        className="gap-1.5 cursor-pointer text-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Package</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : cancelledBookings.length === 0 ? (
          <div className="p-16 text-center bg-white border border-[#E8EBF0] rounded-3xl">
            <Calendar className="w-8 h-8 text-[#8993A4] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-[#252B38]">No cancelled bookings</p>
            <p className="text-xs text-[#8993A4] mt-1">Cancelled photography appointments appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cancelledBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-[#E8EBF0] rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#252B38]">#{b.bookingNumber}</span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                      Cancelled
                    </span>
                  </div>
                  <h4 className="font-sans text-sm font-bold text-[#252B38] mt-1 truncate">
                    {b.clientName} • {b.packageName}
                  </h4>
                  <p className="text-xs text-[#8993A4] mt-0.5">
                    Original Date: {b.appointmentDate} ({b.startTime} - {b.endTime})
                  </p>
                  {b.cancellationReason && (
                    <p className="text-xs text-[#8993A4] italic mt-1">
                      Reason: "{b.cancellationReason}"
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestoreBooking(b)}
                  className="gap-1.5 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#D9272E]" />
                  <span>Restore</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudioLayout>
  );
}
