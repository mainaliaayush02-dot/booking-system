"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Booking, BookingStatus } from "@/lib/types";
import { updateBooking, rescheduleBooking, cancelBooking } from "@/lib/firestore";
import {
  formatNPR,
  formatDate,
  formatTime12h,
  getStatusBadgeStyle,
} from "@/lib/utils";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Camera,
  MapPin,
  Heart,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Edit2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/firebase-auth";

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onEdit: (booking: Booking) => void;
  onUpdated: () => void;
}

export function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  onEdit,
  onUpdated,
}: BookingDetailModalProps) {
  const { studioUser, isAdmin } = useAuth();

  // Mode toggles
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("11:00");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("13:00");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleConflictOverride, setRescheduleConflictOverride] = useState(false);

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!booking) return null;

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (!studioUser) return;
    try {
      setSubmitting(true);
      await updateBooking(booking.id, { status: newStatus }, {
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      setActionError(err.message || "Failed to update status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleStartTime || !rescheduleEndTime) {
      setActionError("Please provide new date, start time, and end time.");
      return;
    }
    if (!rescheduleReason.trim()) {
      setActionError("Please provide a reason for rescheduling.");
      return;
    }
    if (!studioUser) return;

    setActionError(null);
    setSubmitting(true);
    try {
      await rescheduleBooking(
        booking.id,
        rescheduleDate,
        rescheduleStartTime,
        rescheduleEndTime,
        rescheduleReason.trim(),
        rescheduleConflictOverride,
        {
          uid: studioUser.uid,
          displayName: studioUser.displayName,
        }
      );
      setIsRescheduling(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error("Reschedule error:", err);
      setActionError(err.message || "Failed to reschedule booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      setActionError("Please state a reason for cancelling this booking.");
      return;
    }
    if (!studioUser) return;

    setActionError(null);
    setSubmitting(true);
    try {
      await cancelBooking(booking.id, cancellationReason.trim(), {
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
      setIsCancelling(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      console.error("Cancellation error:", err);
      setActionError(err.message || "Failed to cancel booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Booking ${booking.bookingNumber}`}
      subtitle={`${booking.clientName} • ${booking.packageName}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {actionError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{actionError}</span>
          </div>
        )}

        {/* Reschedule View Mode */}
        {isRescheduling ? (
          <form onSubmit={handleConfirmReschedule} className="space-y-4 p-5 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#3D084B]">
              <RotateCcw className="w-4 h-4" />
              <span>Reschedule Photography Appointment</span>
            </div>

            <p className="text-xs text-[#846F7F]">
              Current session: {formatDate(booking.appointmentDate)} at {formatTime12h(booking.startTime)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  New Photoshoot Date *
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EBD8E1] rounded-xl text-xs text-[#332A34]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  New Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleStartTime}
                  onChange={(e) => {
                    setRescheduleStartTime(e.target.value);
                    // auto add duration
                    const [h, m] = e.target.value.split(":");
                    const dur = booking.durationMinutes || 120;
                    const tot = parseInt(h, 10) * 60 + parseInt(m, 10) + dur;
                    setRescheduleEndTime(
                      `${String(Math.floor(tot / 60) % 24).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`
                    );
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#EBD8E1] rounded-xl text-xs text-[#332A34]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  New End Time *
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleEndTime}
                  onChange={(e) => setRescheduleEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EBD8E1] rounded-xl text-xs text-[#332A34]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#332A34] mb-1">
                Reason for Rescheduling *
              </label>
              <textarea
                rows={2}
                required
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Baby arrived early / family requested afternoon slot..."
                className="w-full px-3 py-2 bg-white border border-[#EBD8E1] rounded-xl text-xs text-[#332A34]"
              />
            </div>

            {isAdmin && (
              <label className="flex items-center gap-2 text-xs font-bold text-[#3D084B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rescheduleConflictOverride}
                  onChange={(e) => setRescheduleConflictOverride(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3D084B]"
                />
                <span>Administrator Override (Allow concurrent slot if overlapping)</span>
              </label>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRescheduling(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                Confirm Reschedule
              </Button>
            </div>
          </form>
        ) : isCancelling ? (
          <form onSubmit={handleConfirmCancel} className="space-y-4 p-5 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="flex items-center gap-2 text-sm font-bold text-rose-800">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Cancel Photography Booking</span>
            </div>

            <p className="text-xs text-rose-700 leading-relaxed">
              Cancelled bookings will not be deleted; they remain in historical studio records for accounting and audit compliance. The appointment slot will be released.
            </p>

            <div>
              <label className="block text-xs font-bold text-rose-900 mb-1">
                Cancellation Reason *
              </label>
              <textarea
                rows={2}
                required
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="State the cancellation reason (e.g. Client relocated, medical emergency)..."
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-charcoal-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCancelling(false)}>
                Keep Booking Active
              </Button>
              <Button type="submit" variant="danger" size="sm" isLoading={submitting}>
                Confirm Cancellation
              </Button>
            </div>
          </form>
        ) : (
          <>
            {/* Top Stat Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Booking Status
                </span>
                <div className="mt-1">
                  <span
                    className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Contracted Total
                </span>
                <p className="text-base font-serif font-bold text-[#3D084B] mt-1">
                  {formatNPR(booking.totalAmount)}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Advance Paid
                </span>
                <p className="text-base font-serif font-bold text-emerald-800 mt-1">
                  {formatNPR(booking.advancePaid || 0)}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Balance Due
                </span>
                <p className="text-base font-serif font-bold text-amber-800 mt-1">
                  {formatNPR(booking.remainingBalance)}
                </p>
              </div>
            </div>

            {/* Main Info Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 rounded-2xl bg-white border border-[#EBD8E1]">
              {/* Client & Baby Info */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold uppercase text-[#3D084B] border-b border-[#EBD8E1] pb-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Client & Baby</span>
                </div>

                <div>
                  <span className="text-[#846F7F] block">Client / Parent Name:</span>
                  <span className="font-bold text-sm text-[#332A34]">{booking.clientName}</span>
                </div>

                <div>
                  <span className="text-[#846F7F] block">Phone Contact:</span>
                  <span className="font-semibold text-[#3D084B] flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#3D084B]" />
                    <span>{booking.clientPhone}</span>
                  </span>
                </div>

                {booking.babyName && (
                  <div>
                    <span className="text-[#846F7F] block">Baby Profile:</span>
                    <span className="font-semibold text-[#3D084B] flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-[#3D084B]" />
                      <span>{booking.babyName}</span>
                      {booking.babyDob && (
                        <span className="text-[#846F7F] font-normal">
                          (Born: {formatDate(booking.babyDob)})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Photoshoot Schedule Info */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold uppercase text-[#3D084B] border-b border-[#EBD8E1] pb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Session Schedule & Location</span>
                </div>

                <div>
                  <span className="text-[#846F7F] block">Appointment Date:</span>
                  <span className="font-bold text-sm text-[#3D084B]">
                    {formatDate(booking.appointmentDate)}
                  </span>
                </div>

                <div>
                  <span className="text-[#846F7F] block">Time Slot:</span>
                  <span className="font-semibold text-[#332A34] flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#846F7F]" />
                    <span>
                      {formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)} ({booking.durationMinutes} mins)
                    </span>
                  </span>
                </div>

                <div>
                  <span className="text-[#846F7F] block">Location & Photographer:</span>
                  <span className="font-semibold text-[#332A34] flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#846F7F]" />
                    <span className="capitalize">{booking.location || "Studio"}</span>
                    <span>• Assigned: {booking.photographerName || "Navin"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Package Snapshot & Inclusions */}
            <div className="p-4 rounded-2xl bg-[#FAF2F7]/50 border border-[#EBD8E1] text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-[#EBD8E1] pb-1.5">
                <span className="font-bold uppercase tracking-wider text-[#3D084B] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Package Snapshot: {booking.packageName}</span>
                </span>
                <span className="font-bold text-[#3D084B] font-serif text-sm">
                  {formatNPR(booking.packagePriceSnapshot)}
                </span>
              </div>

              {booking.packageSnapshot?.inclusions && booking.packageSnapshot.inclusions.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {booking.packageSnapshot.inclusions.map((inc, i) => (
                    <li key={i} className="text-[#332A34] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3D084B]" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#846F7F] italic">No specific inclusions snapshot recorded</p>
              )}
            </div>

            {/* Special Instructions & Notes */}
            {(booking.specialInstructions || booking.notes) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {booking.specialInstructions && (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#EBD8E1]">
                    <span className="font-bold uppercase text-[#3D084B] block mb-1">
                      Special Client Instructions:
                    </span>
                    <p className="text-[#332A34] leading-relaxed italic">
                      "{booking.specialInstructions}"
                    </p>
                  </div>
                )}
                {booking.notes && (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#EBD8E1]">
                    <span className="font-bold uppercase text-[#3D084B] block mb-1">
                      Internal Studio Notes:
                    </span>
                    <p className="text-[#332A34] leading-relaxed italic">"{booking.notes}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Rescheduled / Cancelled History */}
            {booking.status === "rescheduled" && booking.rescheduledFromDate && (
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                  <span>Rescheduled from: {formatDate(booking.rescheduledFromDate)} at {formatTime12h(booking.rescheduledFromTime)}</span>
                </span>
                {booking.rescheduleReason && (
                  <p className="text-purple-800 text-[11px]">Reason: {booking.rescheduleReason}</p>
                )}
              </div>
            )}

            {booking.status === "cancelled" && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-700" />
                  <span>Cancelled on {formatDate(booking.cancelledAt || booking.updatedAt)}</span>
                </span>
                {booking.cancellationReason && (
                  <p className="text-rose-800 text-[11px]">Reason: {booking.cancellationReason}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal Bottom Actions - Sticky Footer */}
        {!isRescheduling && !isCancelling && (
          <div className="pt-4 border-t border-[#EBD8E1] flex flex-wrap items-center justify-between gap-3 sticky bottom-0 bg-[#FFFAFC] py-3.5 -mb-6 -mx-6 px-6 shadow-card">
            {/* Quick Status Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#846F7F] font-semibold">Status:</span>
              <select
                value={booking.status}
                onChange={(e) => handleStatusChange(e.target.value as BookingStatus)}
                disabled={submitting}
                className="px-2.5 py-1.5 bg-[#FAF2F7] border border-[#EBD8E1] rounded-xl text-xs font-bold text-[#3D084B] cursor-pointer"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Edit / Reschedule / Cancel Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {booking.status !== "cancelled" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRescheduleDate(booking.appointmentDate);
                      setRescheduleStartTime(booking.startTime);
                      setRescheduleEndTime(booking.endTime);
                      setIsRescheduling(true);
                    }}
                    className="gap-1.5 text-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onEdit(booking);
                    }}
                    className="gap-1.5 text-xs cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCancelling(true)}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </Button>
                </>
              )}

              <Button type="button" variant="primary" size="sm" onClick={onClose} className="cursor-pointer">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

