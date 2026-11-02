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
  CalendarCheck,
  AlertCircle,
  UserCheck,
  Heart,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  getDashboardMetrics,
  getTodaySessions,
  getUpcomingBookings,
  getRecentPayments,
  getRecentClients,
  getMonthlyRevenueTrend,
  MonthlyTrendData,
} from "@/lib/firestore";
import { Booking, DashboardMetrics, Payment, Client } from "@/lib/types";
import {
  formatNPR,
  formatDate,
  formatTime12h,
  getStatusBadgeStyle,
} from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { BookingDetailModal } from "@/components/calendar/booking-detail-modal";
import { BookingModal } from "@/components/calendar/booking-modal";
import { ClientDetailModal } from "@/components/clients/client-detail-modal";
import { ClientModal } from "@/components/clients/client-modal";
import { useAuth } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { studioUser } = useAuth();
  const isPhotographer = studioUser?.role === "photographer";
  const [metrics, setMetrics] = useState<(DashboardMetrics & { totalAllTimeBookings: number }) | null>(null);
  const [todaySessions, setTodaySessions] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<MonthlyTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  // Personalized greeting
  const firstName = studioUser?.displayName ? studioUser.displayName.split(" ")[0] : "Navin";
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  // Detail & Action Modals
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashMetrics, todayList, upcomingList, paymentsList, clientsList, trendList] =
        await Promise.all([
          getDashboardMetrics().catch((err) => {
            console.warn("Metrics load error:", err);
            return null;
          }),
          getTodaySessions().catch((err) => {
            console.warn("Today sessions load error:", err);
            return [];
          }),
          getUpcomingBookings(6).catch((err) => {
            console.warn("Upcoming bookings load error:", err);
            return [];
          }),
          getRecentPayments(5).catch((err) => {
            console.warn("Payments load error:", err);
            return [];
          }),
          getRecentClients(5).catch((err) => {
            console.warn("Clients load error:", err);
            return [];
          }),
          getMonthlyRevenueTrend().catch((err) => {
            console.warn("Revenue trend load error:", err);
            return [];
          }),
        ]);

      setMetrics(dashMetrics);
      setTodaySessions(todayList || []);
      setUpcomingBookings(upcomingList || []);
      setRecentPayments(paymentsList || []);
      setRecentClients(clientsList || []);
      setRevenueTrend(trendList || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <StudioLayout>
      <div className="space-y-6 sm:space-y-8 pb-12">
        {/* Studio Operations Header Banner */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 sm:p-8 rounded-3xl shadow-studio flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#F5E5EB]/40 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
          <div className="min-w-0 relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#68456E]">
                Studio Live Overview
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D084B] tracking-tight">
              {greeting}, {firstName}
            </h2>
            <p className="text-xs sm:text-sm text-[#846F7F] mt-1.5 font-normal leading-relaxed max-w-xl">
              Here is your daily snapshot of newborn photography bookings, client visits, and studio financial performance.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
            <button
              onClick={() => {
                setEditingBooking(null);
                setIsBookingModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3D084B] hover:bg-[#521363] text-white text-xs font-semibold tracking-wide shadow-subtle hover:shadow transition-all cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3D084B]/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Booking</span>
            </button>
            <button
              onClick={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF2F7] hover:bg-[#F3E2EE] text-[#3D084B] border border-[#EBD8E1] text-xs font-semibold transition-all shadow-subtle cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3D084B]/30"
            >
              <Users className="w-4 h-4 text-[#3D084B]" />
              <span>Add Client</span>
            </button>
            {!isPhotographer && (
              <Link
                href="/finance"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF2F7] hover:bg-[#F3E2EE] text-[#3D084B] border border-[#EBD8E1] text-xs font-semibold transition-all shadow-subtle active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#3D084B]/30"
              >
                <Receipt className="w-4 h-4 text-[#3D084B]" />
                <span>Record Payment</span>
              </Link>
            )}
          </div>
        </div>

        {/* 6 Core Required Dashboard Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 1. Total Bookings */}
          <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                Total Bookings
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B] shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                {loading ? "..." : metrics?.totalAllTimeBookings ?? 0}
              </span>
              <span className="text-[11px] text-[#846F7F] mt-1.5 block">
                <strong className="text-[#3D084B]">{metrics?.totalBookingsThisMonth ?? 0}</strong> this month
              </span>
            </div>
          </Card>

          {/* 2. Monthly Sales (Contracted) */}
          <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                Monthly Sales
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#F3E2EE] border border-[#D6A3C7] flex items-center justify-center text-[#68456E] shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                {loading ? "..." : isPhotographer ? "Restricted" : formatNPR(metrics?.monthlySalesRevenue)}
              </span>
              <span className="text-[11px] text-[#846F7F] mt-1.5 block">Contracted packages</span>
            </div>
          </Card>

          {/* 3. Amount Received (Cash) */}
          <Card className="p-5 flex flex-col justify-between hover:border-emerald-300 transition-all hover:shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                Amount Received
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                {loading ? "..." : isPhotographer ? "Restricted" : formatNPR(metrics?.monthlyCashCollected)}
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold mt-1.5 block">Actual cash received</span>
            </div>
          </Card>

          {/* 4. Outstanding Payments */}
          <Card className="p-5 flex flex-col justify-between hover:border-amber-300 transition-all hover:shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                Outstanding
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl sm:text-2xl font-serif font-bold text-amber-900 block leading-tight tabular-nums">
                {loading ? "..." : isPhotographer ? "Restricted" : formatNPR(metrics?.pendingBalanceTotal)}
              </span>
              <span className="text-[11px] text-amber-700 font-semibold mt-1.5 block">Pending balances</span>
            </div>
          </Card>

          {/* 5. Total Expenses */}
          <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                Total Expenses
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FBF2F6] border border-[#EBD8E1] flex items-center justify-center text-[#A4537F] shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#332A34] block leading-tight tabular-nums">
                {loading ? "..." : isPhotographer ? "Restricted" : formatNPR(metrics?.monthlyExpenses)}
              </span>
              <span className="text-[11px] text-[#846F7F] mt-1.5 block">Studio overhead</span>
            </div>
          </Card>

          {/* 6. Net Cash Profit */}
          <Card className="p-5 flex flex-col justify-between bg-gradient-to-br from-[#FAF2F7] to-[#F5E5EB]/50 border-[#D6A3C7] hover:border-[#3D084B] transition-all hover:shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D084B]">
                Net Cash Profit
              </span>
              <div className="w-8 h-8 rounded-xl bg-white border border-[#EBD8E1] flex items-center justify-center text-[#3D084B] shrink-0 shadow-subtle">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span
                className={`text-xl sm:text-2xl font-serif font-bold block leading-tight tabular-nums ${
                  (metrics?.cashProfit ?? 0) >= 0 ? "text-[#3D084B]" : "text-rose-700"
                }`}
              >
                {loading ? "..." : isPhotographer ? "Restricted" : formatNPR(metrics?.cashProfit)}
              </span>
              <span className="text-[11px] text-[#68456E] font-medium mt-1.5 block">Received − Expenses</span>
            </div>
          </Card>
        </div>

        {/* Monthly Revenue Trend Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Monthly Revenue & Expense Performance</CardTitle>
              <CardDescription>
                Comparison of contracted sales booked vs cash collected vs studio expenses over the past 6 months (NPR).
              </CardDescription>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FAF2F7] border border-[#EBD8E1] text-[#3D084B] w-fit">
              Cash Flow Trend
            </span>
          </CardHeader>
          <CardContent className="pt-2">
            {isPhotographer ? (
              <div className="h-48 flex items-center justify-center bg-[#FAF2F7]/50 rounded-2xl border border-[#EBD8E1] p-6 text-center">
                <div>
                  <p className="text-sm font-serif font-bold text-[#3D084B]">Financial Analytics Restricted</p>
                  <p className="text-xs text-[#846F7F] mt-1 max-w-md">
                    Studio revenue charts and financial performance metrics are restricted to Studio Admin and Staff accounts.
                  </p>
                </div>
              </div>
            ) : (
              <RevenueChart data={revenueTrend} loading={loading} />
            )}
          </CardContent>
        </Card>

        {/* Two-Column Grid: Today's Sessions & Upcoming Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Sessions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#3D084B]" />
                  <CardTitle>Today's Photography Sessions</CardTitle>
                </div>
                <CardDescription>
                  Sessions scheduled for today in Asia/Kathmandu timezone.
                </CardDescription>
              </div>
              <Badge variant="neutral" size="sm">
                {todaySessions.length} Today
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-[#846F7F] py-8 text-center animate-pulse">
                  Checking today's schedule...
                </p>
              ) : todaySessions.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="No sessions scheduled today"
                  description="Studio calendar is clear for today. New bookings scheduled for today will automatically appear here."
                  className="border-0 p-6 bg-transparent"
                />
              ) : (
                <div className="divide-y divide-[#EBD8E1]">
                  {todaySessions.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => setViewingBooking(booking)}
                      className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF2F7]/50 rounded-2xl px-2.5 transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-[#332A34] group-hover:text-[#3D084B] transition-colors truncate">
                            {booking.clientName}
                          </p>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-[#846F7F] mt-1 flex-wrap">
                          <span className="text-[#3D084B] font-semibold">{booking.packageName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-[#846F7F]" />
                            {formatTime12h(booking.startTime)} - {formatTime12h(booking.endTime)}
                          </span>
                          {booking.babyName && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-[#68456E]">
                                <Heart className="w-3 h-3 text-[#3D084B]" />
                                {booking.babyName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#3D084B] block font-serif">
                          {isPhotographer ? "Scheduled" : formatNPR(booking.totalAmount)}
                        </span>
                        {!isPhotographer && (
                          booking.remainingBalance > 0 ? (
                            <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 mt-1 inline-block">
                              Due: {formatNPR(booking.remainingBalance)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1 inline-block">
                              Paid in Full
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3D084B]" />
                  <CardTitle>Upcoming Photography Bookings</CardTitle>
                </div>
                <CardDescription>
                  Upcoming newborn, milestone, and family photo shoots.
                </CardDescription>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-[#3D084B] hover:text-[#68456E] flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>Full Calendar</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-[#846F7F] py-8 text-center animate-pulse">
                  Loading upcoming bookings...
                </p>
              ) : upcomingBookings.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No upcoming bookings scheduled"
                  description="When appointments are booked through the studio calendar, they will be tracked here."
                  className="border-0 p-6 bg-transparent"
                />
              ) : (
                <div className="divide-y divide-[#EBD8E1]">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => setViewingBooking(booking)}
                      className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF2F7]/50 rounded-2xl px-2.5 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1] flex flex-col items-center justify-center shrink-0 shadow-subtle">
                          <span className="text-[9px] font-bold uppercase text-[#846F7F]">
                            {booking.appointmentDate ? booking.appointmentDate.split("-")[1] : "M"}
                          </span>
                          <span className="text-sm font-serif font-bold text-[#3D084B] leading-tight">
                            {booking.appointmentDate ? booking.appointmentDate.split("-")[2] : "D"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#332A34] group-hover:text-[#3D084B] transition-colors truncate">
                            {booking.clientName}
                          </p>
                          <p className="text-xs text-[#846F7F] mt-0.5 truncate">
                            {booking.packageName} • {formatDate(booking.appointmentDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#3D084B] block font-serif">
                          {isPhotographer ? "Confirmed" : formatNPR(booking.totalAmount)}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border mt-1 inline-block ${getStatusBadgeStyle(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Two-Column Grid: Recent Payments & Recent Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#3D084B]" />
                  <CardTitle>Recent Payments & Advances</CardTitle>
                </div>
                <CardDescription>
                  Latest transaction receipts recorded by studio staff.
                </CardDescription>
              </div>
              <Link
                href="/finance"
                className="text-xs font-semibold text-[#3D084B] hover:text-[#68456E] flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>All Payments</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {isPhotographer ? (
                <div className="py-8 text-center text-xs text-[#846F7F]">
                  Payment transaction records are restricted to Studio Admin and Staff.
                </div>
              ) : loading ? (
                <p className="text-xs text-[#846F7F] py-8 text-center animate-pulse">
                  Loading payment transactions...
                </p>
              ) : recentPayments.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No payments recorded yet"
                  description="When advance or final payments are recorded for photography sessions, payment receipts will appear here."
                  className="border-0 p-6 bg-transparent"
                />
              ) : (
                <div className="divide-y divide-[#EBD8E1]">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#332A34] truncate">
                          {payment.clientName}
                        </p>
                        <p className="text-[11px] text-[#846F7F] font-mono mt-0.5 truncate">
                          {payment.receiptNumber} • {payment.paymentMethod} • {formatDate(payment.paymentDate)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#3D084B] font-serif shrink-0">
                        {formatNPR(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Clients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#3D084B]" />
                  <CardTitle>Recently Registered Clients</CardTitle>
                </div>
                <CardDescription>
                  Parents registered for photography consultations and bookings.
                </CardDescription>
              </div>
              <Link
                href="/clients"
                className="text-xs font-semibold text-[#3D084B] hover:text-[#68456E] flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>Client Directory</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-[#846F7F] py-8 text-center animate-pulse">
                  Loading client directory...
                </p>
              ) : recentClients.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No clients registered yet"
                  description="When parents or clients are added to the studio directory, their profile summaries will be listed here."
                  className="border-0 p-6 bg-transparent"
                />
              ) : (
                <div className="divide-y divide-[#EBD8E1]">
                  {recentClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setViewingClient(client)}
                      className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF2F7]/50 rounded-2xl px-2.5 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B] font-bold text-xs shrink-0 font-serif">
                          {client.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#332A34] group-hover:text-[#3D084B] transition-colors truncate">
                            {client.fullName}
                          </p>
                          <p className="text-[11px] text-[#846F7F] flex items-center gap-2 truncate mt-0.5">
                            <span className="font-mono">{client.phone}</span>
                            {client.babyName && (
                              <>
                                <span>•</span>
                                <span className="text-[#3D084B] font-medium truncate">Baby: {client.babyName}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF2F7] text-[#3D084B] border border-[#EBD8E1] shrink-0">
                        {client.totalBookings || 0} Bookings
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modals from Dashboard */}
        <BookingDetailModal
          isOpen={Boolean(viewingBooking)}
          onClose={() => setViewingBooking(null)}
          booking={viewingBooking}
          onEdit={(b) => {
            setViewingBooking(null);
            setEditingBooking(b);
            setIsBookingModalOpen(true);
          }}
          onUpdated={loadDashboard}
        />

        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={loadDashboard}
          editingBooking={editingBooking}
        />

        <ClientDetailModal
          isOpen={Boolean(viewingClient)}
          onClose={() => setViewingClient(null)}
          client={viewingClient}
          onEdit={(c) => {
            setViewingClient(null);
            setEditingClient(c);
            setIsClientModalOpen(true);
          }}
          onCreateBooking={(c) => {
            router.push(`/calendar?newBooking=true&clientId=${c.id}`);
          }}
        />

        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSave={async (clientData) => {
            await loadDashboard();
          }}
          initialClient={editingClient}
        />
      </div>
    </StudioLayout>
  );
}
