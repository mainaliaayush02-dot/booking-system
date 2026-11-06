"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { StudioLayout } from "@/components/layout/studio-layout";
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  CreditCard,
  Calendar,
  DollarSign,
  Users,
  Package as PackageIcon,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Activity,
  Filter,
  Clock,
  ArrowUpRight,
  Lock,
  RefreshCw,
  FileSpreadsheet,
  Sparkles,
  ChevronRight,
  UserCheck,
  Receipt,
} from "lucide-react";
import {
  getBookings,
  getPayments,
  getExpenses,
  getPackages,
  getClients,
  getStudioUsers,
  getActivityLogs,
} from "@/lib/firestore";
import {
  Booking,
  Payment,
  StudioExpense,
  PhotographyPackage,
  Client,
  StudioUser,
  ActivityLog,
} from "@/lib/types";
import {
  ReportPeriod,
  DateRangeFilter,
  PackageSortOption,
  TrendGrouping,
  getReportDateRange,
  getPeriodDisplayLabel,
  calculateFinancialSummary,
  calculateBookingPerformance,
  calculatePackageAnalytics,
  calculateClientAnalytics,
  calculateStaffPerformance,
  calculateTrendSeries,
} from "@/lib/finance-calculations";
import { formatNPR, formatDate, getTodayNepal, getStatusBadgeStyle } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import {
  PrintableReportModal,
  ReportType,
} from "@/components/reports/printable-report-modal";
import { useAuth } from "@/lib/firebase-auth";

type ActiveTab = "financial" | "bookings" | "packages" | "clients" | "staff";

const PERIOD_PRESETS: { id: ReportPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "quarter", label: "This Quarter" },
  { id: "year", label: "This Year" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom Range" },
];

