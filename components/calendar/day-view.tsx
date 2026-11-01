"use client";

import React from "react";
import { format } from "date-fns";
import { Booking } from "@/lib/types";
import {
  formatNPR,
  formatDate,
  formatTime12h,
  getStatusBadgeStyle,
} from "@/lib/utils";
import {
  Clock,
  User,
  Phone,
  Heart,
  Camera,
  MapPin,
  Check,
  Plus,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DayViewProps {
  currentDate: Date;
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onSelectSlot: (dateStr: string, timeStr: string) => void;
}

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

export function DayView({
  currentDate,
  bookings,
  onSelectBooking,
  onSelectSlot,
}: DayViewProps) {
  const dateStr = format(currentDate, "yyyy-MM-dd");
  const dayBookings = bookings
    .filter((b) => b.appointmentDate === dateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getBookingsForHour = (hourStr: string) => {
    const hourPrefix = hourStr.split(":")[0];
    return dayBookings.filter((b) => b.startTime.startsWith(hourPrefix));
  };

  return (
    <div className="space-y-4">
      {/* Date Banner */}
      <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-5 rounded-3xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
            Daily Schedule View
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#3D084B]">
            {format(currentDate, "EEEE, dd MMMM yyyy")}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#FAF2F7] border border-[#EBD8E1] text-[#3D084B] w-fit">
            {dayBookings.length} {dayBookings.length === 1 ? "Session Scheduled" : "Sessions Scheduled"}
          </span>
        </div>
      </div>

      {/* Timeline Rows */}
      <div className="space-y-3">
        {HOURS.map((hour) => {
          const slotBookings = getBookingsForHour(hour);

          return (
            <div
              key={hour}
              className="bg-[#FFFAFC] border border-[#EBD8E1] rounded-3xl p-4 sm:p-5 shadow-subtle flex flex-col md:flex-row md:items-start gap-4 transition-all"
            >
              {/* Hour Column */}
              <div className="w-full md:w-28 shrink-0 flex items-center md:flex-col md:items-start justify-between border-b md:border-b-0 md:border-r border-[#EBD8E1] pb-2 md:pb-0 md:pr-4">
                <span className="text-sm font-bold text-[#3D084B] font-mono">
                  {formatTime12h(hour)}
                </span>
                <span className="text-[10px] text-[#846F7F] font-medium">Start Slot</span>
              </div>

              {/* Slot Content */}
              <div className="flex-1 min-w-0">
                {slotBookings.length > 0 ? (
                  <div className="space-y-3">
                    {slotBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className={`p-4 sm:p-5 rounded-2xl border shadow-subtle transition-all cursor-pointer hover:border-[#D6A3C7] ${getStatusBadgeStyle(
                          b.status
                        )}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold">
                              {b.bookingNumber}
                            </span>
                            <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-white/80 border border-black/10">
                              {b.status}
                            </span>
                          </div>

                          <div className="text-xs font-semibold flex items-center gap-2 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {formatTime12h(b.startTime)} – {formatTime12h(b.endTime)} ({b.durationMinutes} mins)
                            </span>
                          </div>
                        </div>

                        {/* Session Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5 text-xs">
                          <div>
                            <span className="opacity-75 block text-[10px] uppercase font-bold">Client & Baby:</span>
                            <p className="font-bold text-sm text-[#332A34] truncate">{b.clientName}</p>
                            {b.babyName && (
                              <p className="flex items-center gap-1 font-medium mt-0.5 text-[#68456E]">
                                <Heart className="w-3 h-3 text-[#3D084B]" />
                                <span>Baby: {b.babyName}</span>
                              </p>
                            )}
                          </div>

                          <div>
                            <span className="opacity-75 block text-[10px] uppercase font-bold">Package & Service:</span>
                            <p className="font-bold text-[#3D084B] truncate">{b.packageName}</p>
                            <p className="text-[11px] opacity-80 mt-0.5 capitalize">
                              Location: {b.location || "Studio"} • {b.photographerName || "Navin"}
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <span className="opacity-75 block text-[10px] uppercase font-bold">Total Amount:</span>
                            <p className="font-bold text-sm font-serif">{formatNPR(b.totalAmount)}</p>
                            {b.remainingBalance > 0 ? (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 mt-1 inline-block">
                                Due: {formatNPR(b.remainingBalance)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1 inline-block">
                                Paid in Full
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inclusions summary preview */}
                        {b.packageSnapshot?.inclusions && b.packageSnapshot.inclusions.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-black/10 flex items-center gap-2 flex-wrap text-[11px]">
                            {b.packageSnapshot.inclusions.slice(0, 3).map((inc, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 rounded-lg bg-white/80 border border-black/5 text-[#332A34]"
                              >
                                {inc}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2 text-xs text-[#846F7F]">
                    <span>Slot is available for studio photography</span>
                    <button
                      onClick={() => onSelectSlot(dateStr, hour)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF2F7] hover:bg-[#F5E5EB] text-[#3D084B] font-semibold text-xs transition-colors border border-[#EBD8E1] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Book at {formatTime12h(hour)}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
