"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StudioLayout } from "@/components/layout/studio-layout";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  Clock,
  PlusCircle,
  ArrowUpRight,
  Receipt,
  Sparkles,
  Phone,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getBookings,
  getDashboardMetrics,
  getRecentActivityLogs,
} from "@/lib/firestore";
import { Booking, DashboardMetrics, ActivityLog } from "@/lib/types";
import {
  formatNPR,
  formatDate,
  formatTime12h,
  getStatusBadgeStyle,
  getTodayNepal,
} from "@/lib/utils";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [dashMetrics, allBookings, logs] = await Promise.all([
          getDashboardMetrics(),
          getBookings(),
          getRecentActivityLogs(10),
        ]);

        setMetrics(dashMetrics);
        setRecentActivities(logs);

        // Upcoming bookings filter (today onwards, non-cancelled)
        const todayStr = getTodayNepal();
        const upcoming = allBookings
          .filter((b) => b.appointmentDate >= todayStr && b.status !== "cancelled")
          .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))
          .slice(0, 6);

        setUpcomingBookings(upcoming);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <StudioLayout>
      <div className="space-y-8 pb-12">
        {/* Top Banner / Welcome & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#EFE8DC] p-6 rounded-2xl shadow-subtle">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-studio-600" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal-900">
                Studio Operations Overview
              </h2>
            </div>
            <p className="text-sm text-charcoal-500 mt-1">
              Real-time bookings, payments, and financial health for Newborn Photography Nepal.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-studio-600 hover:bg-studio-700 text-white text-xs font-semibold tracking-wide shadow-subtle transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Booking</span>
            </Link>
            <Link
              href="/clients"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EFE6] text-charcoal-800 border border-[#E8DFD3] text-xs font-semibold transition-all"
            >
              <Users className="w-3.5 h-3.5 text-studio-600" />
              <span>Add Client</span>
            </Link>
            <Link
              href="/finance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EFE6] text-charcoal-800 border border-[#E8DFD3] text-xs font-semibold transition-all"
            >
              <Receipt className="w-3.5 h-3.5 text-studio-600" />
              <span>Record Payment</span>
            </Link>
          </div>
        </div>

        {/* 7 Core Financial & Booking Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Bookings This Month */}
          <div className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Month Bookings
              </span>
              <div className="w-8 h-8 rounded-lg bg-studio-50 border border-studio-100 flex items-center justify-center text-studio-700">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-charcoal-900">
                {loading ? "..." : metrics?.totalBookingsThisMonth ?? 0}
              </span>
              <span className="text-xs text-charcoal-500 ml-1.5 font-normal">sessions booked</span>
            </div>
            <div className="mt-2 text-[11px] text-charcoal-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-studio-600" />
              <span>{metrics?.upcomingBookingsCount ?? 0} upcoming sessions ahead</span>
            </div>
          </div>

          {/* Card 2: Monthly Sales Revenue (Booking sales total) */}
          <div className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Sales Booked (NPR)
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-charcoal-900">
                {loading ? "..." : formatNPR(metrics?.monthlySalesRevenue)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-charcoal-500">
              Contracted package total for this month
            </p>
          </div>

          {/* Card 3: Actual Cash Collected */}
          <div className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Cash Collected (NPR)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-emerald-800">
                {loading ? "..." : formatNPR(metrics?.monthlyCashCollected)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-emerald-700">
              Money actually received in bank / cash / eSewa
            </p>
          </div>

          {/* Card 4: Net Cash Profit */}
          <div className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Cash Profit (NPR)
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-serif font-bold ${
                  (metrics?.cashProfit ?? 0) >= 0 ? "text-charcoal-900" : "text-rose-600"
                }`}
              >
                {loading ? "..." : formatNPR(metrics?.cashProfit)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-charcoal-500">
              Collected minus {formatNPR(metrics?.monthlyExpenses)} expenses
            </p>
          </div>
        </div>

        {/* Secondary Metric Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FAF7F2] border border-[#EFE8DC] p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-charcoal-500 font-medium">Monthly Studio Expenses</p>
              <p className="text-lg font-semibold text-charcoal-800 mt-0.5">
                {loading ? "..." : formatNPR(metrics?.monthlyExpenses)}
              </p>
            </div>
            <Link
              href="/finance"
              className="text-xs text-studio-700 hover:text-studio-900 font-medium flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-[#FAF7F2] border border-[#EFE8DC] p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-charcoal-500 font-medium">Outstanding Balances</p>
              <p className="text-lg font-semibold text-amber-900 mt-0.5">
                {loading ? "..." : formatNPR(metrics?.pendingBalanceTotal)}
              </p>
            </div>
            <span className="text-[11px] text-amber-700 bg-amber-100/60 border border-amber-200 px-2 py-0.5 rounded">
              Receivable
            </span>
          </div>

          <div className="bg-[#FAF7F2] border border-[#EFE8DC] p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-charcoal-500 font-medium">Studio Timezone</p>
              <p className="text-sm font-semibold text-charcoal-800 mt-0.5">
                Kathmandu (GMT+5:45)
              </p>
            </div>
            <span className="text-[11px] text-studio-700 font-mono bg-white px-2 py-0.5 rounded border border-[#E8DFD3]">
              Active
            </span>
          </div>
        </div>

        {/* Main Grid: Upcoming Sessions & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Photography Sessions (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-charcoal-900">
                  Upcoming Photography Appointments
                </h3>
                <p className="text-xs text-charcoal-500">
                  Scheduled newborn, maternity, and family sessions
                </p>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-studio-700 hover:text-studio-900 flex items-center gap-1 transition-colors"
              >
                <span>View Full Calendar</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-white border border-[#EFE8DC] rounded-xl p-8 text-center">
                <p className="text-xs text-charcoal-400 animate-pulse">Loading upcoming sessions...</p>
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="bg-white border border-[#EFE8DC] rounded-xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-cream-100 text-studio-600 mx-auto flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-serif font-semibold text-charcoal-800">
                    No upcoming sessions scheduled
                  </h4>
                  <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
                    New photography sessions created in the calendar will automatically show up here.
                  </p>
                </div>
                <Link
                  href="/calendar"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-studio-600 hover:bg-studio-700 text-white text-xs font-semibold tracking-wide transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create First Booking</span>
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-[#EFE8DC] rounded-xl divide-y divide-[#EFE8DC] overflow-hidden shadow-subtle">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-studio-50 border border-studio-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold uppercase text-studio-600">
                          {booking.appointmentDate ? booking.appointmentDate.split("-")[1] : "M"}
                        </span>
                        <span className="text-base font-serif font-bold text-charcoal-900 leading-tight">
                          {booking.appointmentDate ? booking.appointmentDate.split("-")[2] : "D"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-charcoal-900">
                            {booking.clientName}
                          </h4>
                          {booking.babyName && (
                            <span className="text-[11px] text-charcoal-500 bg-cream-100 px-2 py-0.5 rounded-full border border-cream-200">
                              Baby: {booking.babyName}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-charcoal-500 mt-1 flex-wrap">
                          <span className="font-medium text-studio-800">{booking.packageName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-charcoal-400" />
                            {formatTime12h(booking.startTime)} - {formatTime12h(booking.endTime)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-charcoal-400" />
                            {booking.clientPhone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-cream-200">
                      <span className="text-xs text-charcoal-400 font-mono">
                        {booking.bookingNumber}
                      </span>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-charcoal-900 block">
                          {formatNPR(booking.totalAmount)}
                        </span>
                        {booking.remainingBalance > 0 ? (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Due: {formatNPR(booking.remainingBalance)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Fully Paid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Studio Activity Feed (1 col) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-charcoal-900">
                  Recent Activity
                </h3>
                <p className="text-xs text-charcoal-500">Audit trail of studio operations</p>
              </div>
              <span className="text-[10px] uppercase font-bold text-studio-600 bg-studio-50 border border-studio-200 px-2 py-0.5 rounded">
                Live Audit
              </span>
            </div>

            <div className="bg-white border border-[#EFE8DC] rounded-xl p-5 shadow-subtle">
              {loading ? (
                <p className="text-xs text-charcoal-400 animate-pulse text-center py-4">
                  Loading activity logs...
                </p>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-cream-100 text-charcoal-400 mx-auto flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-charcoal-500">
                    No studio activity logged yet. Operations will be recorded here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-studio-500 shrink-0 mt-1.5" />
                      <div className="flex-1">
                        <p className="text-charcoal-800 leading-snug font-medium">
                          {log.details}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-charcoal-400">
                          <span className="font-semibold text-charcoal-600">{log.userName}</span>
                          <span>•</span>
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
