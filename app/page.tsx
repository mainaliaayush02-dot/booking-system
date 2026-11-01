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
} from "lucide-react";
import {
  getBookings,
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
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<(DashboardMetrics & { totalAllTimeBookings: number }) | null>(null);
  const [todaySessions, setTodaySessions] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<MonthlyTrendData[]>([]);
  const [loading, setLoading] = useState(true);

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
          getDashboardMetrics(),
          getTodaySessions(),
          getUpcomingBookings(6),
          getRecentPayments(5),
          getRecentClients(5),
          getMonthlyRevenueTrend(),
        ]);

      setMetrics(dashMetrics);
      setTodaySessions(todayList);
      setUpcomingBookings(upcomingList);
      setRecentPayments(paymentsList);
      setRecentClients(clientsList);
      setRevenueTrend(trendList);
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
      <div className="space-y-8 pb-12">
        {/* Studio Operations Header Banner */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3D084B] animate-pulse" />
              <h2 className="font-serif text-2xl font-bold text-[#3D084B] tracking-tight">
                Studio Operations Overview
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#846F7F] mt-1 font-normal">
              Newborn Photography Nepal by Navin • Real-time bookings, payments, and financial health.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setEditingBooking(null);
                setIsBookingModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3D084B] hover:bg-[#32063E] text-white text-xs font-semibold tracking-wide shadow-subtle transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Booking</span>
            </button>
            <button
              onClick={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EAD1DC] hover:bg-[#DFBFCE] text-[#3D084B] border border-[#EBD8E1] text-xs font-semibold transition-all shadow-subtle cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#3D084B]" />
              <span>Add Client</span>
            </button>
            <Link
              href="/finance"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EAD1DC] hover:bg-[#DFBFCE] text-[#3D084B] border border-[#EBD8E1] text-xs font-semibold transition-all shadow-subtle"
            >
              <Receipt className="w-3.5 h-3.5 text-[#3D084B]" />
              <span>Record Payment</span>
            </Link>
          </div>
        </div>

        {/* 6 Core Required Dashboard Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 1. Total Bookings */}
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F]">
                Total Bookings
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B]">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-[#3D084B] block leading-tight">
                {loading ? "..." : metrics?.totalAllTimeBookings ?? 0}
              </span>
              <span className="text-[11px] text-[#846F7F]">
                {metrics?.totalBookingsThisMonth ?? 0} this month
              </span>
            </div>
          </Card>

          {/* 2. Monthly Sales (Contracted) */}
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F]">
                Monthly Sales
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#F3E2EE] border border-[#D6A3C7] flex items-center justify-center text-[#68456E]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-[#3D084B] block leading-tight">
                {loading ? "..." : formatNPR(metrics?.monthlySalesRevenue)}
              </span>
              <span className="text-[11px] text-[#846F7F]">Contracted packages</span>
            </div>
          </Card>

          {/* 3. Amount Received (Cash) */}
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F]">
                Amount Received
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B]">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-[#3D084B] block leading-tight">
                {loading ? "..." : formatNPR(metrics?.monthlyCashCollected)}
              </span>
              <span className="text-[11px] text-[#68456E] font-medium">Actual cash received</span>
            </div>
          </Card>

          {/* 4. Outstanding Payments */}
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F]">
                Outstanding
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-amber-900 block leading-tight">
                {loading ? "..." : formatNPR(metrics?.pendingBalanceTotal)}
              </span>
              <span className="text-[11px] text-amber-700 font-medium">Pending balances</span>
            </div>
          </Card>

          {/* 5. Total Expenses */}
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F]">
                Total Expenses
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FBF2F6] border border-[#EBD8E1] flex items-center justify-center text-[#A4537F]">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-[#332A34] block leading-tight">
                {loading ? "..." : formatNPR(metrics?.monthlyExpenses)}
              </span>
              <span className="text-[11px] text-[#846F7F]">Studio overhead</span>
            </div>
          </Card>

          {/* 6. Net Cash Profit */}
          <Card className="p-5 flex flex-col justify-between bg-[#FAF2F7]/70 border-[#D6A3C7]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D084B]">
                Net Cash Profit
              </span>
              <div className="w-8 h-8 rounded-xl bg-white border border-[#EBD8E1] flex items-center justify-center text-[#3D084B]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-serif font-bold block leading-tight ${
                  (metrics?.cashProfit ?? 0) >= 0 ? "text-[#3D084B]" : "text-rose-700"
                }`}
              >
                {loading ? "..." : formatNPR(metrics?.cashProfit)}
              </span>
              <span className="text-[11px] text-[#68456E] font-medium">Received − Expenses</span>
            </div>
          </Card>
        </div>

        {/* Monthly Revenue Trend Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Monthly Revenue & Expense Performance</CardTitle>
              <CardDescription>
                Comparison of contracted sales booked vs cash collected vs studio expenses over the past 6 months (NPR).
              </CardDescription>
            </div>
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#FAF2F7] border border-[#EBD8E1] text-[#3D084B]">
              Cash Flow Trend
            </span>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueTrend} loading={loading} />
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
                      className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF2F7]/50 rounded-xl px-2 transition-colors group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#332A34] group-hover:text-[#3D084B] transition-colors">
                            {booking.clientName}
                          </p>
                          <span
                            className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#846F7F] mt-1">
                          <span className="text-[#3D084B] font-medium">{booking.packageName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#846F7F]" />
                            {formatTime12h(booking.startTime)} - {formatTime12h(booking.endTime)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#3D084B] block font-serif">
                          {formatNPR(booking.totalAmount)}
                        </span>
                        {booking.remainingBalance > 0 ? (
                          <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Due: {formatNPR(booking.remainingBalance)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Paid
                          </span>
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
                className="text-xs font-semibold text-[#3D084B] hover:text-[#68456E] flex items-center gap-1"
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
                      className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF2F7]/50 rounded-xl px-2 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF2F7] border border-[#EBD8E1] flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold uppercase text-[#3D084B]">
                            {booking.appointmentDate ? booking.appointmentDate.split("-")[1] : "M"}
                          </span>
                          <span className="text-xs font-serif font-bold text-[#3D084B] leading-tight">
                            {booking.appointmentDate ? booking.appointmentDate.split("-")[2] : "D"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#332A34] group-hover:text-[#3D084B] transition-colors">
                            {booking.clientName}
                          </p>
                          <p className="text-xs text-[#846F7F] mt-0.5">
                            {booking.packageName} • {formatDate(booking.appointmentDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#3D084B] block font-serif">
                          {formatNPR(booking.totalAmount)}
                        </span>
                        <span
                          className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
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
                className="text-xs font-semibold text-[#3D084B] hover:text-[#68456E] flex items-center gap-1"
              >
                <span>All Payments</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
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
                      <div>
                        <p className="text-xs font-semibold text-[#332A34]">
                          {payment.clientName}
                        </p>
                        <p className="text-[11px] text-[#846F7F]">
                          {payment.receiptNumber} • {payment.paymentMethod} • {formatDate(payment.paymentDate)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#3D084B] font-serif">
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
                className="text-xs font-semibold text-[#3D084B] hover:text-[#68456E] flex items-center gap-1"
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
                      className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAF2F7]/50 rounded-xl px-2 transition-colors group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#332A34] group-hover:text-[#3D084B] transition-colors">
                          {client.fullName}
                        </p>
                        <p className="text-[11px] text-[#846F7F] flex items-center gap-2">
                          <span>{client.phone}</span>
                          {client.babyName && (
                            <>
                              <span>•</span>
                              <span className="text-[#3D084B] font-medium">Baby: {client.babyName}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF2F7] text-[#3D084B] border border-[#EBD8E1]">
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
