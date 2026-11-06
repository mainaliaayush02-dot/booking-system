"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StudioLayout } from "@/components/layout/studio-layout";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Clock,
  Filter,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import {
  getBookings,
  getPackages,
} from "@/lib/firestore";
import { Booking, BookingStatus, PackageCategory } from "@/lib/types";
import { getTodayNepal } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { DayView } from "@/components/calendar/day-view";
import { BookingModal } from "@/components/calendar/booking-modal";
import { BookingDetailModal } from "@/components/calendar/booking-detail-modal";
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
  parseISO,
} from "date-fns";

type CalendarViewMode = "month" | "week" | "day";

function CalendarContent() {
  const searchParams = useSearchParams();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState<string | undefined>(undefined);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | undefined>(undefined);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  const loadAllBookings = async () => {
    try {
      setLoading(true);
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllBookings();

    // Check query params
    if (searchParams.get("newBooking") === "true") {
      const cId = searchParams.get("clientId");
      const d = searchParams.get("date");
      if (cId) setSelectedClientId(cId);
      if (d) {
        setSelectedSlotDate(d);
        try {
          const parsed = parseISO(d);
          setCurrentDate(parsed);
          setSelectedDate(parsed);
        } catch {}
      }
      setIsBookingModalOpen(true);
    }
  }, [searchParams]);

  // Navigation handlers
  const handlePrevious = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    const todayStr = getTodayNepal();
    try {
      const today = parseISO(todayStr);
      setCurrentDate(today);
      setSelectedDate(today);
    } catch {
      const today = new Date();
      setCurrentDate(today);
      setSelectedDate(today);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.clientName.toLowerCase().includes(q) ||
      b.bookingNumber.toLowerCase().includes(q) ||
      b.packageName.toLowerCase().includes(q) ||
      (b.babyName && b.babyName.toLowerCase().includes(q));

    const matchesCategory =
      categoryFilter === "All" || b.category === categoryFilter;

    const matchesStatus =
      statusFilter === "All" || b.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Selected date bookings
  const selectedDayFormatted = format(selectedDate, "yyyy-MM-dd");
  const selectedDayBookings = filteredBookings.filter(
    (b) => b.appointmentDate === selectedDayFormatted && b.status !== "cancelled"
  );

  // Group into standard time slots (Clarity layout: Morning, Afternoon, Evening)
  const morningBookings = selectedDayBookings.filter(
    (b) => b.startTime < "12:30"
  );
  const afternoonBookings = selectedDayBookings.filter(
    (b) => b.startTime >= "12:30" && b.startTime < "15:30"
  );
  const eveningBookings = selectedDayBookings.filter(
    (b) => b.startTime >= "15:30" && b.startTime <= "21:00"
  );
  const otherBookings = selectedDayBookings.filter(
    (b) => !morningBookings.includes(b) && !afternoonBookings.includes(b) && !eveningBookings.includes(b)
  );

  const handleSlotAdd = (time: string) => {
    setSelectedSlotDate(selectedDayFormatted);
    setSelectedSlotTime(time);
    setEditingBooking(null);
    setIsBookingModalOpen(true);
  };

  return (
    <StudioLayout>
      <div className="space-y-6 pb-16 max-w-4xl mx-auto">
        {/* Top Control Bar: Search & Quick Filters Toggle (Desktop) */}
        <div className="hidden sm:flex items-center justify-between gap-3 bg-white border border-[#E8EBF0] p-3 sm:p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#FCEEEF] hover:text-[#D9272E] text-[#252B38] border border-[#E8EBF0] text-xs font-bold transition-all shadow-subtle cursor-pointer"
            >
              Today
            </button>
            <div className="text-xs text-[#8993A4] font-medium hidden sm:block">
              {format(selectedDate, "MMMM d, yyyy")}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E8EBF0] px-3 py-1.5 rounded-xl w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8993A4] shrink-0" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-[#252B38] placeholder-[#8993A4] focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border border-[#E8EBF0] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                showFilters ? "bg-[#FCEEEF] text-[#D9272E]" : "bg-white text-[#252B38] hover:bg-[#F8FAFC]"
              }`}
              title="Filters"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Filter Bar */}
        {showFilters && (
          <div className="bg-white border border-[#E8EBF0] p-3 sm:p-4 rounded-2xl shadow-sm flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] font-medium focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Newborn Photography">Newborn Photography</option>
              <option value="Maternity Photography">Maternity Photography</option>
              <option value="Baby Photography">Baby Photography</option>
              <option value="Cake Smash Photography">Cake Smash Photography</option>
              <option value="Family Photography">Family Photography</option>
              <option value="Couple Photography">Couple Photography</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] font-medium focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {(categoryFilter !== "All" || statusFilter !== "All" || search) && (
              <button
                onClick={() => {
                  setCategoryFilter("All");
                  setStatusFilter("All");
                  setSearch("");
                }}
                className="text-xs text-[#D9272E] hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* 1. Month View Calendar Card (Recreating Screenshot 1 & 2) */}
        {loading ? (
          <Card className="p-16 text-center">
            <p className="text-xs text-[#8993A4] animate-pulse font-medium">
              Loading calendar sessions...
            </p>
          </Card>
        ) : (
          <MonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            bookings={filteredBookings}
            onSelectBooking={(b) => setViewingBooking(b)}
            onSelectDate={(dStr) => {
              try {
                setSelectedDate(parseISO(dStr));
              } catch {}
            }}
            onPrevMonth={handlePrevious}
            onNextMonth={handleNext}
          />
        )}

        {/* 2. Selected Date Header & Floating Red + Action Button */}
        <div className="flex items-center justify-between pt-2 px-1">
          <div>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-[#252B38] tracking-tight">
              {format(selectedDate, "d EEEE")}
            </h2>
            <p className="text-xs sm:text-sm text-[#8993A4] mt-0.5">
              {selectedDayBookings.length} Scheduled
            </p>
          </div>

          {/* Red Floating Action Button */}
          <button
            onClick={() => {
              setSelectedSlotDate(selectedDayFormatted);
              setSelectedSlotTime(undefined);
              setEditingBooking(null);
              setIsBookingModalOpen(true);
            }}
            className="w-12 h-12 rounded-full bg-[#D9272E] hover:bg-[#C21F25] active:scale-95 text-white flex items-center justify-center shadow-[0_4px_14px_rgba(217,39,46,0.4)] transition-all cursor-pointer shrink-0"
            title="Schedule session for this date"
            aria-label="Add session"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 3. Three Spacious Dashed-Outline Session Cards (Screenshot 1 & 2) */}
        <div className="space-y-4">
          {/* Slot 1: Morning Session (10:00 - 12:00) */}
          {morningBookings.length === 0 ? (
            <div className="border-2 border-dashed border-[#E8EBF0] hover:border-[#D9272E]/40 rounded-2xl p-4 sm:p-5 bg-white flex items-center justify-between transition-all">
              <div>
                <h4 className="font-sans text-sm sm:text-base font-bold text-[#252B38]">
                  Morning Session
                </h4>
                <p className="text-xs text-[#8993A4] mt-0.5">10:00 – 12:00</p>
              </div>
              <button
                type="button"
                onClick={() => handleSlotAdd("10:00")}
                className="w-8 h-8 rounded-full border border-[#E8EBF0] hover:border-[#D9272E] text-[#8993A4] hover:text-[#D9272E] hover:bg-[#FCEEEF] flex items-center justify-center transition-colors cursor-pointer"
                title="Book Morning Session"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            morningBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setViewingBooking(b)}
                className="border border-[#E8EBF0] hover:border-[#D9272E] rounded-2xl p-4 sm:p-5 bg-white shadow-sm flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9272E] bg-[#FCEEEF] px-2 py-0.5 rounded-md">
                      Morning • {b.startTime} - {b.endTime}
                    </span>
                    <span className="text-xs text-[#8993A4] font-mono">#{b.bookingNumber}</span>
                  </div>
                  <h4 className="font-sans text-base font-bold text-[#252B38] mt-1.5 truncate group-hover:text-[#D9272E] transition-colors">
                    {b.clientName} {b.babyName ? `(${b.babyName})` : ""}
                  </h4>
                  <p className="text-xs text-[#3D084B] font-medium mt-0.5 truncate">
                    {b.packageName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg capitalize ${
                    b.status === "confirmed" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Slot 2: Afternoon Session (13:00 - 15:00) */}
          {afternoonBookings.length === 0 ? (
            <div className="border-2 border-dashed border-[#E8EBF0] hover:border-[#D9272E]/40 rounded-2xl p-4 sm:p-5 bg-white flex items-center justify-between transition-all">
              <div>
                <h4 className="font-sans text-sm sm:text-base font-bold text-[#252B38]">
                  Afternoon Session
                </h4>
                <p className="text-xs text-[#8993A4] mt-0.5">13:00 – 15:00</p>
              </div>
              <button
                type="button"
                onClick={() => handleSlotAdd("13:00")}
                className="w-8 h-8 rounded-full border border-[#E8EBF0] hover:border-[#D9272E] text-[#8993A4] hover:text-[#D9272E] hover:bg-[#FCEEEF] flex items-center justify-center transition-colors cursor-pointer"
                title="Book Afternoon Session"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            afternoonBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setViewingBooking(b)}
                className="border border-[#E8EBF0] hover:border-[#D9272E] rounded-2xl p-4 sm:p-5 bg-white shadow-sm flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9272E] bg-[#FCEEEF] px-2 py-0.5 rounded-md">
                      Afternoon • {b.startTime} - {b.endTime}
                    </span>
                    <span className="text-xs text-[#8993A4] font-mono">#{b.bookingNumber}</span>
                  </div>
                  <h4 className="font-sans text-base font-bold text-[#252B38] mt-1.5 truncate group-hover:text-[#D9272E] transition-colors">
                    {b.clientName} {b.babyName ? `(${b.babyName})` : ""}
                  </h4>
                  <p className="text-xs text-[#3D084B] font-medium mt-0.5 truncate">
                    {b.packageName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg capitalize ${
                    b.status === "confirmed" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Slot 3: Evening Session (16:00 - 18:00) */}
          {eveningBookings.length === 0 ? (
            <div className="border-2 border-dashed border-[#E8EBF0] hover:border-[#D9272E]/40 rounded-2xl p-4 sm:p-5 bg-white flex items-center justify-between transition-all">
              <div>
                <h4 className="font-sans text-sm sm:text-base font-bold text-[#252B38]">
                  Evening Session
                </h4>
                <p className="text-xs text-[#8993A4] mt-0.5">16:00 – 18:00</p>
              </div>
              <button
                type="button"
                onClick={() => handleSlotAdd("16:00")}
                className="w-8 h-8 rounded-full border border-[#E8EBF0] hover:border-[#D9272E] text-[#8993A4] hover:text-[#D9272E] hover:bg-[#FCEEEF] flex items-center justify-center transition-colors cursor-pointer"
                title="Book Evening Session"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            eveningBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setViewingBooking(b)}
                className="border border-[#E8EBF0] hover:border-[#D9272E] rounded-2xl p-4 sm:p-5 bg-white shadow-sm flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9272E] bg-[#FCEEEF] px-2 py-0.5 rounded-md">
                      Evening • {b.startTime} - {b.endTime}
                    </span>
                    <span className="text-xs text-[#8993A4] font-mono">#{b.bookingNumber}</span>
                  </div>
                  <h4 className="font-sans text-base font-bold text-[#252B38] mt-1.5 truncate group-hover:text-[#D9272E] transition-colors">
                    {b.clientName} {b.babyName ? `(${b.babyName})` : ""}
                  </h4>
                  <p className="text-xs text-[#3D084B] font-medium mt-0.5 truncate">
                    {b.packageName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg capitalize ${
                    b.status === "confirmed" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Any other custom sessions on this date */}
          {otherBookings.length > 0 && (
            <div className="pt-2 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#8993A4]">
                Additional Scheduled Sessions
              </h5>
              {otherBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setViewingBooking(b)}
                  className="border border-[#E8EBF0] hover:border-[#D9272E] rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D084B] bg-[#F8FAFC] border border-[#E8EBF0] px-2 py-0.5 rounded-md">
                        {b.startTime} - {b.endTime}
                      </span>
                      <span className="text-xs text-[#8993A4] font-mono">#{b.bookingNumber}</span>
                    </div>
                    <h4 className="font-sans text-sm font-bold text-[#252B38] mt-1 truncate group-hover:text-[#D9272E]">
                      {b.clientName}
                    </h4>
                    <p className="text-xs text-[#8993A4] mt-0.5 truncate">{b.packageName}</p>
                  </div>
                  <span className="text-xs text-[#D9272E] font-semibold">View</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit Booking Modal */}
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={() => {
            loadAllBookings();
          }}
          initialDate={selectedSlotDate}
          initialTime={selectedSlotTime}
          initialClientId={selectedClientId}
          editingBooking={editingBooking}
        />

        {/* View / Manage Booking Detail Modal */}
        <BookingDetailModal
          isOpen={Boolean(viewingBooking)}
          onClose={() => setViewingBooking(null)}
          booking={viewingBooking}
          onEdit={(b) => {
            setViewingBooking(null);
            setEditingBooking(b);
            setIsBookingModalOpen(true);
          }}
          onUpdated={() => {
            loadAllBookings();
          }}
        />
      </div>
    </StudioLayout>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#846F7F]">Loading Studio Calendar...</div>}>
      <CalendarContent />
    </Suspense>
  );
}
