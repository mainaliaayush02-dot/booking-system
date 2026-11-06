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
} from "date-fns";
import { Booking } from "@/lib/types";

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onSelectDate: (dateStr: string) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

export function MonthView({
  currentDate,
  selectedDate,
  bookings,
  onSelectBooking,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getBookingsForDay = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    return bookings
      .filter((b) => b.appointmentDate === formatted && b.status !== "cancelled")
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div className="bg-white border border-[#E8EBF0] rounded-3xl p-4 sm:p-6 shadow-sm select-none">
      {/* Month Navigation Row (if provided) */}
      {(onPrevMonth || onNextMonth) && (
        <div className="flex items-center justify-between mb-5 px-1">
          <button
            type="button"
            onClick={onPrevMonth}
            className="p-2 rounded-xl text-[#252B38] hover:bg-[#F8FAFC] border border-[#E8EBF0] transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="font-sans text-base sm:text-lg font-bold text-[#252B38]">
            {format(currentDate, "MMMM yyyy")}
          </h3>

          <button
            type="button"
            onClick={onNextMonth}
            className="p-2 rounded-xl text-[#252B38] hover:bg-[#F8FAFC] border border-[#E8EBF0] transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 text-center pb-3">
        {dayNames.map((d, i) => (
          <span
            key={i}
            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8993A4]"
          >
            {d}
          </span>
        ))}
      </div>

      {/* 7-Column Dates Grid */}
      <div className="grid grid-cols-7 gap-y-3 gap-x-1 sm:gap-x-2">
        {days.map((day, dayIdx) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={dayIdx}
              onClick={() => onSelectDate(dateStr)}
              className="flex flex-col items-center justify-center cursor-pointer transition-all py-1"
            >
              {isSelected ? (
                /* Selected Date: Rounded Red Vertical Pill matching Clarity */
                <div className="bg-[#D9272E] text-white rounded-2xl w-8 sm:w-10 h-12 sm:h-14 flex flex-col items-center justify-center shadow-[0_6px_16px_rgba(217,39,46,0.38)] transition-transform active:scale-95">
                  <span className="font-sans font-bold text-sm sm:text-base leading-none">
                    {format(day, "d")}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="mt-1 bg-white/25 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {dayBookings.length}...
                    </span>
                  )}
                </div>
              ) : (
                /* Unselected Date */
                <div className="flex flex-col items-center justify-center min-h-[48px] sm:min-h-[56px] w-full hover:bg-[#F8FAFC] rounded-2xl transition-colors py-1">
                  <span
                    className={`font-sans text-xs sm:text-sm font-semibold leading-none ${
                      isCurrentMonth ? "text-[#252B38]" : "text-[#8993A4]/35"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {dayBookings.length > 0 && isCurrentMonth && (
                    <span className="mt-1.5 bg-[#FCEEEF] text-[#D9272E] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none truncate max-w-[38px] text-center">
                      {dayBookings.length}...
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
