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
  Phone,
  BarChart3,
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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<(DashboardMetrics & { totalAllTimeBookings: number }) | null>(null);
  const [todaySessions, setTodaySessions] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<MonthlyTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const [dashMetrics, todayList, upcomingList, paymentsList, clientsList, trendList] =
          await Promise.all([
            getDashboardMetrics(),
            getTodaySessions(),
            getUpcomingBookings(5),
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
    }

    fetchDashboard();
  }, []);

  return (
    <StudioLayout>
      <div className="space-y-8 pb-12">
        {/* Studio Operations Header */}
        <div className="bg-white border border-[#EFE8DC] p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-studio-600 animate-pulse" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal-900 tracking-tight">
                Studio Operations Overview
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
              Internal business health, photography sessions, and financial reconciliation.
            </p>
          </div>

          {/* Quick Actions */}
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

        {/* 6 Core Required Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 1. Total Bookings */}
          <Card className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                Total Bookings
              </span>
              <div className="w-7 h-7 rounded-lg bg-studio-50 border border-studio-200 flex items-center justify-center text-studio-600">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-charcoal-900 block leading-tight">
                {loading ? "..." : metrics?.totalAllTimeBookings ?? 0}
              </span>
              <span className="text-[11px] text-charcoal-400">
                {metrics?.totalBookingsThisMonth ?? 0} this month
              </span>
            </div>
          </Card>

          {/* 2. Monthly Sales (Contracted) */}
          <Card className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                Monthly Sales
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-charcoal-900 block leading-tight">
                {loading ? "..." : formatNPR(metrics?.monthlySalesRevenue)}
              </span>
              <span className="text-[11px] text-charcoal-400">Contracted bookings</span>
            </div>
          </Card>

          {/* 3. Amount Received (Cash) */}
          <Card className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                Amount Received
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-emerald-800 block leading-tight">
                {loading ? "..." : formatNPR(metrics?.monthlyCashCollected)}
              </span>
              <span className="text-[11px] text-emerald-700">Actual money received</span>
            </div>
          </Card>

          {/* 4. Outstanding Payments */}
          <Card className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                Outstanding
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-amber-900 block leading-tight">
                {loading ? "..." : formatNPR(metrics?.pendingBalanceTotal)}
              </span>
              <span className="text-[11px] text-amber-700">Uncollected balances</span>
            </div>
          </Card>

          {/* 5. Total Expenses */}
          <Card className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                Total Expenses
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-serif font-bold text-rose-800 block leading-tight">
                {loading ? "..." : formatNPR(metrics?.monthlyExpenses)}
              </span>
              <span className="text-[11px] text-charcoal-400">Rent, props, operations</span>
            </div>
          </Card>

          {/* 6. Net Cash Profit */}
          <Card className="p-4 sm:p-5 flex flex-col justify-between bg-[#FAF8F5]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-studio-700">
                Net Cash Profit
              </span>
              <div className="w-7 h-7 rounded-lg bg-studio-100 border border-studio-200 flex items-center justify-center text-studio-700">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-serif font-bold block leading-tight ${
                  (metrics?.cashProfit ?? 0) >= 0 ? "text-charcoal-900" : "text-rose-600"
                }`}
              >
                {loading ? "..." : formatNPR(metrics?.cashProfit)}
              </span>
              <span className="text-[11px] text-charcoal-500">Collected − Expenses</span>
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
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-studio-50 border border-studio-200 text-studio-700">
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
                  <CalendarCheck className="w-4 h-4 text-studio-600" />
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
                <p className="text-xs text-charcoal-400 py-8 text-center animate-pulse">
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
                <div className="divide-y divide-[#F2ECE1]">
                  {todaySessions.map((booking) => (
                    <div key={booking.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-charcoal-900">
                            {booking.clientName}
                          </p>
                          <span
                            className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded border ${getStatusBadgeStyle(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-charcoal-500 mt-1">
                          <span className="text-studio-700 font-medium">{booking.packageName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-charcoal-400" />
                            {formatTime12h(booking.startTime)} - {formatTime12h(booking.endTime)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-charcoal-900 block">
                          {formatNPR(booking.totalAmount)}
                        </span>
                        {booking.remainingBalance > 0 ? (
                          <span className="text-[10px] text-amber-700 font-medium">
                            Due: {formatNPR(booking.remainingBalance)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-medium">Paid</span>
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
                  <Clock className="w-4 h-4 text-studio-600" />
                  <CardTitle>Upcoming Photography Bookings</CardTitle>
                </div>
                <CardDescription>
                  Upcoming newborn, milestone, and family photo shoots.
                </CardDescription>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-studio-700 hover:text-studio-900 flex items-center gap-1"
              >
                <span>Calendar</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-charcoal-400 py-8 text-center animate-pulse">
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
                <div className="divide-y divide-[#F2ECE1]">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-studio-50 border border-studio-200 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-semibold uppercase text-studio-600">
                            {booking.appointmentDate ? booking.appointmentDate.split("-")[1] : "M"}
                          </span>
                          <span className="text-xs font-serif font-bold text-charcoal-900 leading-tight">
                            {booking.appointmentDate ? booking.appointmentDate.split("-")[2] : "D"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-charcoal-900">
                            {booking.clientName}
                          </p>
                          <p className="text-xs text-charcoal-500 mt-0.5">
                            {booking.packageName} • {formatDate(booking.appointmentDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-charcoal-900 block">
                          {formatNPR(booking.totalAmount)}
                        </span>
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${getStatusBadgeStyle(
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
                  <CreditCard className="w-4 h-4 text-studio-600" />
                  <CardTitle>Recent Payments & Advances</CardTitle>
                </div>
                <CardDescription>
                  Latest transaction receipts recorded by studio staff.
                </CardDescription>
              </div>
              <Link
                href="/finance"
                className="text-xs font-semibold text-studio-700 hover:text-studio-900 flex items-center gap-1"
              >
                <span>All Payments</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-charcoal-400 py-8 text-center animate-pulse">
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
                <div className="divide-y divide-[#F2ECE1]">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-charcoal-900">
                          {payment.clientName}
                        </p>
                        <p className="text-[11px] text-charcoal-400">
                          {payment.receiptNumber} • {payment.paymentMethod} • {formatDate(payment.paymentDate)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 font-serif">
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
                  <UserCheck className="w-4 h-4 text-studio-600" />
                  <CardTitle>Recently Registered Clients</CardTitle>
                </div>
                <CardDescription>
                  Parents registered for photography consultations and bookings.
                </CardDescription>
              </div>
              <Link
                href="/clients"
                className="text-xs font-semibold text-studio-700 hover:text-studio-900 flex items-center gap-1"
              >
                <span>Client Directory</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-xs text-charcoal-400 py-8 text-center animate-pulse">
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
                <div className="divide-y divide-[#F2ECE1]">
                  {recentClients.map((client) => (
                    <div key={client.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-charcoal-900">
                          {client.fullName}
                        </p>
                        <p className="text-[11px] text-charcoal-400 flex items-center gap-2">
                          <span>{client.phone}</span>
                          {client.babyName && (
                            <>
                              <span>•</span>
                              <span className="text-studio-700 font-medium">Baby: {client.babyName}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-cream-100 text-charcoal-600 border border-cream-200">
                        {client.totalBookings || 0} Bookings
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudioLayout>
  );
}
