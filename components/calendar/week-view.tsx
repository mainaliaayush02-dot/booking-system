"use client";

import React from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from "date-fns";
import { Booking } from "@/lib/types";
import { formatTime12h, getTodayNepal, getStatusBadgeStyle } from "@/lib/utils";
import { Clock } from "lucide-react";

interface WeekViewProps {
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

export function WeekView({
  currentDate,
  bookings,
  onSelectBooking,
  onSelectSlot,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const todayNepalStr = getTodayNepal();

  const getBookingsForDayAndHour = (dateStr: string, hourStr: string) => {
    const hourPrefix = hourStr.split(":")[0];
    return bookings.filter(
      (b) => b.appointmentDate === dateStr && b.startTime.startsWith(hourPrefix)
    );
  };

  return (
    <div className="bg-[#FFFAFC] border border-[#EBD8E1] rounded-2xl overflow-hidden shadow-subtle flex flex-col">
      {/* Week Header Row */}
      <div className="grid grid-cols-8 border-b border-[#EBD8E1] bg-[#FAF2F7]/70 text-center py-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F] flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 mr-1" />
          <span>Time</span>
        </div>
        {days.map((day, i) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isToday = dateStr === todayNepalStr;
          return (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D084B]">
                {format(day, "EEE")}
              </span>
              <span
                className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                  isToday
                    ? "bg-[#3D084B] text-white shadow-subtle"
                    : "text-[#332A34]"
                }`}
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hourly Grid Rows */}
      <div className="divide-y divide-[#EBD8E1] overflow-y-auto max-h-[650px]">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 divide-x divide-[#EBD8E1] min-h-[68px]">
            {/* Hour Label */}
            <div className="p-2 text-[11px] font-bold text-[#846F7F] bg-[#FAF2F7]/30 flex items-start justify-center">
              {formatTime12h(hour)}
            </div>

            {/* 7 Days Slots */}
            {days.map((day, dayIdx) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const slotBookings = getBookingsForDayAndHour(dateStr, hour);
              const isToday = dateStr === todayNepalStr;

              return (
                <div
                  key={dayIdx}
                  onClick={() => onSelectSlot(dateStr, hour)}
                  className={`p-1.5 transition-colors cursor-pointer hover:bg-[#FAF2F7]/60 relative group ${
                    isToday ? "bg-[#FAF2F7]/10" : ""
                  }`}
                >
                  {slotBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBooking(b);
                      }}
                      className={`p-1.5 mb-1 rounded-xl text-[10px] border shadow-subtle transition-transform hover:scale-[1.02] cursor-pointer ${getStatusBadgeStyle(
                        b.status
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate">{b.clientName}</span>
                        <span className="text-[8px] uppercase font-bold px-1 rounded">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-[9px] truncate font-medium mt-0.5">
                        {b.packageName}
                      </p>
                      <p className="text-[9px] text-[#846F7F] font-mono mt-0.5">
                        {formatTime12h(b.startTime)} - {formatTime12h(b.endTime)}
                      </p>
                    </div>
                  ))}

                  {slotBookings.length === 0 && (
                    <span className="hidden group-hover:block text-[9px] text-[#846F7F] text-center pt-2 italic">
                      + Add
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
