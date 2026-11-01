"use client";

import React from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { Booking } from "@/lib/types";
import { formatTime12h, getTodayNepal, getStatusBadgeStyle } from "@/lib/utils";

interface MonthViewProps {
  currentDate: Date;
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onSelectDate: (dateStr: string) => void;
}

export function MonthView({
  currentDate,
  bookings,
  onSelectBooking,
  onSelectDate,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const todayNepalStr = getTodayNepal();

  const getBookingsForDay = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    return bookings
      .filter((b) => b.appointmentDate === formatted)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-[#FFFAFC] border border-[#EBD8E1] rounded-2xl overflow-hidden shadow-subtle">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-[#EBD8E1] bg-[#FAF2F7]/70 text-center py-2.5">
        {dayNames.map((d, i) => (
          <span
            key={i}
            className="text-[11px] font-bold uppercase tracking-wider text-[#3D084B]"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#EBD8E1]">
        {days.map((day, dayIdx) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = dateStr === todayNepalStr;

          return (
            <div
              key={dayIdx}
              onClick={() => onSelectDate(dateStr)}
              className={`min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group hover:bg-[#FAF2F7]/50 ${
                !isCurrentMonth ? "bg-[#FAF2F7]/20 text-[#846F7F]/50" : "bg-[#FFFAFC]"
              }`}
            >
              {/* Day Header Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center transition-all ${
                    isToday
                      ? "bg-[#3D084B] text-white font-bold shadow-subtle"
                      : isCurrentMonth
                      ? "text-[#332A34] group-hover:text-[#3D084B]"
                      : "text-[#846F7F]/60"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {dayBookings.length > 0 && (
                  <span className="text-[9px] font-bold text-[#846F7F]">
                    {dayBookings.length} {dayBookings.length === 1 ? "session" : "sessions"}
                  </span>
                )}
              </div>

              {/* Day Bookings List */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                {dayBookings.slice(0, 3).map((b) => {
                  return (
                    <div
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBooking(b);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium border truncate transition-all shadow-subtle hover:scale-[1.02] ${getStatusBadgeStyle(
                        b.status
                      )}`}
                      title={`${b.clientName} - ${b.packageName} (${formatTime12h(b.startTime)})`}
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>{formatTime12h(b.startTime)}</span>
                        <span>•</span>
                        <span className="truncate">{b.clientName}</span>
                      </div>
                      <p className="truncate text-[9px] opacity-80">{b.packageName}</p>
                    </div>
                  );
                })}

                {dayBookings.length > 3 && (
                  <p className="text-[10px] font-bold text-[#3D084B] text-center pt-0.5">
                    +{dayBookings.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
