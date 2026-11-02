"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
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
  DateRangeFilter,
  FinancialSummaryReport,
  BookingPerformanceReport,
  PackageAnalyticsItem,
  ClientAnalyticsReport,
  StaffPerformanceReport,
} from "@/lib/finance-calculations";
import { formatNPR, formatDate, getTodayNepal } from "@/lib/utils";
import { Printer, Download, X, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

export type ReportType =
  | "financial_summary"
  | "payment_collection"
  | "expense_ledger"
  | "outstanding_balances"
  | "booking_performance"
  | "package_analytics"
  | "client_activity"
  | "staff_activity";

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportType?: ReportType;
  periodLabel: string;
  range?: DateRangeFilter;
  currentUser?: { displayName: string; role: string; email?: string } | null;
  financialSummary: FinancialSummaryReport;
  bookingPerformance: BookingPerformanceReport;
  packageAnalytics: PackageAnalyticsItem[];
  clientAnalytics: ClientAnalyticsReport;
  staffPerformance: StaffPerformanceReport;
  rawBookings: Booking[];
  rawPayments: Payment[];
  rawExpenses: StudioExpense[];
}

const REPORT_TYPE_LABELS: { type: ReportType; label: string; description: string }[] = [
  { type: "financial_summary", label: "Financial Summary Report", description: "Contracted sales, cash collections, studio overhead, and net cash profit." },
  { type: "payment_collection", label: "Payment Collection Ledger", description: "Audited client payments, receipts, payment channels, and transaction references." },
  { type: "expense_ledger", label: "Studio Overhead & Expenses", description: "Operating expenses across 12 studio categories, vendors, and receipts." },
  { type: "outstanding_balances", label: "Outstanding Dues & Balances", description: "Active bookings with unpaid receivable balances awaiting final settlement." },
  { type: "booking_performance", label: "Booking Performance & Operations", description: "Session volume, completion rate, cancellations, and category breakdown." },
  { type: "package_analytics", label: "Package Performance Analytics", description: "Package popularity, contracted value, collections, and share of revenue." },
  { type: "client_activity", label: "Client Activity & Insights", description: "Client directory, booking frequency, lifetime value, and outstanding balances." },
  { type: "staff_activity", label: "Staff Performance & Activity Trail", description: "Staff bookings managed, sessions completed, and logged activities." },
];

