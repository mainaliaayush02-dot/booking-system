"use client";

import React, { useEffect, useState, useMemo } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  CheckSquare,
  ChevronDown,
  Calendar,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";
import { getBookings, toggleBookingDelivered } from "@/lib/firestore";
import { Booking } from "@/lib/types";
import { formatNPR } from "@/lib/utils";
import { BookingDetailModal } from "@/components/calendar/booking-detail-modal";
import { useAuth } from "@/lib/firebase-auth";
import {
  format,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";

export default function SessionsPage() {
  const { studioUser } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"urgency" | "date_asc" | "date_desc" | "revenue">("urgency");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Filter bookings for the selected month
  const monthKey = format(currentDate, "yyyy-MM");

  const monthBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bDate = b.appointmentDate || (b.createdAt ? b.createdAt.slice(0, 10) : "");
      return bDate.startsWith(monthKey) && b.status !== "cancelled";
    });
  }, [bookings, monthKey]);

  // Financial summary metrics matching Screenshot 3
  const totalRevenue = useMemo(() => {
    return monthBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  }, [monthBookings]);

  const totalSessions = monthBookings.length;

  const deliveredCount = useMemo(() => {
    return monthBookings.filter((b) => b.delivered === true || b.status === "completed").length;
  }, [monthBookings]);

  // Sort and search filter
  const sortedSessions = useMemo(() => {
    let list = [...monthBookings];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.clientName.toLowerCase().includes(q) ||
          b.bookingNumber.toLowerCase().includes(q) ||
          b.packageName.toLowerCase().includes(q)
      );
    }

    if (sortBy === "urgency") {
      // Pending first, then confirmed, then completed
      const urgencyRank: Record<string, number> = {
        pending: 1,
        confirmed: 2,
        rescheduled: 3,
        completed: 4,
      };
      list.sort((a, b) => (urgencyRank[a.status] || 5) - (urgencyRank[b.status] || 5));
    } else if (sortBy === "date_asc") {
      list.sort((a, b) => (a.appointmentDate || "").localeCompare(b.appointmentDate || ""));
    } else if (sortBy === "date_desc") {
      list.sort((a, b) => (b.appointmentDate || "").localeCompare(a.appointmentDate || ""));
    } else if (sortBy === "revenue") {
      list.sort((a, b) => (Number(b.totalAmount) || 0) - (Number(a.totalAmount) || 0));
    }

    return list;
  }, [monthBookings, search, sortBy]);

  const handleToggleDelivered = async (e: React.MouseEvent, b: Booking) => {
    e.stopPropagation();
    if (!studioUser) return;
    try {
      const newDelivered = !b.delivered;
      await toggleBookingDelivered(b.id, newDelivered, {
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
      // Local optimistic update
      setBookings((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, delivered: newDelivered } : item))
      );
    } catch (err) {
      console.error("Error toggling delivery:", err);
    }
  };

  return (
    <StudioLayout>
      <div className="space-y-5 pb-16 max-w-4xl mx-auto">
        {/* 1. Top Month Selector Card (Screenshot 3) */}
        <div className="bg-white border border-[#E8EBF0] p-4 sm:p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 rounded-xl border border-[#E8EBF0] hover:bg-[#F8FAFC] text-[#252B38] transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 rounded-xl border border-[#E8EBF0] hover:bg-[#F8FAFC] text-[#252B38] transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-[#8993A4] block uppercase tracking-wider">
              {format(currentDate, "yyyy")}
            </span>
            <span className="font-sans text-xl sm:text-2xl font-bold text-[#252B38] leading-tight">
              {format(currentDate, "MMMM")}
            </span>
          </div>
        </div>

        {/* 2. Sort Dropdown Pill Bar (Screenshot 3) */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto appearance-none bg-white border border-[#E8EBF0] px-4 py-2.5 pr-9 rounded-2xl text-xs font-semibold text-[#252B38] focus:outline-none focus:ring-1 focus:ring-[#D9272E] shadow-sm cursor-pointer"
            >
              <option value="urgency">Sort by Urgency</option>
              <option value="date_asc">Sort by Date (Earliest First)</option>
              <option value="date_desc">Sort by Date (Latest First)</option>
              <option value="revenue">Sort by Revenue (Highest First)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#8993A4] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-2 bg-white border border-[#E8EBF0] px-3.5 py-2 rounded-2xl w-44 sm:w-64 shadow-sm">
            <Search className="w-3.5 h-3.5 text-[#8993A4] shrink-0" />
            <input
              type="text"
              placeholder="Filter client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-[#252B38] placeholder-[#8993A4] focus:outline-none"
            />
          </div>
        </div>

        {/* 3. Three Large Summary Cards (Screenshot 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Total Revenue */}
          <div className="bg-white border border-[#E8EBF0] p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8993A4]">
                TOTAL REVENUE
              </p>
              <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#252B38] mt-1 tabular-nums">
                NPR {Number(totalRevenue).toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#E8F8EE] flex items-center justify-center text-[#1E6838] shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          {/* Card 2: Total Sessions */}
          <div className="bg-white border border-[#E8EBF0] p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8993A4]">
                TOTAL SESSIONS
              </p>
              <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#252B38] mt-1 tabular-nums">
                {totalSessions}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EEF2FC] flex items-center justify-center text-[#3D54B4] shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          {/* Card 3: Delivered */}
          <div className="bg-white border border-[#E8EBF0] p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8993A4]">
                DELIVERED
              </p>
              <h3 className="font-sans text-xl sm:text-2xl font-bold text-[#252B38] mt-1 tabular-nums">
                {deliveredCount} / {totalSessions}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#F9EFFC] flex items-center justify-center text-[#7E3DB4] shrink-0">
              <CheckSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* 4. Sessions Table (Screenshot 3) */}
        <div className="bg-white border border-[#E8EBF0] rounded-3xl overflow-hidden shadow-sm">
          {/* Dark Charcoal Table Header */}
          <div className="bg-[#252B38] text-white px-4 sm:px-6 py-3.5 grid grid-cols-12 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <div className="col-span-4">SESSION DATE</div>
            <div className="col-span-4">CLIENT NAME</div>
            <div className="col-span-4">SESSION TYPE</div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#8993A4] animate-pulse">
              Loading photography sessions...
            </div>
          ) : sortedSessions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-[#252B38]">No sessions scheduled for this month</p>
              <p className="text-xs text-[#8993A4] mt-1">
                Bookings scheduled in {format(currentDate, "MMMM yyyy")} will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8EBF0]">
              {sortedSessions.map((b) => {
                let formattedDate = b.appointmentDate;
                try {
                  formattedDate = format(parseISO(b.appointmentDate), "MMMM d");
                } catch {}

                const isDelivered = b.delivered === true || b.status === "completed";

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="grid grid-cols-12 items-center px-4 sm:px-6 py-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer group select-none text-xs"
                  >
                    {/* Session Date */}
                    <div className="col-span-4 pr-2">
                      <p className="font-sans font-bold text-[#252B38] group-hover:text-[#D9272E] transition-colors leading-tight">
                        {formattedDate}
                      </p>
                      <p className="text-[10px] text-[#8993A4] mt-0.5 font-medium">
                        {b.startTime} – {b.endTime}
                      </p>
                    </div>

                    {/* Client Name & ID */}
                    <div className="col-span-4 pr-2 min-w-0">
                      <p className="font-sans font-bold text-[#252B38] truncate group-hover:text-[#D9272E] transition-colors">
                        {b.clientName}
                      </p>
                      <p className="text-[10px] text-[#8993A4] font-mono mt-0.5 truncate">
                        #{b.bookingNumber}
                      </p>
                    </div>

                    {/* Session Type & Delivery Status */}
                    <div className="col-span-4 flex items-center justify-between min-w-0 pl-1">
                      <div className="min-w-0 pr-2">
                        <p className="font-sans font-semibold text-[#252B38] truncate">
                          {b.category || "Photography"}
                        </p>
                        <p className="text-[10px] text-[#8993A4] truncate mt-0.5">
                          {b.packageName}
                        </p>
                      </div>

                      {/* Delivery Checkbox Toggle */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleDelivered(e, b)}
                        className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                          isDelivered
                            ? "bg-[#E8F8EE] border-[#A8E5BA] text-[#1E6838]"
                            : "bg-white border-[#E8EBF0] text-[#8993A4] hover:border-[#D9272E]"
                        }`}
                        title={isDelivered ? "Mark as pending delivery" : "Mark as delivered"}
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking Detail Modal */}
        <BookingDetailModal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          onEdit={() => {
            // Can navigate to calendar to edit or refresh
            setSelectedBooking(null);
          }}
          onUpdated={() => {
            loadBookings();
            setSelectedBooking(null);
          }}
        />
      </div>
    </StudioLayout>
  );
}
