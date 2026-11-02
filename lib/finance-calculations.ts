/**
 * Canonical Financial & Business Reporting Calculation Layer
 * Newborn Photography Nepal — Studio Manager (By Navin)
 * 
 * Centralized, pure, deterministic calculation engine used across:
 * - /reports (Executive Analytics & Reports)
 * - /finance (Finance Workspace)
 * - / (Dashboard Overview)
 * - Booking detail views & modals
 */

import type {
  Booking,
  Payment,
  StudioExpense,
  ExpenseCategory,
  PaymentMethod,
  PhotographyPackage,
  Client,
  StudioUser,
  ActivityLog,
} from "./types";

export type PaymentStatus = "unpaid" | "partially_paid" | "paid";

export type DatePreset = "today" | "month" | "quarter" | "year" | "all" | "custom";

export type ReportPeriod =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "last_month"
  | "quarter"
  | "year"
  | "all"
  | "custom";

export interface DateRangeFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

/**
 * Calculate precise date range boundaries in Asia/Kathmandu timezone.
 */
export function getReportDateRange(period: ReportPeriod, todayStr: string): DateRangeFilter {
  if (period === "all") return {};
  if (period === "today") return { startDate: todayStr, endDate: todayStr };

  const parts = todayStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (period === "yesterday") {
    const d = new Date(year, month - 1, day - 1);
    const yStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { startDate: yStr, endDate: yStr };
  }

  if (period === "week") {
    const current = new Date(year, month - 1, day);
    const dayOfWeek = current.getDay(); // 0 is Sunday
    const startOfWeek = new Date(year, month - 1, day - dayOfWeek);
    const endOfWeek = new Date(year, month - 1, day + (6 - dayOfWeek));
    const sStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, "0")}-${String(startOfWeek.getDate()).padStart(2, "0")}`;
    const eStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, "0")}-${String(endOfWeek.getDate()).padStart(2, "0")}`;
    return { startDate: sStr, endDate: eStr };
  }

  if (period === "month") {
    const lastDay = new Date(year, month, 0).getDate();
    const mm = String(month).padStart(2, "0");
    return {
      startDate: `${year}-${mm}-01`,
      endDate: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  if (period === "last_month") {
    const prevMonthDate = new Date(year, month - 2, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const pmm = String(prevMonth).padStart(2, "0");
    return {
      startDate: `${prevYear}-${pmm}-01`,
      endDate: `${prevYear}-${pmm}-${String(prevLastDay).padStart(2, "0")}`,
    };
  }

  if (period === "quarter") {
    const q = Math.floor((month - 1) / 3);
    const qStartMonth = q * 3 + 1;
    const qEndMonth = qStartMonth + 2;
    const lastDay = new Date(year, qEndMonth, 0).getDate();
    return {
      startDate: `${year}-${String(qStartMonth).padStart(2, "0")}-01`,
      endDate: `${year}-${String(qEndMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  if (period === "year") {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    };
  }

  return {};
}

// Backward-compatible alias for finance workspace
export function getDatePresetRange(preset: DatePreset, todayStr: string): DateRangeFilter {
  return getReportDateRange(preset as ReportPeriod, todayStr);
}

/**
 * Format readable period label with date boundaries.
 */
export function getPeriodDisplayLabel(period: ReportPeriod, range?: DateRangeFilter): string {
  if (period === "all" || !range || (!range.startDate && !range.endDate)) {
    return "All Time (Complete Studio Records)";
  }
  if (period === "today") return `Today (${range.startDate})`;
  if (period === "yesterday") return `Yesterday (${range.startDate})`;
  if (range.startDate && range.endDate) {
    if (range.startDate === range.endDate) return `${range.startDate}`;
    return `${range.startDate} to ${range.endDate}`;
  }
  return range.startDate ? `From ${range.startDate}` : `Until ${range.endDate}`;
}

export interface FinancialKPIs {
  totalBookingSales: number;       // Contracted value of confirmed bookings (NPR)
  totalPaymentsReceived: number;   // Actual cash collected by studio (NPR)
  totalExpensesPaid: number;       // Actual overhead spent by studio (NPR)
  outstandingAmount: number;       // Unpaid balances on bookings (NPR)
  cashProfit: number;              // Cash collected minus expenses (NPR)
  collectionRate: number;          // Percentage (0-100%)
  validBookingsCount: number;
  paymentsCount: number;
  expensesCount: number;
  avgBookingValue: number;
}

export interface PaymentMethodBreakdown {
  cash: number;
  bank_transfer: number;
  esewa: number;
  khalti: number;
  other: number;
}

export interface FinancialSummaryReport extends FinancialKPIs {
  paymentMethodBreakdown: PaymentMethodBreakdown;
  expenseCategoryBreakdown: Record<string, number>;
  periodLabel: string;
}

/**
 * 1. Calculate remaining balance for a booking.
 * Remaining = Total Amount - Payments Received.
 */
export function calculateRemainingBalance(totalAmount: number, paymentsReceived: number): number {
  const safeTotal = Math.max(0, Number(totalAmount) || 0);
  const safePaid = Math.max(0, Number(paymentsReceived) || 0);
  const remaining = safeTotal - safePaid;
  return Math.max(0, Math.round(remaining * 100) / 100);
}

/**
 * 2. Calculate cash profit.
 * Cash Profit = Payments Received - Expenses Paid.
 * IMPORTANT: Strictly cash-based. Never calculated from contracted sales!
 */
export function calculateCashProfit(paymentsReceived: number, expensesPaid: number): number {
  const safeReceived = Number(paymentsReceived) || 0;
  const safeExpenses = Number(expensesPaid) || 0;
  return Math.round((safeReceived - safeExpenses) * 100) / 100;
}

/**
 * 3. Calculate outstanding balance between booking sales and payments received.
 */
export function calculateOutstandingBalance(bookingSales: number, paymentsReceived: number): number {
  const safeSales = Math.max(0, Number(bookingSales) || 0);
  const safeReceived = Math.max(0, Number(paymentsReceived) || 0);
  return Math.max(0, Math.round((safeSales - safeReceived) * 100) / 100);
}

/**
 * 4. Determine payment status based on booking total and received payments.
 */
export function calculatePaymentStatus(totalAmount: number, paymentsReceived: number): PaymentStatus {
  const safeTotal = Math.max(0, Number(totalAmount) || 0);
  const safePaid = Math.max(0, Number(paymentsReceived) || 0);

  if (safePaid <= 0) return "unpaid";
  if (safePaid >= safeTotal && safeTotal > 0) return "paid";
  return "partially_paid";
}

/**
 * 5. Validate whether a proposed payment would cause an overpayment.
 */
export function validatePaymentAmount(
  totalAmount: number,
  alreadyPaid: number,
  newPaymentAmount: number
): { valid: boolean; error?: string; remaining: number } {
  const remaining = calculateRemainingBalance(totalAmount, alreadyPaid);
  const newAmount = Number(newPaymentAmount) || 0;

  if (newAmount <= 0) {
    return { valid: false, error: "Payment amount must be greater than NPR 0.", remaining };
  }

  if (newAmount > remaining) {
    return {
      valid: false,
      error: `Payment amount of NPR ${newAmount.toLocaleString("en-IN")} exceeds the remaining balance of NPR ${remaining.toLocaleString("en-IN")}.`,
      remaining,
    };
  }

  return { valid: true, remaining };
}

/**
 * 6. Check if a date string (YYYY-MM-DD) falls within an inclusive date range.
 */
export function isDateInRange(dateStr?: string, range?: DateRangeFilter): boolean {
  if (!dateStr) return false;
  if (!range || (!range.startDate && !range.endDate)) return true;

  const target = dateStr.slice(0, 10);
  if (range.startDate && target < range.startDate) return false;
  if (range.endDate && target > range.endDate) return false;
  return true;
}

/**
 * 7. Canonical financial summary aggregator.
 * Excludes cancelled bookings and reversed transactions.
 */
export function calculateFinancialSummary(
  bookings: Booking[],
  payments: Payment[],
  expenses: StudioExpense[],
  range?: DateRangeFilter,
  periodLabel = "Selected Period"
): FinancialSummaryReport {
  // 1. Filter active bookings within range (excluding cancelled)
  const validBookings = bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    const date = b.appointmentDate || (b.createdAt ? b.createdAt.slice(0, 10) : "");
    return isDateInRange(date, range);
  });

  // 2. Filter valid payments within range (excluding reversed)
  const validPayments = payments.filter((p) => {
    if ((p as any).isReversed) return false;
    const date = p.paymentDate || (p.createdAt ? p.createdAt.slice(0, 10) : "");
    return isDateInRange(date, range);
  });

  // 3. Filter valid expenses within range (excluding reversed)
  const validExpenses = expenses.filter((e) => {
    if ((e as any).isReversed) return false;
    const date = e.expenseDate || (e.createdAt ? e.createdAt.slice(0, 10) : "");
    return isDateInRange(date, range);
  });

  // Sums
  const totalBookingSales = validBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const totalPaymentsReceived = validPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalExpensesPaid = validExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Remaining balance across active bookings
  const outstandingAmount = validBookings.reduce(
    (sum, b) => sum + calculateRemainingBalance(b.totalAmount, b.advancePaid),
    0
  );

  const cashProfit = calculateCashProfit(totalPaymentsReceived, totalExpensesPaid);

  const collectionRate =
    totalBookingSales > 0
      ? Math.min(100, Math.round((totalPaymentsReceived / totalBookingSales) * 100))
      : 0;

  const avgBookingValue = validBookings.length > 0 ? Math.round(totalBookingSales / validBookings.length) : 0;

  // Method breakdown
  const paymentMethodBreakdown: PaymentMethodBreakdown = {
    cash: 0,
    bank_transfer: 0,
    esewa: 0,
    khalti: 0,
    other: 0,
  };

  validPayments.forEach((p) => {
    const method = (p.paymentMethod || "other").toLowerCase() as keyof PaymentMethodBreakdown;
    if (paymentMethodBreakdown[method] !== undefined) {
      paymentMethodBreakdown[method] += Number(p.amount) || 0;
    } else {
      paymentMethodBreakdown.other += Number(p.amount) || 0;
    }
  });

  // Category breakdown
  const expenseCategoryBreakdown: Record<string, number> = {};
  validExpenses.forEach((e) => {
    const cat = e.category || "other";
    expenseCategoryBreakdown[cat] = (expenseCategoryBreakdown[cat] || 0) + (Number(e.amount) || 0);
  });

  return {
    totalBookingSales: Math.round(totalBookingSales),
    totalPaymentsReceived: Math.round(totalPaymentsReceived),
    totalExpensesPaid: Math.round(totalExpensesPaid),
    outstandingAmount: Math.round(outstandingAmount),
    cashProfit: Math.round(cashProfit),
    collectionRate,
    validBookingsCount: validBookings.length,
    paymentsCount: validPayments.length,
    expensesCount: validExpenses.length,
    avgBookingValue,
    paymentMethodBreakdown,
    expenseCategoryBreakdown,
    periodLabel,
  };
}

// ==================================================================
// BOOKING PERFORMANCE REPORT
// ==================================================================

export interface BookingPerformanceReport {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  rescheduledBookings: number;
  upcomingBookings: number;
  completionRate: number;      // (completed / total) * 100
  cancellationRate: number;    // (cancelled / total) * 100
  categoryBreakdown: { category: string; count: number; share: number; revenue: number }[];
  locationBreakdown: { location: string; count: number }[];
}

export function calculateBookingPerformance(
  bookings: Booking[],
  range?: DateRangeFilter,
  todayStr?: string
): BookingPerformanceReport {
  const currentToday = todayStr || new Date().toISOString().slice(0, 10);

  const filteredBookings = bookings.filter((b) => {
    const date = b.appointmentDate || (b.createdAt ? b.createdAt.slice(0, 10) : "");
    return isDateInRange(date, range);
  });

  const total = filteredBookings.length;
  let confirmed = 0;
  let completed = 0;
  let cancelled = 0;
  let rescheduled = 0;
  let upcoming = 0;

  const catMap: Record<string, { count: number; revenue: number }> = {};
  const locMap: Record<string, number> = {};

  filteredBookings.forEach((b) => {
    const status = (b.status || "pending").toLowerCase();
    if (status === "confirmed") confirmed++;
    else if (status === "completed") completed++;
    else if (status === "cancelled") cancelled++;
    else if (status === "rescheduled") rescheduled++;

    if (b.appointmentDate >= currentToday && (status === "confirmed" || status === "pending")) {
      upcoming++;
    }

    if (status !== "cancelled") {
      const cat = b.category || "Newborn Photography";
      if (!catMap[cat]) catMap[cat] = { count: 0, revenue: 0 };
      catMap[cat].count++;
      catMap[cat].revenue += Number(b.totalAmount) || 0;

      const loc = b.location || "studio";
      locMap[loc] = (locMap[loc] || 0) + 1;
    }
  });

  const validCount = total - cancelled;
  const completionRate = validCount > 0 ? Math.round((completed / validCount) * 100) : 0;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  const categoryBreakdown = Object.entries(catMap).map(([category, val]) => ({
    category,
    count: val.count,
    revenue: val.revenue,
    share: validCount > 0 ? Math.round((val.count / validCount) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const locationBreakdown = Object.entries(locMap).map(([location, count]) => ({
    location,
    count,
  })).sort((a, b) => b.count - a.count);

  return {
    totalBookings: total,
    confirmedBookings: confirmed,
    completedBookings: completed,
    cancelledBookings: cancelled,
    rescheduledBookings: rescheduled,
    upcomingBookings: upcoming,
    completionRate,
    cancellationRate,
    categoryBreakdown,
    locationBreakdown,
  };
}

// ==================================================================
// PACKAGE PERFORMANCE ANALYTICS
// ==================================================================

export type PackageSortOption = "most_booked" | "highest_value" | "highest_collection" | "highest_balance";

export interface PackageAnalyticsItem {
  packageId?: string;
  packageName: string;
  category: string;
  bookingsCount: number;
  totalContractedValue: number;
  paymentsCollected: number;
  outstandingBalance: number;
  avgBookingValue: number;
  shareOfBookings: number;
  shareOfRevenue: number;
  active: boolean;
}

export function calculatePackageAnalytics(
  packages: PhotographyPackage[],
  bookings: Booking[],
  payments: Payment[],
  range?: DateRangeFilter,
  sortBy: PackageSortOption = "most_booked"
): PackageAnalyticsItem[] {
  // Filter active bookings within range (excluding cancelled)
  const validBookings = bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    const date = b.appointmentDate || (b.createdAt ? b.createdAt.slice(0, 10) : "");
    return isDateInRange(date, range);
  });

  // Filter valid payments (excluding reversed)
  const validPayments = payments.filter((p) => !(p as any).isReversed);
  const paymentsByBooking: Record<string, number> = {};
  validPayments.forEach((p) => {
    if (p.bookingId) {
      paymentsByBooking[p.bookingId] = (paymentsByBooking[p.bookingId] || 0) + (Number(p.amount) || 0);
    }
  });

  const totalContractedSum = validBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const totalBookingsCount = validBookings.length;

  // Aggregate by packageName / packageId
  const statsMap: Record<string, {
    packageId?: string;
    packageName: string;
    category: string;
    bookingsCount: number;
    totalContractedValue: number;
    paymentsCollected: number;
    active: boolean;
  }> = {};

  // First, initialize existing catalog packages
  packages.forEach((pkg) => {
    statsMap[pkg.name] = {
      packageId: pkg.id,
      packageName: pkg.name,
      category: pkg.category,
      bookingsCount: 0,
      totalContractedValue: 0,
      paymentsCollected: 0,
      active: pkg.active !== false,
    };
  });

  // Map bookings to packages
  validBookings.forEach((b) => {
    const pkgName = b.packageName || "Custom Photography Package";
    if (!statsMap[pkgName]) {
      statsMap[pkgName] = {
        packageId: b.packageId,
        packageName: pkgName,
        category: b.category || "Newborn Photography",
        bookingsCount: 0,
        totalContractedValue: 0,
        paymentsCollected: 0,
        active: false, // historical/custom package
      };
    }

    statsMap[pkgName].bookingsCount += 1;
    statsMap[pkgName].totalContractedValue += Number(b.totalAmount) || 0;
    statsMap[pkgName].paymentsCollected += paymentsByBooking[b.id] || Number(b.advancePaid) || 0;
  });

  const result: PackageAnalyticsItem[] = Object.values(statsMap)
    .filter((item) => item.bookingsCount > 0 || item.active)
    .map((item) => {
      const outstandingBalance = Math.max(0, item.totalContractedValue - item.paymentsCollected);
      const avgBookingValue = item.bookingsCount > 0 ? Math.round(item.totalContractedValue / item.bookingsCount) : 0;
      const shareOfBookings = totalBookingsCount > 0 ? Math.round((item.bookingsCount / totalBookingsCount) * 100) : 0;
      const shareOfRevenue = totalContractedSum > 0 ? Math.round((item.totalContractedValue / totalContractedSum) * 100) : 0;

      return {
        ...item,
        outstandingBalance,
        avgBookingValue,
        shareOfBookings,
        shareOfRevenue,
      };
    });

  // Sort
  result.sort((a, b) => {
    if (sortBy === "highest_value") return b.totalContractedValue - a.totalContractedValue;
    if (sortBy === "highest_collection") return b.paymentsCollected - a.paymentsCollected;
    if (sortBy === "highest_balance") return b.outstandingBalance - a.outstandingBalance;
    return b.bookingsCount - a.bookingsCount;
  });

  return result;
}

// ==================================================================
// CLIENT INSIGHTS & ANALYTICS
// ==================================================================

export interface ClientAnalyticsItem {
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  bookingsCount: number;
  totalBookingValue: number;
  totalCollected: number;
  outstandingBalance: number;
  lastBookingDate?: string;
}

export interface ClientAnalyticsReport {
  totalRegisteredClients: number;
  newClientsInPeriod: number;
  repeatClientsCount: number;
  repeatClientRate: number;
  topClients: ClientAnalyticsItem[];
}

export function calculateClientAnalytics(
  clients: Client[],
  bookings: Booking[],
  payments: Payment[],
  range?: DateRangeFilter
): ClientAnalyticsReport {
  const totalRegistered = clients.length;

  // New clients in period
  const newClients = clients.filter((c) => {
    const date = c.createdAt ? c.createdAt.slice(0, 10) : "";
    return isDateInRange(date, range);
  });

  // Payments by client
  const validPayments = payments.filter((p) => !(p as any).isReversed);
  const paymentsByClient: Record<string, number> = {};
  validPayments.forEach((p) => {
    if (p.clientId) {
      paymentsByClient[p.clientId] = (paymentsByClient[p.clientId] || 0) + (Number(p.amount) || 0);
    }
  });

  // Group bookings by client
  const bookingsByClient: Record<string, Booking[]> = {};
  bookings.forEach((b) => {
    if (b.status === "cancelled") return;
    const cid = b.clientId || "unknown";
    if (!bookingsByClient[cid]) bookingsByClient[cid] = [];
    bookingsByClient[cid].push(b);
  });

  // Calculate repeat clients
  let repeatCount = 0;
  Object.values(bookingsByClient).forEach((bList) => {
    if (bList.length >= 2) repeatCount++;
  });
  const repeatClientRate = totalRegistered > 0 ? Math.round((repeatCount / totalRegistered) * 100) : 0;

  // Generate ranking list
  const clientItems: ClientAnalyticsItem[] = clients.map((c) => {
    const clientBookings = (bookingsByClient[c.id] || []).filter((b) => {
      const date = b.appointmentDate || (b.createdAt ? b.createdAt.slice(0, 10) : "");
      return isDateInRange(date, range);
    });

    const bookingsCount = clientBookings.length;
    const totalBookingValue = clientBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const totalCollected = paymentsByClient[c.id] || clientBookings.reduce((sum, b) => sum + (Number(b.advancePaid) || 0), 0);
    const outstandingBalance = Math.max(0, totalBookingValue - totalCollected);

    // Latest appointment date
    const sortedDates = clientBookings.map((b) => b.appointmentDate).filter(Boolean).sort().reverse();
    const lastBookingDate = sortedDates[0] || (c.createdAt ? c.createdAt.slice(0, 10) : undefined);

    return {
      clientId: c.id,
      clientName: c.fullName,
      clientPhone: c.phone,
      clientEmail: c.email,
      bookingsCount,
      totalBookingValue,
      totalCollected,
      outstandingBalance,
      lastBookingDate,
    };
  });

  // Filter to clients active in this period or with history, sorted by booking value
  const topClients = clientItems
    .filter((c) => c.bookingsCount > 0 || c.totalBookingValue > 0 || c.totalCollected > 0)
    .sort((a, b) => b.totalBookingValue - a.totalBookingValue);

  return {
    totalRegisteredClients: totalRegistered,
    newClientsInPeriod: newClients.length,
    repeatClientsCount: repeatCount,
    repeatClientRate,
    topClients,
  };
}

// ==================================================================
// STAFF PERFORMANCE & ACTIVITY REPORTS
// ==================================================================

export interface StaffPerformanceItem {
  uid: string;
  displayName: string;
  email: string;
  role: "admin" | "staff" | "photographer";
  active: boolean;
  bookingsManagedCount: number;
  sessionsCompletedCount: number;
  paymentsRecordedCount: number;
  expensesRecordedCount: number;
  totalPaymentsCollectedNPR?: number; // Restricted: Only shown to staff/admin!
  recentActivityCount: number;
}

export interface StaffPerformanceReport {
  staffMembers: StaffPerformanceItem[];
  unassignedBookingsCount: number;
  totalLoggedActivities: number;
}

export function calculateStaffPerformance(
  users: StudioUser[],
  bookings: Booking[],
  payments: Payment[],
  expenses: StudioExpense[],
  activityLogs: ActivityLog[],
  range?: DateRangeFilter
): StaffPerformanceReport {
  const validBookings = bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    const date = b.appointmentDate || (b.createdAt ? b.createdAt.slice(0, 10) : "");
    return isDateInRange(date, range);
  });

  const validPayments = payments.filter((p) => {
    if ((p as any).isReversed) return false;
    const date = p.paymentDate || (p.createdAt ? p.createdAt.slice(0, 10) : "");
    return isDateInRange(date, range);
  });

  const validExpenses = expenses.filter((e) => {
    if ((e as any).isReversed) return false;
    const date = e.expenseDate || (e.createdAt ? e.createdAt.slice(0, 10) : "");
    return isDateInRange(date, range);
  });

  const validLogs = activityLogs.filter((l) => {
    const date = l.timestamp ? l.timestamp.slice(0, 10) : "";
    return isDateInRange(date, range);
  });

  let unassignedCount = 0;
  validBookings.forEach((b) => {
    const pName = (b.photographerName || "").trim().toLowerCase();
    if (!pName || pName === "unassigned" || pName === "none") {
      unassignedCount++;
    }
  });

  const staffMembers: StaffPerformanceItem[] = users.map((u) => {
    const uNameLower = (u.displayName || "").trim().toLowerCase();

    // Bookings assigned to photographer or managed by user
    const assignedBookings = validBookings.filter((b) => {
      const bPhotog = (b.photographerName || "").trim().toLowerCase();
      return bPhotog && bPhotog === uNameLower;
    });

    const sessionsCompleted = assignedBookings.filter((b) => b.status === "completed").length;

    // Payments recorded by this user
    const userPayments = validPayments.filter((p) => p.recordedByUid === u.uid);
    const totalPaymentsNPR = userPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Expenses recorded by this user
    const userExpenses = validExpenses.filter((e) => e.recordedByUid === u.uid);

    // Logs recorded by this user
    const userLogs = validLogs.filter((l) => l.userId === u.uid);

    return {
      uid: u.uid,
      displayName: u.displayName || "Studio Team Member",
      email: u.email,
      role: u.role,
      active: u.active !== false,
      bookingsManagedCount: assignedBookings.length,
      sessionsCompletedCount: sessionsCompleted,
      paymentsRecordedCount: userPayments.length,
      expensesRecordedCount: userExpenses.length,
      totalPaymentsCollectedNPR: totalPaymentsNPR,
      recentActivityCount: userLogs.length,
    };
  });

  // Sort by activity and managed bookings
  staffMembers.sort((a, b) => b.bookingsManagedCount - a.bookingsManagedCount);

  return {
    staffMembers,
    unassignedBookingsCount: unassignedCount,
    totalLoggedActivities: validLogs.length,
  };
}

// ==================================================================
// REVENUE & CASH COLLECTION TRENDS
// ==================================================================

export type TrendGrouping = "monthly" | "weekly" | "daily";

export interface TrendDataPoint {
  periodLabel: string;
  salesBooked: number;
  cashReceived: number;
  expenses: number;
  cashProfit: number;
  outstanding: number;
}

export function calculateTrendSeries(
  bookings: Booking[],
  payments: Payment[],
  expenses: StudioExpense[],
  grouping: TrendGrouping = "monthly",
  todayStr?: string
): TrendDataPoint[] {
  const currentToday = todayStr || new Date().toISOString().slice(0, 10);
  const now = new Date(currentToday);

  const validBookings = bookings.filter((b) => b.status !== "cancelled");
  const validPayments = payments.filter((p) => !(p as any).isReversed);
  const validExpenses = expenses.filter((e) => !(e as any).isReversed);

  if (grouping === "daily") {
    // Past 14 days
    const days: { label: string; key: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", { month: "short", day: "numeric" });
      days.push({ label, key });
    }

    return days.map(({ label, key }) => {
      const sales = validBookings
        .filter((b) => (b.appointmentDate || "").startsWith(key))
        .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
      const received = validPayments
        .filter((p) => (p.paymentDate || "").startsWith(key))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const exp = validExpenses
        .filter((e) => (e.expenseDate || "").startsWith(key))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      return {
        periodLabel: label,
        salesBooked: Math.round(sales),
        cashReceived: Math.round(received),
        expenses: Math.round(exp),
        cashProfit: calculateCashProfit(received, exp),
        outstanding: calculateOutstandingBalance(sales, received),
      };
    });
  }

  if (grouping === "weekly") {
    // Past 8 weeks
    const weeks: { label: string; start: string; end: string }[] = [];
    const dayOfWeek = now.getDay();
    const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    for (let i = 7; i >= 0; i--) {
      const wStart = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() - (i * 7));
      const wEnd = new Date(wStart.getFullYear(), wStart.getMonth(), wStart.getDate() + 6);
      const sKey = `${wStart.getFullYear()}-${String(wStart.getMonth() + 1).padStart(2, "0")}-${String(wStart.getDate()).padStart(2, "0")}`;
      const eKey = `${wEnd.getFullYear()}-${String(wEnd.getMonth() + 1).padStart(2, "0")}-${String(wEnd.getDate()).padStart(2, "0")}`;
      const label = `${wStart.toLocaleString("en-US", { month: "short", day: "numeric" })}`;
      weeks.push({ label, start: sKey, end: eKey });
    }

    return weeks.map(({ label, start, end }) => {
      const sales = validBookings
        .filter((b) => {
          const d = b.appointmentDate || "";
          return d >= start && d <= end;
        })
        .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
      const received = validPayments
        .filter((p) => {
          const d = p.paymentDate || "";
          return d >= start && d <= end;
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const exp = validExpenses
        .filter((e) => {
          const d = e.expenseDate || "";
          return d >= start && d <= end;
        })
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      return {
        periodLabel: label,
        salesBooked: Math.round(sales),
        cashReceived: Math.round(received),
        expenses: Math.round(exp),
        cashProfit: calculateCashProfit(received, exp),
        outstanding: calculateOutstandingBalance(sales, received),
      };
    });
  }

  // Monthly trend (past 6 months)
  const months: { label: string; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    months.push({ label, key });
  }

  return months.map(({ label, key }) => {
    const sales = validBookings
      .filter((b) => (b.appointmentDate || "").startsWith(key))
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const received = validPayments
      .filter((p) => (p.paymentDate || "").startsWith(key))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const exp = validExpenses
      .filter((e) => (e.expenseDate || "").startsWith(key))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      periodLabel: label,
      salesBooked: Math.round(sales),
      cashReceived: Math.round(received),
      expenses: Math.round(exp),
      cashProfit: calculateCashProfit(received, exp),
      outstanding: calculateOutstandingBalance(sales, received),
    };
  });
}