export function PrintableReportModal({
  isOpen,
  onClose,
  initialReportType = "financial_summary",
  periodLabel,
  range,
  currentUser,
  financialSummary,
  bookingPerformance,
  packageAnalytics,
  clientAnalytics,
  staffPerformance,
  rawBookings,
  rawPayments,
  rawExpenses,
}: PrintableReportModalProps) {
  const [selectedType, setSelectedType] = useState<ReportType>(initialReportType);
  const printableAreaRef = useRef<HTMLDivElement>(null);

  const isPhotographer = currentUser?.role === "photographer";
  const todayNpt = getTodayNepal();
  const generationTimestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kathmandu",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handlePrint = () => {
    window.print();
  };

  // Safe CSV export generator
  const handleDownloadCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `npn_${selectedType}_${todayNpt}.csv`;

    if (selectedType === "financial_summary") {
      if (isPhotographer) {
        alert("Financial reports are restricted for photographer role.");
        return;
      }
      headers = ["Financial Metric", "Amount (NPR)", "Notes"];
      rows = [
        ["Total Booking Sales", financialSummary.totalBookingSales, "Contracted packages in period"],
        ["Total Payments Received", financialSummary.totalPaymentsReceived, "Actual cash collected in period"],
        ["Outstanding Amount", financialSummary.outstandingAmount, "Unpaid receivables on active bookings"],
        ["Total Expenses Paid", financialSummary.totalExpensesPaid, "Operating studio overhead"],
        ["Net Cash Profit", financialSummary.cashProfit, "Strictly Payments Received minus Expenses Paid"],
        ["Collection Rate", `${financialSummary.collectionRate}%`, "Percentage of sales collected in cash"],
        ["Valid Bookings Count", financialSummary.validBookingsCount, "Non-cancelled bookings"],
        ["Average Booking Value", financialSummary.avgBookingValue, "Average contracted package value"],
      ];
    } else if (selectedType === "payment_collection") {
      if (isPhotographer) {
        alert("Payment records are restricted for photographer role.");
        return;
      }
      headers = ["Receipt #", "Client Name", "Booking Ref", "Date", "Channel", "Type", "Amount (NPR)", "Status", "Reference", "Recorded By"];
      rows = rawPayments.filter(p => !p.isReversed).map(p => [
        p.receiptNumber,
        `"${p.clientName}"`,
        p.bookingNumber || "DIRECT",
        p.paymentDate,
        p.paymentMethod,
        p.paymentType,
        p.amount,
        p.isReversed ? "REVERSED" : "ACTIVE",
        `"${p.transactionReference || ""}"`,
        `"${p.recordedByName || ""}"`,
      ]);
    } else if (selectedType === "expense_ledger") {
      if (isPhotographer) {
        alert("Expense records are restricted for photographer role.");
        return;
      }
      headers = ["Item Description", "Category", "Amount (NPR)", "Date", "Channel", "Vendor / Paid To", "Invoice Ref", "Recorded By", "Notes"];
      rows = rawExpenses.filter(e => !e.isReversed).map(e => [
        `"${e.title}"`,
        e.category,
        e.amount,
        e.expenseDate,
        e.paymentMethod,
        `"${e.paidTo || e.vendor || ""}"`,
        `"${e.referenceNumber || ""}"`,
        `"${e.recordedByName || ""}"`,
        `"${e.notes || ""}"`,
      ]);
    } else if (selectedType === "outstanding_balances") {
      if (isPhotographer) {
        alert("Financial records are restricted for photographer role.");
        return;
      }
      headers = ["Booking Number", "Client Name", "Phone", "Package", "Appointment Date", "Total (NPR)", "Advance Paid (NPR)", "Remaining Due (NPR)", "Payment Status"];
      rows = rawBookings
        .filter(b => b.status !== "cancelled" && (Number(b.remainingBalance) || 0) > 0)
        .map(b => [
          b.bookingNumber,
          `"${b.clientName}"`,
          `"${b.clientPhone}"`,
          `"${b.packageName}"`,
          b.appointmentDate,
          b.totalAmount,
          b.advancePaid,
          b.remainingBalance,
          b.paymentStatus || "partially_paid",
        ]);
    } else if (selectedType === "booking_performance") {
      headers = ["Booking Number", "Client Name", "Category", "Package", "Appointment Date", "Time", "Status", "Location", "Photographer"];
      rows = rawBookings.map(b => [
        b.bookingNumber,
        `"${b.clientName}"`,
        `"${b.category}"`,
        `"${b.packageName}"`,
        b.appointmentDate,
        `${b.startTime} - ${b.endTime}`,
        b.status,
        b.location || "studio",
        `"${b.photographerName || "Unassigned"}"`,
      ]);
    } else if (selectedType === "package_analytics") {
      headers = ["Package Name", "Category", "Bookings Count", "Share of Bookings", "Contracted Value (NPR)", "Collected (NPR)", "Outstanding (NPR)", "Avg Value (NPR)", "Status"];
      rows = packageAnalytics.map(pkg => [
        `"${pkg.packageName}"`,
        `"${pkg.category}"`,
        pkg.bookingsCount,
        `${pkg.shareOfBookings}%`,
        isPhotographer ? "RESTRICTED" : pkg.totalContractedValue,
        isPhotographer ? "RESTRICTED" : pkg.paymentsCollected,
        isPhotographer ? "RESTRICTED" : pkg.outstandingBalance,
        isPhotographer ? "RESTRICTED" : pkg.avgBookingValue,
        pkg.active ? "Active" : "Archived",
      ]);
    } else if (selectedType === "client_activity") {
      headers = ["Client Name", "Phone", "Email", "Bookings Count", "Total Contracted (NPR)", "Total Collected (NPR)", "Outstanding Due (NPR)", "Last Booking Date"];
      rows = clientAnalytics.topClients.map(c => [
        `"${c.clientName}"`,
        `"${c.clientPhone}"`,
        `"${c.clientEmail || ""}"`,
        c.bookingsCount,
        isPhotographer ? "RESTRICTED" : c.totalBookingValue,
        isPhotographer ? "RESTRICTED" : c.totalCollected,
        isPhotographer ? "RESTRICTED" : c.outstandingBalance,
        c.lastBookingDate || "-",
      ]);
    } else if (selectedType === "staff_activity") {
      headers = ["Staff Member", "Role", "Assigned Bookings", "Completed Sessions", "Payments Recorded", "Expenses Recorded", "Recent Activity Count"];
      rows = staffPerformance.staffMembers.map(s => [
        `"${s.displayName}"`,
        s.role,
        s.bookingsManagedCount,
        s.sessionsCompletedCount,
        s.paymentsRecordedCount,
        s.expensesRecordedCount,
        s.recentActivityCount,
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentLabelObj = REPORT_TYPE_LABELS.find(r => r.type === selectedType) || REPORT_TYPE_LABELS[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Report Selector Header (Screen Only) */}
        <div className="bg-[#FAF2F7] border border-[#EBD8E1] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#3D084B] shrink-0" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ReportType)}
              className="bg-white border border-[#EBD8E1] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D084B] focus:outline-none focus:ring-1 focus:ring-[#3D084B] cursor-pointer"
            >
              {REPORT_TYPE_LABELS.map((item) => (
                <option
                  key={item.type}
                  value={item.type}
                  disabled={isPhotographer && ["financial_summary", "payment_collection", "expense_ledger", "outstanding_balances"].includes(item.type)}
                >
                  {item.label} {isPhotographer && ["financial_summary", "payment_collection", "expense_ledger", "outstanding_balances"].includes(item.type) ? "(Restricted)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3E2EE] border border-[#EBD8E1] text-[#3D084B] text-xs font-bold transition-all shadow-subtle cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 shadow-subtle"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </Button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div
          ref={printableAreaRef}
          id="official-report-print-area"
          className="bg-white border border-[#EBD8E1] rounded-3xl p-6 sm:p-8 shadow-studio print:border-none print:shadow-none print:p-0 text-xs text-[#332A34]"
        >
          {/* Official Document Brand Header */}
          <div className="flex items-start justify-between border-b border-[#EBD8E1] pb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 min-w-[64px] max-w-[64px] min-h-[64px] max-h-[64px] rounded-2xl overflow-hidden border border-[#EBD8E1] bg-[#FAF2F7] shrink-0 relative shadow-subtle">
                <Image
                  src="/brand/logo.jpg"
                  alt="Newborn Photography Nepal"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#3D084B] tracking-tight leading-none">
                  Newborn Photography Nepal
                </h1>
                <p className="text-xs text-[#846F7F] font-medium mt-1">
                  Studio Manager • By Navin
                </p>
                <p className="text-[11px] text-[#846F7F] mt-0.5">
                  Kathmandu, Nepal • Official Business Intelligence & Analytics Report
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF2F7] text-[#3D084B] border border-[#EBD8E1]">
                Official Studio Report
              </span>
              <div className="font-serif text-sm font-bold text-[#3D084B] mt-2">
                {currentLabelObj.label}
              </div>
              <div className="text-[11px] text-[#846F7F] mt-0.5 font-medium">
                Period: {periodLabel}
              </div>
            </div>
          </div>

          {/* Meta Bar */}
          <div className="py-3 border-b border-[#EBD8E1] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#846F7F]">
            <div>
              Generated on: <strong className="text-[#332A34]">{generationTimestamp}</strong> (NPT)
            </div>
            <div>
              Prepared By: <strong className="text-[#3D084B]">{currentUser?.displayName || "Studio Administrator"}</strong> ({currentUser?.role || "Admin"})
            </div>
            <div>
              Timezone: <strong className="text-[#332A34]">Asia/Kathmandu (UTC+05:45)</strong>
            </div>
          </div>

          {/* Report Body Switching */}
          <div className="py-6">
            {/* 1. FINANCIAL SUMMARY REPORT */}
            {selectedType === "financial_summary" && (
              isPhotographer ? (
                <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-800">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-rose-600" />
                  <h3 className="font-bold text-sm">Financial Data Restricted</h3>
                  <p className="text-xs mt-1">Financial performance figures are reserved for Studio Administrator and Staff.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3.5 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
                      <span className="text-[10px] font-bold uppercase text-[#846F7F] block">Total Contracted Sales</span>
                      <span className="font-serif font-bold text-lg text-[#3D084B] block mt-1 tabular-nums">{formatNPR(financialSummary.totalBookingSales)}</span>
                      <span className="text-[10px] text-[#846F7F]">{financialSummary.validBookingsCount} active bookings</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">Payments Received</span>
                      <span className="font-serif font-bold text-lg text-emerald-900 block mt-1 tabular-nums">{formatNPR(financialSummary.totalPaymentsReceived)}</span>
                      <span className="text-[10px] text-emerald-700">{financialSummary.collectionRate}% cash collection</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#FBF2F6] border border-[#EBD8E1]">
                      <span className="text-[10px] font-bold uppercase text-[#846F7F] block">Total Expenses Paid</span>
                      <span className="font-serif font-bold text-lg text-[#332A34] block mt-1 tabular-nums">{formatNPR(financialSummary.totalExpensesPaid)}</span>
                      <span className="text-[10px] text-[#846F7F]">{financialSummary.expensesCount} overhead items</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF2F7] to-[#F5E5EB] border border-[#D6A3C7]">
                      <span className="text-[10px] font-bold uppercase text-[#3D084B] block">Net Cash Profit</span>
                      <span className="font-serif font-bold text-lg text-[#3D084B] block mt-1 tabular-nums">{formatNPR(financialSummary.cashProfit)}</span>
                      <span className="text-[10px] text-[#68456E]">Received − Expenses</span>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border border-[#EBD8E1] rounded-2xl overflow-hidden">
                    <thead className="bg-[#FAF2F7] font-bold uppercase text-[10px] text-[#3D084B] border-b border-[#EBD8E1]">
                      <tr>
                        <th className="py-2.5 px-3">Financial Metric Description</th>
                        <th className="py-2.5 px-3">Accounting Formula / Basis</th>
                        <th className="py-2.5 px-3 text-right">Amount (NPR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBD8E1]">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold">Total Contracted Booking Sales</td>
                        <td className="py-2.5 px-3 text-[#846F7F]">Sum of total agreed price on non-cancelled sessions</td>
                        <td className="py-2.5 px-3 text-right font-serif font-bold text-[#3D084B]">{formatNPR(financialSummary.totalBookingSales)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-emerald-900">Total Payments Received (Cash Collections)</td>
                        <td className="py-2.5 px-3 text-[#846F7F]">Sum of all valid non-reversed payment receipts in ledger</td>
                        <td className="py-2.5 px-3 text-right font-serif font-bold text-emerald-900">{formatNPR(financialSummary.totalPaymentsReceived)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-amber-900">Total Outstanding Balance (Receivables)</td>
                        <td className="py-2.5 px-3 text-[#846F7F]">Sum of remaining dues on active bookings</td>
                        <td className="py-2.5 px-3 text-right font-serif font-bold text-amber-900">{formatNPR(financialSummary.outstandingAmount)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-[#A4537F]">Total Studio Operating Expenses</td>
                        <td className="py-2.5 px-3 text-[#846F7F]">Sum of non-reversed overhead expenses across 12 categories</td>
                        <td className="py-2.5 px-3 text-right font-serif font-bold text-[#A4537F]">{formatNPR(financialSummary.totalExpensesPaid)}</td>
                      </tr>
                      <tr className="bg-[#FAF2F7]/80 font-bold">
                        <td className="py-3 px-3 text-[#3D084B]">Net Cash Operating Profit</td>
                        <td className="py-3 px-3 text-[#68456E]">Payments Received − Expenses Paid (Cash Basis)</td>
                        <td className="py-3 px-3 text-right font-serif text-sm text-[#3D084B]">{formatNPR(financialSummary.cashProfit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* 2. PAYMENT COLLECTION REPORT */}
            {selectedType === "payment_collection" && (
              isPhotographer ? (
                <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-800">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-rose-600" />
                  <h3 className="font-bold text-sm">Payment Collection Restricted</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  <table className="w-full text-left text-xs border border-[#EBD8E1] rounded-2xl overflow-hidden">
                    <thead className="bg-[#FAF2F7] font-bold uppercase text-[10px] text-[#3D084B] border-b border-[#EBD8E1]">
                      <tr>
                        <th className="py-2.5 px-3">Receipt #</th>
                        <th className="py-2.5 px-3">Client Name</th>
                        <th className="py-2.5 px-3">Booking Ref</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Channel</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Amount (NPR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBD8E1]">
                      {rawPayments.filter(p => !p.isReversed).map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-mono font-bold text-[#3D084B]">{p.receiptNumber}</td>
                          <td className="py-2 px-3 font-semibold">{p.clientName}</td>
                          <td className="py-2 px-3 font-mono text-[#846F7F]">{p.bookingNumber || "DIRECT"}</td>
                          <td className="py-2 px-3 text-[#846F7F]">{formatDate(p.paymentDate)}</td>
                          <td className="py-2 px-3 capitalize text-[#68456E]">{p.paymentMethod.replace("_", " ")}</td>
                          <td className="py-2 px-3 uppercase text-[10px]">{p.paymentType}</td>
                          <td className="py-2 px-3 text-right font-serif font-bold text-[#3D084B]">{formatNPR(p.amount)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#FAF2F7] font-bold">
                        <td colSpan={6} className="py-3 px-3 text-right text-[#3D084B]">Total Cash Collected in Period:</td>
                        <td className="py-3 px-3 text-right font-serif text-sm text-[#3D084B]">{formatNPR(financialSummary.totalPaymentsReceived)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* 3. EXPENSE REPORT */}
            {selectedType === "expense_ledger" && (
              isPhotographer ? (
                <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-800">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-rose-600" />
                  <h3 className="font-bold text-sm">Expense Records Restricted</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  <table className="w-full text-left text-xs border border-[#EBD8E1] rounded-2xl overflow-hidden">
                    <thead className="bg-[#FAF2F7] font-bold uppercase text-[10px] text-[#3D084B] border-b border-[#EBD8E1]">
                      <tr>
                        <th className="py-2.5 px-3">Expense Item</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Vendor / Paid To</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Channel</th>
                        <th className="py-2.5 px-3 text-right">Amount (NPR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBD8E1]">
                      {rawExpenses.filter(e => !e.isReversed).map((e) => (
                        <tr key={e.id}>
                          <td className="py-2 px-3 font-semibold">{e.title}</td>
                          <td className="py-2 px-3 capitalize text-[#68456E]">{e.category.replace(/_/g, " ")}</td>
                          <td className="py-2 px-3 text-[#846F7F]">{e.paidTo || e.vendor || "—"}</td>
                          <td className="py-2 px-3 text-[#846F7F]">{formatDate(e.expenseDate)}</td>
                          <td className="py-2 px-3 capitalize">{e.paymentMethod.replace("_", " ")}</td>
                          <td className="py-2 px-3 text-right font-serif font-bold text-[#A4537F]">{formatNPR(e.amount)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#FAF2F7] font-bold">
                        <td colSpan={5} className="py-3 px-3 text-right text-[#3D084B]">Total Studio Overhead in Period:</td>
                        <td className="py-3 px-3 text-right font-serif text-sm text-[#A4537F]">{formatNPR(financialSummary.totalExpensesPaid)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* 4. OUTSTANDING BALANCES REPORT */}
            {selectedType === "outstanding_balances" && (
              isPhotographer ? (
                <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-800">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-rose-600" />
                  <h3 className="font-bold text-sm">Receivables Data Restricted</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  <table className="w-full text-left text-xs border border-[#EBD8E1] rounded-2xl overflow-hidden">
                    <thead className="bg-[#FAF2F7] font-bold uppercase text-[10px] text-[#3D084B] border-b border-[#EBD8E1]">
                      <tr>
                        <th className="py-2.5 px-3">Booking #</th>
                        <th className="py-2.5 px-3">Client Name</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Package</th>
                        <th className="py-2.5 px-3">Appointment</th>
                        <th className="py-2.5 px-3 text-right">Contracted</th>
                        <th className="py-2.5 px-3 text-right">Advance Paid</th>
                        <th className="py-2.5 px-3 text-right">Remaining Due (NPR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBD8E1]">
                      {rawBookings
                        .filter(b => b.status !== "cancelled" && (Number(b.remainingBalance) || 0) > 0)
                        .map((b) => (
                          <tr key={b.id}>
                            <td className="py-2 px-3 font-mono font-bold text-[#3D084B]">{b.bookingNumber}</td>
                            <td className="py-2 px-3 font-semibold">{b.clientName}</td>
                            <td className="py-2 px-3 text-[#846F7F]">{b.clientPhone}</td>
                            <td className="py-2 px-3">{b.packageName}</td>
                            <td className="py-2 px-3 text-[#846F7F]">{formatDate(b.appointmentDate)}</td>
                            <td className="py-2 px-3 text-right font-serif">{formatNPR(b.totalAmount)}</td>
                            <td className="py-2 px-3 text-right font-serif text-emerald-800">{formatNPR(b.advancePaid)}</td>
                            <td className="py-2 px-3 text-right font-serif font-bold text-amber-900">{formatNPR(b.remainingBalance)}</td>
                          </tr>
                        ))}
                      <tr className="bg-[#FAF2F7] font-bold">
                        <td colSpan={7} className="py-3 px-3 text-right text-[#3D084B]">Total Outstanding Unsettled Receivables:</td>
                        <td className="py-3 px-3 text-right font-serif text-sm text-amber-900">{formatNPR(financialSummary.outstandingAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* 5. BOOKING PERFORMANCE REPORT */}
            {selectedType === "booking_performance" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
                    <span className="text-[10px] font-bold uppercase text-[#846F7F] block">Total Bookings</span>
                    <span className="font-serif font-bold text-lg text-[#3D084B] block mt-1">{bookingPerformance.totalBookings}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">Completed Sessions</span>
                    <span className="font-serif font-bold text-lg text-emerald-900 block mt-1">{bookingPerformance.completedBookings} ({bookingPerformance.completionRate}%)</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-bold uppercase text-amber-800 block">Upcoming / Scheduled</span>
                    <span className="font-serif font-bold text-lg text-amber-900 block mt-1">{bookingPerformance.upcomingBookings}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold uppercase text-rose-800 block">Cancelled Sessions</span>
                    <span className="font-serif font-bold text-lg text-rose-900 block mt-1">{bookingPerformance.cancelledBookings} ({bookingPerformance.cancellationRate}%)</span>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-[#EBD8E1] rounded-2xl overflow-hidden">
                  <thead className="bg-[#FAF2F7] font-bold uppercase text-[10px] text-[#3D084B] border-b border-[#EBD8E1]">
                    <tr>
                      <th className="py-2.5 px-3">Photography Category</th>
                      <th className="py-2.5 px-3 text-center">Session Count</th>
                      <th className="py-2.5 px-3 text-center">Share of Volume</th>
                      {!isPhotographer && <th className="py-2.5 px-3 text-right">Contracted Value</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBD8E1]">
                    {bookingPerformance.categoryBreakdown.map((cat, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-semibold text-[#332A34]">{cat.category}</td>
                        <td className="py-2 px-3 text-center font-bold">{cat.count}</td>
                        <td className="py-2 px-3 text-center">{cat.share}%</td>
                        {!isPhotographer && <td className="py-2 px-3 text-right font-serif font-bold text-[#3D084B]">{formatNPR(cat.revenue)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. PACKAGE ANALYTICS */}
            {selectedType === "package_analytics" && (
              <div className="space-y-4">
                <table className="w-full text-left text-xs border border-[#EBD8E1] rounded-2xl overflow-hidden">
                  <thead className="bg-[#FAF2F7] font-bold uppercase text-[10px] text-[#3D084B] border-b border-[#EBD8E1]">
                    <tr>
                      <th className="py-2.5 px-3">Package Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Bookings</th>
                      <th className="py-2.5 px-3 text-center">Share</th>
                      {!isPhotographer && (
                        <>
                          <th className="py-2.5 px-3 text-right">Contracted Value</th>
                          <th className="py-2.5 px-3 text-right">Collected</th>
                          <th className="py-2.5 px-3 text-right">Outstanding</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBD8E1]">
                    {packageAnalytics.map((pkg, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-semibold">{pkg.packageName}</td>
                        <td className="py-2 px-3 text-[#846F7F]">{pkg.category}</td>
                        <td className="py-2 px-3 text-center font-bold text-[#3D084B]">{pkg.bookingsCount}</td>
                        <td className="py-2 px-3 text-center">{pkg.shareOfBookings}%</td>
                        {!isPhotographer && (
                          <>
                            <td className="py-2 px-3 text-right font-serif font-bold text-[#3D084B]">{formatNPR(pkg.totalContractedValue)}</td>
                            <td className="py-2 px-3 text-right font-serif text-emerald-800">{formatNPR(pkg.paymentsCollected)}</td>
                            <td className="py-2 px-3 text-right font-serif text-amber-900">{formatNPR(pkg.outstandingBalance)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 7. CLIENT ACTIVITY REPORT */}
            {selectedType === "client_activity" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
                    <span className="text-[10px] font-bold uppercase text-[#846F7F] block">Registered Clients</span>
                    <span className="font-serif font-bold text-lg text-[#3D084B] block mt-1">{clientAnalytics.totalRegisteredClients}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">New Clients (Period)</span>
                    <span className="font-serif font-bold text-lg text-emerald-900 block mt-1">{clientAnalytics.newClientsInPeriod}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FBF2F6] border border-[#EBD8E1]">
                    <span className="text-[10px] font-bold uppercase text-[#846F7F] block">Repeat Clients</span>
                    <span className="font-serif font-bold text-lg text-[#68456E] block mt-1">{clientAnalytics.repeatClientsCount} ({clientAnalytics.repeatClientRate}%)</span>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-[#EBD8E1] rounded-2xl overflow-hidden">
                  <thead className="bg-[#FAF2F7] font-bold uppercase text-[10px] text-[#3D084B] border-b border-[#EBD8E1]">
                    <tr>
                      <th className="py-2.5 px-3">Client Name</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3 text-center">Sessions</th>
                      {!isPhotographer && (
                        <>
                          <th className="py-2.5 px-3 text-right">Total Contracted</th>
                          <th className="py-2.5 px-3 text-right">Cash Collected</th>
                          <th className="py-2.5 px-3 text-right">Remaining Due</th>
                        </>
                      )}
                      <th className="py-2.5 px-3 text-right">Last Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBD8E1]">
                    {clientAnalytics.topClients.slice(0, 20).map((c) => (
                      <tr key={c.clientId}>
                        <td className="py-2 px-3 font-semibold">{c.clientName}</td>
                        <td className="py-2 px-3 text-[#846F7F]">{c.clientPhone}</td>
                        <td className="py-2 px-3 text-center font-bold text-[#3D084B]">{c.bookingsCount}</td>
                        {!isPhotographer && (
                          <>
                            <td className="py-2 px-3 text-right font-serif font-bold text-[#3D084B]">{formatNPR(c.totalBookingValue)}</td>
                            <td className="py-2 px-3 text-right font-serif text-emerald-800">{formatNPR(c.totalCollected)}</td>
                            <td className="py-2 px-3 text-right font-serif text-amber-900">{formatNPR(c.outstandingBalance)}</td>
                          </>
                        )}
                        <td className="py-2 px-3 text-right text-[#846F7F]">{formatDate(c.lastBookingDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 8. STAFF PERFORMANCE & ACTIVITY */}
            {selectedType === "staff_activity" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
                    <span className="text-[10px] font-bold uppercase text-[#846F7F] block">Active Team Members</span>
                    <span className="font-serif font-bold text-lg text-[#3D084B] block mt-1">{staffPerformance.staffMembers.length}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-bold uppercase text-amber-800 block">Unassigned Sessions</span>
                    <span className="font-serif font-bold text-lg text-amber-900 block mt-1">{staffPerformance.unassignedBookingsCount}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">Logged Audit Activities</span>
                    <span className="font-serif font-bold text-lg text-emerald-900 block mt-1">{staffPerformance.totalLoggedActivities}</span>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-[#EBD8E1] rounded-2xl overflow-hidden">
                  <thead className="bg-[#FAF2F7] font-bold uppercase text-[10px] text-[#3D084B] border-b border-[#EBD8E1]">
                    <tr>
                      <th className="py-2.5 px-3">Staff Member</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3 text-center">Sessions Managed</th>
                      <th className="py-2.5 px-3 text-center">Completed</th>
                      {!isPhotographer && <th className="py-2.5 px-3 text-center">Payments Recorded</th>}
                      <th className="py-2.5 px-3 text-center">Logged Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBD8E1]">
                    {staffPerformance.staffMembers.map((s) => (
                      <tr key={s.uid}>
                        <td className="py-2 px-3 font-semibold">
                          <span>{s.displayName}</span>
                          <span className="block text-[10px] text-[#846F7F]">{s.email}</span>
                        </td>
                        <td className="py-2 px-3 capitalize font-bold text-[#68456E]">{s.role}</td>
                        <td className="py-2 px-3 text-center font-bold text-[#3D084B]">{s.bookingsManagedCount}</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-800">{s.sessionsCompletedCount}</td>
                        {!isPhotographer && <td className="py-2 px-3 text-center">{s.paymentsRecordedCount}</td>}
                        <td className="py-2 px-3 text-center font-mono text-[#846F7F]">{s.recentActivityCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer & Authorization Line */}
          <div className="pt-6 border-t border-[#EBD8E1] flex flex-col sm:flex-row justify-between items-end gap-6 text-[11px] text-[#846F7F]">
            <div className="max-w-md space-y-1">
              <p className="font-semibold text-[#3D084B]">Newborn Photography Nepal — Official Studio Records</p>
              <p>Generated by internal Studio Management Portal. Confidential studio data protected under security policies.</p>
            </div>
            <div className="text-center shrink-0 w-48">
              <div className="border-b border-[#3D084B]/40 pb-1 mb-1 font-serif italic text-sm text-[#3D084B]">
                {currentUser?.displayName || "Navin / Studio Admin"}
              </div>
              <span className="text-[10px] uppercase font-bold text-[#846F7F] tracking-wider block">
                Authorized Executive Signature
              </span>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-2 print:hidden">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDownloadCSV}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Data</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handlePrint}
              className="gap-2 shadow-studio"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official PDF</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