export default function ReportsPage() {
  const { studioUser } = useAuth();
  const isPhotographer = studioUser?.role === "photographer";

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    isPhotographer ? "bookings" : "financial"
  );

  // Period Selector State
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Filters & Sub-options
  const [packageSort, setPackageSort] = useState<PackageSortOption>("most_booked");
  const [trendGrouping, setTrendGrouping] = useState<TrendGrouping>("monthly");

  // Export & Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [modalReportType, setModalReportType] = useState<ReportType>("financial_summary");

  // Raw Database Data
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<StudioExpense[]>([]);
  const [packages, setPackages] = useState<PhotographyPackage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [studioUsers, setStudioUsers] = useState<StudioUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const todayStr = useMemo(() => getTodayNepal(), []);

  // Sync tab if photographer accesses financial tab
  useEffect(() => {
    if (isPhotographer && activeTab === "financial") {
      setActiveTab("bookings");
    }
  }, [isPhotographer, activeTab]);

  // Load database records
  const loadData = async () => {
    try {
      setLoading(true);
      const [bList, pList, eList, pkgList, cList, uList, logList] = await Promise.all([
        getBookings().catch(() => []),
        getPayments().catch(() => []),
        getExpenses().catch(() => []),
        getPackages().catch(() => []),
        getClients().catch(() => []),
        getStudioUsers().catch(() => []),
        getActivityLogs(60).catch(() => []),
      ]);

      setBookings(bList);
      setPayments(pList);
      setExpenses(eList);
      setPackages(pkgList);
      setClients(cList);
      setStudioUsers(uList);
      setActivityLogs(logList);
    } catch (err) {
      console.error("Failed to load reports data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Active Date Range
  const currentDateRange = useMemo<DateRangeFilter>(() => {
    if (period === "custom") {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
      };
    }
    return getReportDateRange(period, todayStr);
  }, [period, customStartDate, customEndDate, todayStr]);

  const periodDisplayLabel = useMemo(() => {
    return getPeriodDisplayLabel(period, currentDateRange);
  }, [period, currentDateRange]);

  // Derived Reports (Pure Deterministic Calculations)
  const financialSummary = useMemo(() => {
    return calculateFinancialSummary(bookings, payments, expenses, currentDateRange, periodDisplayLabel);
  }, [bookings, payments, expenses, currentDateRange, periodDisplayLabel]);

  const bookingPerformance = useMemo(() => {
    return calculateBookingPerformance(bookings, currentDateRange);
  }, [bookings, currentDateRange]);

  const packageAnalytics = useMemo(() => {
    return calculatePackageAnalytics(packages, bookings, payments, currentDateRange, packageSort);
  }, [packages, bookings, payments, currentDateRange, packageSort]);

  const clientAnalytics = useMemo(() => {
    return calculateClientAnalytics(clients, bookings, payments, currentDateRange);
  }, [clients, bookings, payments, currentDateRange]);

  const staffPerformance = useMemo(() => {
    return calculateStaffPerformance(studioUsers, bookings, payments, expenses, activityLogs, currentDateRange);
  }, [studioUsers, bookings, payments, expenses, activityLogs, currentDateRange]);

  const trendSeries = useMemo(() => {
    return calculateTrendSeries(bookings, payments, expenses, trendGrouping, todayStr);
  }, [bookings, payments, expenses, trendGrouping, todayStr]);

  // Trigger print modal with specific report type
  const openReportModal = (type: ReportType) => {
    setModalReportType(type);
    setIsPrintModalOpen(true);
  };

  return (
    <StudioLayout>
      <div className="space-y-6 sm:space-y-8 pb-12 print:p-0">
        {/* Reports Header Banner */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 sm:p-7 rounded-3xl shadow-studio flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden print:hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#F5E5EB]/40 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="min-w-0 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3D084B] shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#68456E]">
                Executive Studio Analytics
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D084B] tracking-tight">
              Reports & Business Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-[#846F7F] mt-1 font-normal leading-relaxed max-w-xl">
              Performance metrics, booking volume, package profitability, client retention, and staff activity records.
            </p>
          </div>

          {/* Quick Action Center */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
            <Button
              variant="secondary"
              size="md"
              onClick={() => openReportModal(isPhotographer ? "booking_performance" : "financial_summary")}
              className="gap-2 shadow-subtle cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#3D084B]" />
              <span>Print Official Report</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => openReportModal(isPhotographer ? "package_analytics" : "financial_summary")}
              className="gap-2 shadow-subtle cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
            <button
              onClick={loadData}
              title="Refresh Reports Data"
              className="p-2.5 rounded-xl border border-[#EBD8E1] bg-white hover:bg-[#FAF2F7] text-[#3D084B] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Reporting Period Selector (9 Presets) */}
        <div className="bg-white border border-[#EBD8E1] p-4 sm:p-5 rounded-2xl shadow-subtle space-y-3.5 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#3D084B]" />
              <span className="text-xs font-bold text-[#3D084B] uppercase tracking-wider">
                Reporting Period
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#846F7F]">Active Window:</span>
              <span className="font-mono text-[11px] font-bold text-[#3D084B] bg-[#FAF2F7] border border-[#EBD8E1] px-2.5 py-1 rounded-lg">
                {periodDisplayLabel}
              </span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PERIOD_PRESETS.map((p) => {
              const active = period === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-[#3D084B] text-white shadow-subtle"
                      : "bg-[#FAF2F7] text-[#68456E] hover:bg-[#F3E2EE] border border-[#EBD8E1]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Controls */}
          {period === "custom" && (
            <div className="mt-3 pt-3 border-t border-[#EBD8E1] flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#846F7F] font-medium">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#EBD8E1] bg-white text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#846F7F] font-medium">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#EBD8E1] bg-white text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>
              <span className="text-[11px] text-[#846F7F] italic">
                * Dates evaluated in Asia/Kathmandu (Nepal Time)
              </span>
            </div>
          )}
        </div>

        {/* 5 Core Workspace Navigation Tabs */}
        <div className="border-b border-[#EBD8E1] flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
          {!isPhotographer && (
            <button
              onClick={() => setActiveTab("financial")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "financial"
                  ? "bg-[#3D084B] text-white shadow-subtle"
                  : "text-[#68456E] hover:bg-[#FAF2F7] hover:text-[#3D084B]"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Financial Performance</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "bookings"
                ? "bg-[#3D084B] text-white shadow-subtle"
                : "text-[#68456E] hover:bg-[#FAF2F7] hover:text-[#3D084B]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Booking Operations</span>
          </button>

          <button
            onClick={() => setActiveTab("packages")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "packages"
                ? "bg-[#3D084B] text-white shadow-subtle"
                : "text-[#68456E] hover:bg-[#FAF2F7] hover:text-[#3D084B]"
            }`}
          >
            <PackageIcon className="w-4 h-4" />
            <span>Package Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("clients")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "clients"
                ? "bg-[#3D084B] text-white shadow-subtle"
                : "text-[#68456E] hover:bg-[#FAF2F7] hover:text-[#3D084B]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Client Insights</span>
          </button>

          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "staff"
                ? "bg-[#3D084B] text-white shadow-subtle"
                : "text-[#68456E] hover:bg-[#FAF2F7] hover:text-[#3D084B]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Staff Performance & Activity</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: FINANCIAL PERFORMANCE */}
        {/* ========================================================= */}
        {activeTab === "financial" && !isPhotographer && (
          <div className="space-y-6">
            {/* 6 Key Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Total Booking Sales */}
              <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Total Booking Sales
                </span>
                <div className="mt-4">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                    {loading ? "..." : formatNPR(financialSummary.totalBookingSales)}
                  </span>
                  <span className="text-[11px] text-[#846F7F] mt-1.5 block">
                    {financialSummary.validBookingsCount} confirmed bookings
                  </span>
                </div>
              </Card>

              {/* Payments Received (Cash) */}
              <Card className="p-5 flex flex-col justify-between hover:border-emerald-300 transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Payments Received
                </span>
                <div className="mt-4">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-emerald-800 block leading-tight tabular-nums">
                    {loading ? "..." : formatNPR(financialSummary.totalPaymentsReceived)}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold mt-1.5 block">
                    {financialSummary.paymentsCount} payments recorded
                  </span>
                </div>
              </Card>

              {/* Outstanding Amount */}
              <Card className="p-5 flex flex-col justify-between hover:border-amber-300 transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Outstanding Amount
                </span>
                <div className="mt-4">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-amber-900 block leading-tight tabular-nums">
                    {loading ? "..." : formatNPR(financialSummary.outstandingAmount)}
                  </span>
                  <span className="text-[11px] text-amber-700 font-semibold mt-1.5 block">
                    Pending receivables
                  </span>
                </div>
              </Card>

              {/* Expenses Paid */}
              <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Expenses Paid
                </span>
                <div className="mt-4">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-[#332A34] block leading-tight tabular-nums">
                    {loading ? "..." : formatNPR(financialSummary.totalExpensesPaid)}
                  </span>
                  <span className="text-[11px] text-[#846F7F] mt-1.5 block">
                    {financialSummary.expensesCount} expense entries
                  </span>
                </div>
              </Card>

              {/* Net Cash Profit */}
              <Card className="p-5 flex flex-col justify-between bg-gradient-to-br from-[#FAF2F7] to-[#F5E5EB]/50 border-[#D6A3C7] hover:border-[#3D084B] transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D084B]">
                  Net Cash Profit
                </span>
                <div className="mt-4">
                  <span
                    className={`text-xl sm:text-2xl font-serif font-bold block leading-tight tabular-nums ${
                      financialSummary.cashProfit >= 0 ? "text-[#3D084B]" : "text-rose-700"
                    }`}
                  >
                    {loading ? "..." : formatNPR(financialSummary.cashProfit)}
                  </span>
                  <span className="text-[11px] text-[#68456E] font-medium mt-1.5 block">
                    Received − Expenses
                  </span>
                </div>
              </Card>

              {/* Collection Rate & Avg Value */}
              <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Collection Efficiency
                </span>
                <div className="mt-4">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                    {loading ? "..." : `${financialSummary.collectionRate}%`}
                  </span>
                  <span className="text-[11px] text-[#846F7F] mt-1.5 block">
                    Avg session: {formatNPR(financialSummary.avgBookingValue)}
                  </span>
                </div>
              </Card>
            </div>

            {/* Cash Flow Trends Chart */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Cash Flow & Performance Trend</CardTitle>
                  <CardDescription>
                    Tracking sales booked vs cash collected vs studio overhead over time (NPR).
                  </CardDescription>
                </div>
                {/* Granularity Toggle */}
                <div className="flex items-center gap-1.5 bg-[#FAF2F7] p-1 rounded-xl border border-[#EBD8E1]">
                  {(["daily", "weekly", "monthly"] as TrendGrouping[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setTrendGrouping(g)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        trendGrouping === g
                          ? "bg-white text-[#3D084B] shadow-subtle border border-[#EBD8E1]"
                          : "text-[#846F7F] hover:text-[#3D084B]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <RevenueChart data={trendSeries} loading={loading} />
              </CardContent>
            </Card>

            {/* Financial Breakdowns (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Channel Breakdown */}
              <Card className="p-6">
                <div className="flex items-center justify-between border-b border-[#EBD8E1] pb-3 mb-4">
                  <h3 className="font-serif text-lg font-bold text-[#3D084B] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#3D084B]" />
                    <span>Collections by Payment Channel</span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openReportModal("payment_collection")}
                    className="text-xs text-[#3D084B]"
                  >
                    View Ledger
                  </Button>
                </div>
                <div className="space-y-3.5 text-xs">
                  {Object.entries(financialSummary.paymentMethodBreakdown).map(([method, amount]) => {
                    const share =
                      financialSummary.totalPaymentsReceived > 0
                        ? Math.round((amount / financialSummary.totalPaymentsReceived) * 100)
                        : 0;
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex items-center justify-between font-medium">
                          <span className="capitalize text-[#332A34]">
                            {method.replace("_", " ")}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-[#3D084B]">
                              {formatNPR(amount)}
                            </span>
                            <span className="text-[11px] text-[#846F7F]">({share}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#FAF2F7] overflow-hidden">
                          <div
                            className="h-full bg-[#3D084B] rounded-full transition-all"
                            style={{ width: `${Math.max(2, share)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Expense Category Breakdown */}
              <Card className="p-6">
                <div className="flex items-center justify-between border-b border-[#EBD8E1] pb-3 mb-4">
                  <h3 className="font-serif text-lg font-bold text-[#3D084B] flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#A4537F]" />
                    <span>Studio Overhead by Category</span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openReportModal("expense_ledger")}
                    className="text-xs text-[#3D084B]"
                  >
                    View Expenses
                  </Button>
                </div>
                <div className="space-y-3.5 text-xs max-h-80 overflow-y-auto pr-1">
                  {Object.entries(financialSummary.expenseCategoryBreakdown).length === 0 ? (
                    <p className="text-[#846F7F] py-4 text-center">No expenses in this period.</p>
                  ) : (
                    Object.entries(financialSummary.expenseCategoryBreakdown).map(
                      ([cat, amount]) => {
                        const share =
                          financialSummary.totalExpensesPaid > 0
                            ? Math.round((amount / financialSummary.totalExpensesPaid) * 100)
                            : 0;
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex items-center justify-between font-medium">
                              <span className="capitalize text-[#332A34]">
                                {cat.replace("_", " ")}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-[#332A34]">
                                  {formatNPR(amount)}
                                </span>
                                <span className="text-[11px] text-[#846F7F]">({share}%)</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[#FAF2F7] overflow-hidden">
                              <div
                                className="h-full bg-[#A4537F] rounded-full transition-all"
                                style={{ width: `${Math.max(2, share)}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BOOKING OPERATIONS */}
        {/* ========================================================= */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            {/* Operational KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Total Bookings
                </span>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                    {loading ? "..." : bookingPerformance.totalBookings}
                  </span>
                  <span className="text-[11px] text-[#846F7F] mt-1.5 block">Scheduled sessions</span>
                </div>
              </Card>

              <Card className="p-5 flex flex-col justify-between hover:border-emerald-300 transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Completed Sessions
                </span>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-800 block leading-tight tabular-nums">
                    {loading ? "..." : bookingPerformance.completedBookings}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold mt-1.5 block">
                    Completion: {bookingPerformance.completionRate}%
                  </span>
                </div>
              </Card>

              <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Confirmed Sessions
                </span>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                    {loading ? "..." : bookingPerformance.confirmedBookings}
                  </span>
                  <span className="text-[11px] text-[#846F7F] mt-1.5 block">Active on calendar</span>
                </div>
              </Card>

              <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Upcoming Sessions
                </span>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                    {loading ? "..." : bookingPerformance.upcomingBookings}
                  </span>
                  <span className="text-[11px] text-[#846F7F] mt-1.5 block">Future dates scheduled</span>
                </div>
              </Card>

              <Card className="p-5 flex flex-col justify-between hover:border-amber-300 transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Rescheduled
                </span>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-800 block leading-tight tabular-nums">
                    {loading ? "..." : bookingPerformance.rescheduledBookings}
                  </span>
                  <span className="text-[11px] text-amber-700 font-semibold mt-1.5 block">Dates adjusted</span>
                </div>
              </Card>

              <Card className="p-5 flex flex-col justify-between hover:border-rose-300 transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Cancelled Sessions
                </span>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-rose-700 block leading-tight tabular-nums">
                    {loading ? "..." : bookingPerformance.cancelledBookings}
                  </span>
                  <span className="text-[11px] text-rose-700 font-semibold mt-1.5 block">
                    Cancellation: {bookingPerformance.cancellationRate}%
                  </span>
                </div>
              </Card>
            </div>

            {/* Category Breakdown & Operations Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6">
                <div className="flex items-center justify-between border-b border-[#EBD8E1] pb-3 mb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#3D084B]">
                      Volume by Photography Category
                    </h3>
                    <p className="text-xs text-[#846F7F] mt-0.5">
                      Distribution of photo shoots across studio specialties.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openReportModal("booking_performance")}
                    className="text-xs text-[#3D084B]"
                  >
                    Export Report
                  </Button>
                </div>

                <div className="space-y-4">
                  {bookingPerformance.categoryBreakdown.length === 0 ? (
                    <p className="text-xs text-[#846F7F] py-8 text-center">
                      No bookings recorded in this reporting period.
                    </p>
                  ) : (
                    bookingPerformance.categoryBreakdown.map((cat, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-[#332A34]">{cat.category}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#846F7F]">
                              {cat.count} {cat.count === 1 ? "session" : "sessions"} ({cat.share}%)
                            </span>
                            {!isPhotographer && (
                              <span className="font-serif font-bold text-[#3D084B] tabular-nums">
                                {formatNPR(cat.revenue)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#FAF2F7] border border-[#EBD8E1] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#3D084B] to-[#68456E] rounded-full transition-all"
                            style={{ width: `${Math.max(5, cat.share)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Status Summary Card */}
              <Card className="p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#3D084B] border-b border-[#EBD8E1] pb-3">
                    Booking Pipeline Status
                  </h3>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#846F7F]">Completed:</span>
                      <Badge variant="success" size="sm">
                        {bookingPerformance.completedBookings}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#846F7F]">Confirmed:</span>
                      <Badge variant="plum" size="sm">
                        {bookingPerformance.confirmedBookings}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#846F7F]">Rescheduled:</span>
                      <Badge variant="warning" size="sm">
                        {bookingPerformance.rescheduledBookings}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#846F7F]">Cancelled:</span>
                      <Badge variant="danger" size="sm">
                        {bookingPerformance.cancelledBookings}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#EBD8E1] text-[11px] text-[#846F7F] space-y-1">
                  <p>Completion Ratio: {bookingPerformance.completionRate}%</p>
                  <p>Cancellation Ratio: {bookingPerformance.cancellationRate}%</p>
                  <Link
                    href="/calendar"
                    className="inline-flex items-center gap-1 text-[#3D084B] font-semibold hover:underline mt-2"
                  >
                    <span>Open Calendar Manager</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PACKAGE PERFORMANCE */}
        {/* ========================================================= */}
        {activeTab === "packages" && (
          <div className="space-y-6">
            {/* Sub-header & Sorting Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EBD8E1] shadow-subtle">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#3D084B]">
                  Package Popularity & Revenue Contribution
                </h3>
                <p className="text-xs text-[#846F7F] mt-0.5">
                  Performance across packages, snapshot price history, and conversion share.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#846F7F] font-medium">Sort by:</span>
                <select
                  value={packageSort}
                  onChange={(e) => setPackageSort(e.target.value as PackageSortOption)}
                  className="px-3 py-1.5 rounded-xl border border-[#EBD8E1] bg-[#FAF2F7] text-xs font-semibold text-[#3D084B] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                >
                  <option value="most_booked">Most Booked</option>
                  {!isPhotographer && (
                    <>
                      <option value="highest_value">Highest Total Value</option>
                      <option value="highest_collection">Highest Cash Collected</option>
                      <option value="highest_balance">Highest Balance Due</option>
                    </>
                  )}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openReportModal("package_analytics")}
                  className="gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[#3D084B]" />
                  <span>Print</span>
                </Button>
              </div>
            </div>

            {/* Package Performance Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EBD8E1] bg-[#FAF2F7]/80 text-[#846F7F] uppercase tracking-wider font-semibold text-[10px]">
                      <th className="py-3 px-4">Package</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Bookings</th>
                      <th className="py-3 px-4 text-center">Share</th>
                      <th className="py-3 px-4 text-right">Avg Value</th>
                      {!isPhotographer && (
                        <>
                          <th className="py-3 px-4 text-right">Total Sales</th>
                          <th className="py-3 px-4 text-right">Cash Collected</th>
                          <th className="py-3 px-4 text-right">Outstanding</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBD8E1] text-[#332A34]">
                    {loading ? (
                      <tr>
                        <td colSpan={isPhotographer ? 5 : 8} className="py-8 text-center text-[#846F7F]">
                          Loading package analytics...
                        </td>
                      </tr>
                    ) : packageAnalytics.length === 0 ? (
                      <tr>
                        <td colSpan={isPhotographer ? 5 : 8} className="py-8 text-center text-[#846F7F]">
                          No package bookings in this reporting window.
                        </td>
                      </tr>
                    ) : (
                      packageAnalytics.map((pkg) => (
                        <tr key={pkg.packageId || pkg.packageName} className="hover:bg-[#FAF2F7]/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#3D084B]">
                            {pkg.packageName}
                          </td>
                          <td className="py-3.5 px-4 text-[#846F7F]">
                            {pkg.category}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            {pkg.bookingsCount}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-[#FAF2F7] border border-[#EBD8E1] font-mono text-[11px] font-bold text-[#68456E]">
                              {pkg.shareOfBookings}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-serif">
                            {formatNPR(pkg.avgBookingValue)}
                          </td>
                          {!isPhotographer && (
                            <>
                              <td className="py-3.5 px-4 text-right font-serif font-bold text-[#3D084B]">
                                {formatNPR(pkg.totalContractedValue)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-serif font-bold text-emerald-800">
                                {formatNPR(pkg.paymentsCollected)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-serif font-bold text-amber-800">
                                {formatNPR(pkg.outstandingBalance)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: CLIENT INSIGHTS */}
        {/* ========================================================= */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            {/* Client KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Total Registered Clients
                </span>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                    {loading ? "..." : clientAnalytics.totalRegisteredClients}
                  </span>
                  <span className="text-[11px] text-[#846F7F] mt-1.5 block">Studio client roster</span>
                </div>
              </Card>

              <Card className="p-5 flex flex-col justify-between hover:border-emerald-300 transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  New Clients in Period
                </span>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-800 block leading-tight tabular-nums">
                    {loading ? "..." : clientAnalytics.newClientsInPeriod}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold mt-1.5 block">
                    First-time registrations
                  </span>
                </div>
              </Card>

              <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  Repeat Clients
                </span>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                    {loading ? "..." : clientAnalytics.repeatClientsCount}
                  </span>
                  <span className="text-[11px] text-[#846F7F] mt-1.5 block">2+ sessions booked</span>
                </div>
              </Card>

              <Card className="p-5 flex flex-col justify-between bg-gradient-to-br from-[#FAF2F7] to-[#F5E5EB]/50 border-[#D6A3C7] hover:border-[#3D084B] transition-all hover:shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D084B]">
                  Repeat Client Rate
                </span>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                    {loading ? "..." : `${clientAnalytics.repeatClientRate}%`}
                  </span>
                  <span className="text-[11px] text-[#68456E] font-medium mt-1.5 block">
                    Retention & loyalty
                  </span>
                </div>
              </Card>
            </div>

            {/* Top Clients Table */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Top Studio Clients by Engagement</CardTitle>
                  <CardDescription>
                    Clients with sessions scheduled in this window, ordered by total contracted value.
                  </CardDescription>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openReportModal("client_activity")}
                  className="gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[#3D084B]" />
                  <span>Print Activity</span>
                </Button>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EBD8E1] bg-[#FAF2F7]/80 text-[#846F7F] uppercase tracking-wider font-semibold text-[10px]">
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4 text-center">Bookings</th>
                      {!isPhotographer && (
                        <>
                          <th className="py-3 px-4 text-right">Contracted Value</th>
                          <th className="py-3 px-4 text-right">Cash Paid</th>
                          <th className="py-3 px-4 text-right">Balance Due</th>
                        </>
                      )}
                      <th className="py-3 px-4 text-right">Latest Session</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBD8E1] text-[#332A34]">
                    {loading ? (
                      <tr>
                        <td colSpan={isPhotographer ? 5 : 8} className="py-8 text-center text-[#846F7F]">
                          Loading client insights...
                        </td>
                      </tr>
                    ) : clientAnalytics.topClients.length === 0 ? (
                      <tr>
                        <td colSpan={isPhotographer ? 5 : 8} className="py-8 text-center text-[#846F7F]">
                          No active clients found in this period.
                        </td>
                      </tr>
                    ) : (
                      clientAnalytics.topClients.map((c) => (
                        <tr key={c.clientId} className="hover:bg-[#FAF2F7]/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#3D084B]">
                            {c.clientName}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#846F7F]">
                            {c.clientPhone}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span className="px-2 py-0.5 rounded-full bg-[#FAF2F7] border border-[#EBD8E1]">
                              {c.bookingsCount}
                            </span>
                          </td>
                          {!isPhotographer && (
                            <>
                              <td className="py-3.5 px-4 text-right font-serif font-bold text-[#3D084B]">
                                {formatNPR(c.totalBookingValue)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-serif font-bold text-emerald-800">
                                {formatNPR(c.totalCollected)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-serif font-bold text-amber-800">
                                {formatNPR(c.outstandingBalance)}
                              </td>
                            </>
                          )}
                          <td className="py-3.5 px-4 text-right text-[#846F7F]">
                            {c.lastBookingDate ? formatDate(c.lastBookingDate) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Link
                              href={`/sessions?search=${encodeURIComponent(c.clientName)}`}
                              className="text-[11px] text-[#3D084B] font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <span>View Sessions</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: STAFF PERFORMANCE & RECENT ACTIVITY */}
        {/* ========================================================= */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            {/* Unassigned Sessions Alert Banner */}
            {staffPerformance.unassignedBookingsCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">
                      {staffPerformance.unassignedBookingsCount} Photography Session(s) Unassigned
                    </p>
                    <p className="text-[11px] text-amber-800">
                      These sessions have not yet been assigned to a studio photographer or lead artist.
                    </p>
                  </div>
                </div>
                <Link
                  href="/calendar"
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors"
                >
                  Assign in Calendar
                </Link>
              </div>
            )}

            {/* Staff Performance Table */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Studio Staff & Photographer Contribution</CardTitle>
                  <CardDescription>
                    Assigned sessions, completed shoots, and administrative entries in this period.
                  </CardDescription>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openReportModal("staff_activity")}
                  className="gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[#3D084B]" />
                  <span>Print Summary</span>
                </Button>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EBD8E1] bg-[#FAF2F7]/80 text-[#846F7F] uppercase tracking-wider font-semibold text-[10px]">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-center">Sessions Assigned</th>
                      <th className="py-3 px-4 text-center">Completed</th>
                      <th className="py-3 px-4 text-center">Payments Recorded</th>
                      <th className="py-3 px-4 text-center">Expenses Recorded</th>
                      {!isPhotographer && (
                        <th className="py-3 px-4 text-right">Collections Handled</th>
                      )}
                      <th className="py-3 px-4 text-center">Logged Activities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBD8E1] text-[#332A34]">
                    {loading ? (
                      <tr>
                        <td colSpan={isPhotographer ? 7 : 8} className="py-8 text-center text-[#846F7F]">
                          Loading staff performance metrics...
                        </td>
                      </tr>
                    ) : staffPerformance.staffMembers.length === 0 ? (
                      <tr>
                        <td colSpan={isPhotographer ? 7 : 8} className="py-8 text-center text-[#846F7F]">
                          No staff accounts registered.
                        </td>
                      </tr>
                    ) : (
                      staffPerformance.staffMembers.map((s) => (
                        <tr key={s.uid} className="hover:bg-[#FAF2F7]/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#3D084B]">{s.displayName}</p>
                            <p className="text-[11px] text-[#846F7F]">{s.email}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                s.role === "admin"
                                  ? "bg-[#3D084B] text-white border-[#3D084B]"
                                  : s.role === "photographer"
                                  ? "bg-[#FAF2F7] text-[#68456E] border-[#EBD8E1]"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {s.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            {s.bookingsManagedCount}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-800">
                            {s.sessionsCompletedCount}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {s.paymentsRecordedCount}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {s.expensesRecordedCount}
                          </td>
                          {!isPhotographer && (
                            <td className="py-3.5 px-4 text-right font-serif font-bold text-[#3D084B]">
                              {formatNPR(s.totalPaymentsCollectedNPR || 0)}
                            </td>
                          )}
                          <td className="py-3.5 px-4 text-center font-mono">
                            {s.recentActivityCount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Recent Audit Trail Feed */}
            <Card className="p-6">
              <h3 className="font-serif text-lg font-bold text-[#3D084B] border-b border-[#EBD8E1] pb-3 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#3D084B]" />
                <span>Recent Studio Audit Trail</span>
              </h3>

              {activityLogs.length === 0 ? (
                <p className="text-xs text-[#846F7F] py-6 text-center">
                  No activity logs registered yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {activityLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#FAF2F7]/50 border border-[#EBD8E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#3D084B] capitalize">
                          {log.userName || "Studio User"}
                        </span>
                        <span className="text-[#846F7F] mx-1.5">•</span>
                        <span className="font-medium text-[#332A34]">{log.action}</span>
                        {log.details && (
                          <p className="text-[11px] text-[#846F7F] mt-0.5">{log.details}</p>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-[#846F7F] shrink-0">
                        {log.timestamp ? formatDate(log.timestamp.slice(0, 10)) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Printable Report Modal */}
        <PrintableReportModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          initialReportType={modalReportType}
          periodLabel={periodDisplayLabel}
          range={currentDateRange}
          currentUser={studioUser}
          financialSummary={financialSummary}
          bookingPerformance={bookingPerformance}
          packageAnalytics={packageAnalytics}
          clientAnalytics={clientAnalytics}
          staffPerformance={staffPerformance}
          rawBookings={bookings}
          rawPayments={payments}
          rawExpenses={expenses}
        />
      </div>
    </StudioLayout>
  );
}