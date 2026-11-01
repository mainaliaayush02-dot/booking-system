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
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

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
          setCurrentDate(parseISO(d));
        } catch {}
      }
      setIsBookingModalOpen(true);
    }
  }, [searchParams]);

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    const todayStr = getTodayNepal();
    try {
      setCurrentDate(parseISO(todayStr));
    } catch {
      setCurrentDate(new Date());
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    try {
      setCurrentDate(parseISO(e.target.value));
    } catch {}
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

  const getHeaderTitle = () => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "week") {
      return `Week of ${format(currentDate, "dd MMMM yyyy")}`;
    }
    return format(currentDate, "EEEE, dd MMMM yyyy");
  };

  return (
    <StudioLayout>
      <div className="space-y-6 pb-12">
        {/* Top Header Card */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#3D084B]" />
              <h2 className="font-serif text-2xl font-bold text-[#3D084B] tracking-tight">
                Studio Booking Calendar
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#846F7F] mt-1 font-normal">
              Operating in Asia/Kathmandu (NPT) • Appointment conflict detection & session scheduling.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingBooking(null);
              setSelectedSlotDate(undefined);
              setSelectedSlotTime(undefined);
              setSelectedClientId(undefined);
              setIsBookingModalOpen(true);
            }}
            className="gap-1.5 shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>New Photography Booking</span>
          </Button>
        </div>

        {/* Calendar Controls & Navigation Bar */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-4 rounded-2xl shadow-subtle space-y-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Left: Prev / Next / Title / Today */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-1 bg-[#FAF2F7] border border-[#EBD8E1] p-1 rounded-xl">
                <button
                  onClick={handlePrevious}
                  className="p-1.5 rounded-lg text-[#3D084B] hover:bg-white transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-lg text-[#3D084B] hover:bg-white transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#3D084B] min-w-[180px]">
                {getHeaderTitle()}
              </h3>

              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl bg-[#FAF2F7] hover:bg-[#F5E5EB] text-[#3D084B] border border-[#EBD8E1] text-xs font-bold transition-all shadow-subtle"
              >
                Today
              </button>

              <input
                type="date"
                value={format(currentDate, "yyyy-MM-dd")}
                onChange={handleDateChange}
                className="hidden sm:block px-2.5 py-1 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none"
              />
            </div>

            {/* Right: View Mode Switcher Pills */}
            <div className="flex items-center p-1 bg-[#FAF2F7] border border-[#EBD8E1] rounded-xl self-end lg:self-auto">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "month"
                    ? "bg-[#3D084B] text-white shadow-subtle"
                    : "text-[#846F7F] hover:text-[#3D084B]"
                }`}
              >
                Month View
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "week"
                    ? "bg-[#3D084B] text-white shadow-subtle"
                    : "text-[#846F7F] hover:text-[#3D084B]"
                }`}
              >
                Week View
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "day"
                    ? "bg-[#3D084B] text-white shadow-subtle"
                    : "text-[#846F7F] hover:text-[#3D084B]"
                }`}
              >
                Day View
              </button>
            </div>
          </div>

          {/* Search & Category / Status Filters Bar */}
          <div className="pt-3 border-t border-[#EBD8E1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] px-3 py-1.5 rounded-xl w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#846F7F]" />
              <input
                type="text"
                placeholder="Search by client or booking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-[#332A34] placeholder-[#846F7F]/60 focus:outline-none"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none"
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
                className="px-2.5 py-1.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendar View Container */}
        {loading ? (
          <Card className="p-16 text-center">
            <p className="text-xs text-[#846F7F] animate-pulse font-medium">
              Loading calendar appointments...
            </p>
          </Card>
        ) : (
          <div>
            {viewMode === "month" && (
              <MonthView
                currentDate={currentDate}
                bookings={filteredBookings}
                onSelectBooking={(b) => setViewingBooking(b)}
                onSelectDate={(dStr) => {
                  try {
                    setCurrentDate(parseISO(dStr));
                    setViewMode("day");
                  } catch {}
                }}
              />
            )}

            {viewMode === "week" && (
              <WeekView
                currentDate={currentDate}
                bookings={filteredBookings}
                onSelectBooking={(b) => setViewingBooking(b)}
                onSelectSlot={(dStr, tStr) => {
                  setSelectedSlotDate(dStr);
                  setSelectedSlotTime(tStr);
                  setEditingBooking(null);
                  setIsBookingModalOpen(true);
                }}
              />
            )}

            {viewMode === "day" && (
              <DayView
                currentDate={currentDate}
                bookings={filteredBookings}
                onSelectBooking={(b) => setViewingBooking(b)}
                onSelectSlot={(dStr, tStr) => {
                  setSelectedSlotDate(dStr);
                  setSelectedSlotTime(tStr);
                  setEditingBooking(null);
                  setIsBookingModalOpen(true);
                }}
              />
            )}
          </div>
        )}

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
