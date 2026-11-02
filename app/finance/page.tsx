"use client";

import React, { useEffect, useState, useMemo } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import {
  Receipt,
  Plus,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Search,
  Download,
  Filter,
  CheckCircle,
  Calendar,
  Building,
  Tag,
  Printer,
  RotateCcw,
  RefreshCw,
  Edit2,
  FileText,
  ChevronDown,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  getPayments,
  getExpenses,
  getBookings,
  migrateHistoricalAdvances,
  MigrationReport,
} from "@/lib/firestore";
import { Payment, StudioExpense, Booking, ExpenseCategory } from "@/lib/types";
import {
  calculateFinancialSummary,
  getDatePresetRange,
  DatePreset,
  DateRangeFilter,
  FinancialSummaryReport,
} from "@/lib/finance-calculations";
import { formatNPR, formatDate, getTodayNepal } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PaymentModal } from "@/components/finance/payment-modal";
import { ExpenseModal, EXPENSE_CATEGORIES } from "@/components/finance/expense-modal";
import { PrintableReceiptModal } from "@/components/finance/printable-receipt-modal";
import { ReversalModal } from "@/components/finance/reversal-modal";
import { useAuth } from "@/lib/firebase-auth";

type ActiveTab = "payments" | "expenses";

export default function FinancePage() {
  const { studioUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<StudioExpense[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("payments");

  // Date Range Filter
  const todayStr = useMemo(() => getTodayNepal(), []);
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [customStartDate, setCustomStartDate] = useState(todayStr.slice(0, 7) + "-01");
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals & Active Selections
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<StudioExpense | null>(null);

  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [reversalTargetPayment, setReversalTargetPayment] = useState<Payment | null>(null);
  const [reversalTargetExpense, setReversalTargetExpense] = useState<StudioExpense | null>(null);
  const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);

  // Historical Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationBanner, setMigrationBanner] = useState<MigrationReport | null>(null);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [pList, eList, bList] = await Promise.all([
        getPayments(),
        getExpenses(),
        getBookings(),
      ]);
      setPayments(pList);
      setExpenses(eList);
      setBookings(bList);
    } catch (err) {
      console.error("Finance data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // Compute effective date range
  const currentRange: DateRangeFilter = useMemo(() => {
    if (datePreset === "custom") {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
      };
    }
    return getDatePresetRange(datePreset, todayStr);
  }, [datePreset, customStartDate, customEndDate, todayStr]);

  // Compute canonical financial summary for the selected period
  const summary: FinancialSummaryReport = useMemo(() => {
    return calculateFinancialSummary(
      bookings,
      payments,
      expenses,
      currentRange,
      datePreset.toUpperCase()
    );
  }, [bookings, payments, expenses, currentRange, datePreset]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Date filter
      const pDate = p.paymentDate || p.createdAt?.slice(0, 10);
      if (currentRange.startDate && pDate < currentRange.startDate) return false;
      if (currentRange.endDate && pDate > currentRange.endDate) return false;

      // Method filter
      if (methodFilter !== "all" && p.paymentMethod.toLowerCase() !== methodFilter.toLowerCase()) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          p.receiptNumber?.toLowerCase().includes(q) ||
          p.clientName?.toLowerCase().includes(q) ||
          p.bookingNumber?.toLowerCase().includes(q) ||
          p.transactionReference?.toLowerCase().includes(q) ||
          p.notes?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [payments, currentRange, methodFilter, search]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Date filter
      const eDate = e.expenseDate || e.createdAt?.slice(0, 10);
      if (currentRange.startDate && eDate < currentRange.startDate) return false;
      if (currentRange.endDate && eDate > currentRange.endDate) return false;

      // Method filter
      if (methodFilter !== "all" && e.paymentMethod.toLowerCase() !== methodFilter.toLowerCase()) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && e.category !== categoryFilter) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          e.title?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.vendor?.toLowerCase().includes(q) ||
          e.paidTo?.toLowerCase().includes(q) ||
          e.referenceNumber?.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [expenses, currentRange, methodFilter, categoryFilter, search]);

  // Handle Historical Advances Migration
  const handleRunMigration = async () => {
    if (!studioUser) return;
    try {
      setIsMigrating(true);
      const report = await migrateHistoricalAdvances({
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
      setMigrationBanner(report);
      await fetchFinanceData();
    } catch (err: any) {
      console.error("Migration error:", err);
      alert(`Migration error: ${err?.message || "Failed to run advance migration"}`);
    } finally {
      setIsMigrating(false);
    }
  };

  // Open receipt printable modal
  const handleOpenReceipt = (payment: Payment) => {
    setSelectedReceiptPayment(payment);
    setIsReceiptModalOpen(true);
  };

  // Open reversal modal for payment
  const handleOpenPaymentReversal = (payment: Payment) => {
    setReversalTargetPayment(payment);
    setReversalTargetExpense(null);
    setIsReversalModalOpen(true);
  };

  // Open reversal modal for expense
  const handleOpenExpenseReversal = (expense: StudioExpense) => {
    setReversalTargetExpense(expense);
    setReversalTargetPayment(null);
    setIsReversalModalOpen(true);
  };

  // Open edit modal for expense
  const handleEditExpense = (expense: StudioExpense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (activeTab === "payments") {
      const headers = [
        "Receipt Number",
        "Client Name",
        "Booking Number",
        "Date",
        "Method",
        "Category",
        "Amount (NPR)",
        "Previous Balance",
        "Remaining Balance",
        "Status",
        "Reference",
        "Notes",
        "Recorded By",
      ];
      const rows = filteredPayments.map((p) => [
        p.receiptNumber,
        `"${p.clientName}"`,
        p.bookingNumber || "DIRECT",
        p.paymentDate,
        p.paymentMethod,
        p.paymentType,
        p.amount,
        p.previousBalance ?? "",
        p.remainingBalanceAfter ?? "",
        p.isReversed ? "VOID / REVERSED" : "ACTIVE",
        `"${p.transactionReference || ""}"`,
        `"${p.notes || ""}"`,
        `"${p.recordedByName || ""}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `studio_payment_receipts_${datePreset}_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = [
        "Expense Item",
        "Category",
        "Amount (NPR)",
        "Date",
        "Payment Channel",
        "Vendor / Paid To",
        "Invoice Reference",
        "Status",
        "Recorded By",
        "Notes",
      ];
      const rows = filteredExpenses.map((e) => [
        `"${e.title}"`,
        e.category,
        e.amount,
        e.expenseDate,
        e.paymentMethod,
        `"${e.paidTo || e.vendor || ""}"`,
        `"${e.referenceNumber || ""}"`,
        e.isReversed ? "VOID / REVERSED" : "ACTIVE",
        `"${e.recordedByName || ""}"`,
        `"${e.notes || ""}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `studio_expenses_${datePreset}_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Find linked booking for receipt view
  const linkedBookingForReceipt = useMemo(() => {
    if (!selectedReceiptPayment?.bookingId) return null;
    return bookings.find((b) => b.id === selectedReceiptPayment.bookingId) || null;
  }, [selectedReceiptPayment, bookings]);

  return (
    <StudioLayout>
      <div className="space-y-6 sm:space-y-8 pb-16">
        {/* Studio Finance Header Banner */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 sm:p-7 rounded-3xl shadow-studio flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B] shrink-0">
                <Receipt className="w-4 h-4 text-[#3D084B]" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D084B] tracking-tight">
                Accounts & Financial Ledger
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#846F7F] mt-1 font-normal leading-relaxed">
              Official receipts, advance reconciliation, studio operating overhead, and canonical cash balance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={handleRunMigration}
              isLoading={isMigrating}
              className="gap-2 border-[#D6A3C7] text-[#3D084B] hover:bg-[#FAF2F7]"
              title="Scan existing bookings with advance deposits and synchronize into payments ledger"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Audit & Sync Advances</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              className="gap-2 shadow-subtle"
            >
              <Plus className="w-4 h-4" />
              <span>Log Expense</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsPaymentModalOpen(true)}
              className="gap-2 shadow-subtle"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </Button>
          </div>
        </div>

        {/* Migration Alert Notification if executed */}
        {migrationBanner && (
          <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start justify-between gap-3 shadow-subtle animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">
                  Historical Advance Ledger Synchronization Complete
                </h4>
                <p className="mt-0.5 text-emerald-800 text-xs">
                  Scanned <strong>{migrationBanner.scannedBookings}</strong> total bookings:{" "}
                  <strong>{migrationBanner.migratedPayments}</strong> advance payments imported,{" "}
                  <strong>{migrationBanner.alreadySynchronized}</strong> already synchronized,{" "}
                  <strong>{migrationBanner.skippedBookings}</strong> skipped (unpaid/cancelled),{" "}
                  <strong>{migrationBanner.failedCount}</strong> failed.
                </p>
                {migrationBanner.details.length > 0 && (
                  <div className="mt-2 text-[11px] font-mono text-emerald-700 bg-emerald-100/60 p-2.5 rounded-xl max-h-24 overflow-y-auto">
                    {migrationBanner.details.map((d, idx) => (
                      <div key={idx}>• {d}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setMigrationBanner(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Date Range Preset Selector Bar */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-3.5 sm:p-4 rounded-3xl shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F] mr-2 shrink-0 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#3D084B]" />
              Period:
            </span>
            {(
              [
                { label: "Today", value: "today" },
                { label: "This Month", value: "month" },
                { label: "This Quarter", value: "quarter" },
                { label: "This Year", value: "year" },
                { label: "All Time", value: "all" },
                { label: "Custom Range", value: "custom" },
              ] as { label: string; value: DatePreset }[]
            ).map((preset) => (
              <button
                key={preset.value}
                onClick={() => setDatePreset(preset.value)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  datePreset === preset.value
                    ? "bg-[#3D084B] text-white shadow-subtle"
                    : "bg-[#FAF2F7] text-[#68456E] hover:bg-[#F3E2EE]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {datePreset === "custom" && (
            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#EBD8E1]">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-[#FAF2F7] border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
              />
              <span className="text-[#846F7F]">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-[#FAF2F7] border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
              />
            </div>
          )}

          <div className="text-[11px] text-[#846F7F] font-medium shrink-0 text-right">
            Timezone: <span className="font-semibold text-[#3D084B]">Asia/Kathmandu (NPT)</span>
          </div>
        </div>

        {/* 5 Financial Metric Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Booking Sales */}
          <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                Total Booking Sales
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-center text-[#3D084B] shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#3D084B] block leading-tight tabular-nums">
                {loading ? "..." : formatNPR(summary.totalBookingSales)}
              </span>
              <span className="text-[11px] text-[#846F7F] mt-1.5 block">
                {summary.validBookingsCount} bookings contracted
              </span>
            </div>
          </Card>

          {/* 2. Total Payments Received (Cash Collection) */}
          <Card className="p-5 flex flex-col justify-between hover:border-emerald-300 transition-all hover:shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                Payments Received
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl sm:text-2xl font-serif font-bold text-emerald-900 block leading-tight tabular-nums">
                {loading ? "..." : formatNPR(summary.totalPaymentsReceived)}
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold mt-1.5 block">
                {summary.paymentsCount} payments ({summary.collectionRate}% collected)
              </span>
            </div>
          </Card>

          {/* 3. Outstanding Balance (Pending Receivables) */}
          <Card className="p-5 flex flex-col justify-between hover:border-amber-300 transition-all hover:shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                Outstanding Amount
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl sm:text-2xl font-serif font-bold text-amber-900 block leading-tight tabular-nums">
                {loading ? "..." : formatNPR(summary.outstandingAmount)}
              </span>
              <span className="text-[11px] text-amber-700 font-semibold mt-1.5 block">
                Unsettled client dues
              </span>
            </div>
          </Card>

          {/* 4. Total Expenses Paid (Overhead) */}
          <Card className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all hover:shadow-subtle">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                Expenses Paid
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FBF2F6] border border-[#EBD8E1] flex items-center justify-center text-[#A4537F] shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#332A34] block leading-tight tabular-nums">
                {loading ? "..." : formatNPR(summary.totalExpensesPaid)}
              </span>
              <span className="text-[11px] text-[#846F7F] mt-1.5 block">
                {summary.expensesCount} operating expenses
              </span>
            </div>
          </Card>

          {/* 5. Net Cash Profit (STRICTLY Cash Received - Expenses Paid) */}
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
                  summary.cashProfit >= 0 ? "text-[#3D084B]" : "text-rose-700"
                }`}
              >
                {loading ? "..." : formatNPR(summary.cashProfit)}
              </span>
              <span className="text-[11px] text-[#68456E] font-medium mt-1.5 block">
                Received − Expenses (Cash Basis)
              </span>
            </div>
          </Card>
        </div>

        {/* Tab Controls & Filters Bar */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-4 sm:p-5 rounded-3xl shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Dual Ledger Tab Pills */}
            <div className="flex items-center p-1 bg-[#FAF2F7] rounded-2xl border border-[#EBD8E1] w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("payments")}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "payments"
                    ? "bg-[#3D084B] text-white shadow-subtle"
                    : "text-[#846F7F] hover:text-[#3D084B]"
                }`}
              >
                Payment Receipts ({filteredPayments.length})
              </button>
              <button
                onClick={() => setActiveTab("expenses")}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "expenses"
                    ? "bg-[#3D084B] text-white shadow-subtle"
                    : "text-[#846F7F] hover:text-[#3D084B]"
                }`}
              >
                Studio Overhead & Expenses ({filteredExpenses.length})
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF2F7] hover:bg-[#F3E2EE] text-[#3D084B] border border-[#EBD8E1] text-xs font-bold transition-all shadow-subtle cursor-pointer active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5 text-[#3D084B]" />
              <span>Export {activeTab === "payments" ? "Receipts" : "Expenses"} CSV</span>
            </button>
          </div>

          {/* Search & Channel/Category Filter Toolbar */}
          <div className="pt-3 border-t border-[#EBD8E1] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] px-4 py-2.5 rounded-2xl w-full md:max-w-md focus-within:ring-1 focus-within:ring-[#3D084B]">
              <Search className="w-4 h-4 text-[#846F7F] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === "payments"
                    ? "Search receipt #, client name, booking ref..."
                    : "Search expense item, vendor, reference #..."
                }
                className="w-full bg-transparent text-xs text-[#332A34] placeholder-[#846F7F]/60 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Payment Channel Filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3.5 py-2 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] font-medium focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
              >
                <option value="all">All Payment Channels</option>
                <option value="esewa">eSewa Mobile Wallet</option>
                <option value="khalti">Khalti Wallet</option>
                <option value="bank_transfer">Bank Transfer / Fonepay</option>
                <option value="cash">Studio Cash</option>
                <option value="other">POS Card / Other</option>
              </select>

              {/* Expense Category Filter (When in Expenses tab) */}
              {activeTab === "expenses" && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3.5 py-2 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] font-medium focus:outline-none focus:ring-1 focus:ring-[#3D084B] max-w-[200px]"
                >
                  <option value="all">All 12 Expense Categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}

              <span className="text-[11px] text-[#846F7F] font-semibold hidden lg:inline-block shrink-0">
                {activeTab === "payments" ? filteredPayments.length : filteredExpenses.length} Records
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Payment Receipts Ledger */}
        {activeTab === "payments" && (
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-16 text-center">
                <p className="text-xs text-[#846F7F] animate-pulse font-medium">
                  Loading payment receipts ledger...
                </p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={payments.length === 0 ? "No payment receipts recorded yet" : "No payments match your filter"}
                description={
                  payments.length === 0
                    ? "When clients make advance booking deposits or settle final balances, receipts will be listed here."
                    : "Try adjusting your search query, date period, or payment channel filter."
                }
                action={
                  payments.length === 0
                    ? {
                        label: "Record First Payment",
                        onClick: () => setIsPaymentModalOpen(true),
                      }
                    : undefined
                }
                className="p-12 border-0 bg-transparent"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF2F7]/80 border-b border-[#EBD8E1] text-[#3D084B] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Client & Booking</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Channel</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Recorded By</th>
                      <th className="py-3 px-4 text-right">Amount (NPR)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBD8E1] text-[#332A34]">
                    {filteredPayments.map((p) => {
                      const isReversed = p.isReversed;
                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors ${
                            isReversed ? "bg-rose-50/40 text-rose-900/60" : "hover:bg-[#FAF2F7]/50"
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-[#3D084B]">
                            <button
                              onClick={() => handleOpenReceipt(p)}
                              className="hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                              title="Click to view & print official receipt"
                            >
                              <span>{p.receiptNumber}</span>
                              {p.isMigration && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  Migrated
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#332A34] block">
                              {p.clientName}
                            </span>
                            {p.bookingNumber && p.bookingNumber !== "MANUAL" && (
                              <span className="text-[10px] text-[#846F7F] font-mono block mt-0.5">
                                Ref: {p.bookingNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FAF2F7] text-[#3D084B] border border-[#EBD8E1]">
                              {p.paymentType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium capitalize text-[#68456E] block">
                              {p.paymentMethod.replace("_", " ")}
                            </span>
                            {p.transactionReference && (
                              <span className="text-[10px] text-[#846F7F] font-mono block truncate max-w-[120px]">
                                Ref: {p.transactionReference}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#846F7F] whitespace-nowrap">
                            {formatDate(p.paymentDate)}
                          </td>
                          <td className="py-3.5 px-4 text-[#846F7F] text-[11px]">
                            {p.recordedByName || "Studio Staff"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-serif font-bold text-sm tabular-nums text-[#3D084B]">
                            <span className={isReversed ? "line-through text-rose-700" : ""}>
                              {formatNPR(p.amount)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isReversed ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                Void / Reversed
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenReceipt(p)}
                                className="p-1.5 rounded-lg bg-[#FAF2F7] hover:bg-[#F3E2EE] text-[#3D084B] border border-[#EBD8E1] transition-all cursor-pointer"
                                title="Print Official Receipt"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {!isReversed && (
                                <button
                                  onClick={() => handleOpenPaymentReversal(p)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
                                  title="Reverse / Void Payment"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Tab 2: Studio Overhead & Expenses Log */}
        {activeTab === "expenses" && (
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-16 text-center">
                <p className="text-xs text-[#846F7F] animate-pulse font-medium">
                  Loading studio expenses log...
                </p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={expenses.length === 0 ? "No studio expenses logged yet" : "No expenses match your search"}
                description={
                  expenses.length === 0
                    ? "Record studio rent, prop purchases, utilities, and marketing overhead to accurately track net cash profit."
                    : "Try adjusting your search query, date period, or category filter."
                }
                action={
                  expenses.length === 0
                    ? {
                        label: "Log First Expense",
                        onClick: () => {
                          setEditingExpense(null);
                          setIsExpenseModalOpen(true);
                        },
                      }
                    : undefined
                }
                className="p-12 border-0 bg-transparent"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF2F7]/80 border-b border-[#EBD8E1] text-[#3D084B] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Expense Item</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Vendor / Paid To</th>
                      <th className="py-3 px-4">Channel</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Recorded By</th>
                      <th className="py-3 px-4 text-right">Amount (NPR)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBD8E1] text-[#332A34]">
                    {filteredExpenses.map((e) => {
                      const isReversed = e.isReversed;
                      return (
                        <tr
                          key={e.id}
                          className={`transition-colors ${
                            isReversed ? "bg-rose-50/40 text-rose-900/60" : "hover:bg-[#FAF2F7]/50"
                          }`}
                        >
                          <td className="py-3.5 px-4 font-semibold text-[#332A34]">
                            <span>{e.title}</span>
                            {e.notes && (
                              <span className="block text-[10px] text-[#846F7F] italic mt-0.5 max-w-xs truncate">
                                "{e.notes}"
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FAF2F7] text-[#68456E] border border-[#EBD8E1]">
                              {e.category.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#846F7F]">
                            <span>{e.paidTo || e.vendor || "—"}</span>
                            {e.referenceNumber && (
                              <span className="block text-[10px] text-[#846F7F] font-mono">
                                Ref: {e.referenceNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 capitalize text-[#68456E] font-medium whitespace-nowrap">
                            {e.paymentMethod.replace("_", " ")}
                          </td>
                          <td className="py-3.5 px-4 text-[#846F7F] whitespace-nowrap">
                            {formatDate(e.expenseDate)}
                          </td>
                          <td className="py-3.5 px-4 text-[#846F7F] text-[11px]">
                            {e.recordedByName || "Studio Staff"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-serif font-bold text-[#A4537F] text-sm tabular-nums">
                            <span className={isReversed ? "line-through text-rose-700" : ""}>
                              {formatNPR(e.amount)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isReversed ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                Void / Reversed
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isReversed && (
                                <>
                                  <button
                                    onClick={() => handleEditExpense(e)}
                                    className="p-1.5 rounded-lg bg-[#FAF2F7] hover:bg-[#F3E2EE] text-[#3D084B] border border-[#EBD8E1] transition-all cursor-pointer"
                                    title="Edit Expense"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenExpenseReversal(e)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
                                    title="Reverse / Void Expense"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Modals */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={(newPayment) => {
            fetchFinanceData();
            if (newPayment) {
              handleOpenReceipt(newPayment);
            }
          }}
        />

        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
          }}
          onSuccess={fetchFinanceData}
          initialExpense={editingExpense}
        />

        <PrintableReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedReceiptPayment(null);
          }}
          payment={selectedReceiptPayment}
          booking={linkedBookingForReceipt}
        />

        <ReversalModal
          isOpen={isReversalModalOpen}
          onClose={() => {
            setIsReversalModalOpen(false);
            setReversalTargetPayment(null);
            setReversalTargetExpense(null);
          }}
          onSuccess={fetchFinanceData}
          targetPayment={reversalTargetPayment}
          targetExpense={reversalTargetExpense}
        />
      </div>
    </StudioLayout>
  );
}
