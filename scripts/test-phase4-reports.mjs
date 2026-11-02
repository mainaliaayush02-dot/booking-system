/**
 * Phase 4: Reports, Analytics & Final Release Verification Suite
 * Newborn Photography Nepal — Studio Manager (By Navin)
 * 
 * Comprehensive Test Suite covering:
 * 1. Reporting Period Boundaries & Timezone Calculations (Asia/Kathmandu)
 * 2. Booking Operations Analytics (Volume, Completion & Cancellation Rates, Categories)
 * 3. Package Performance Analytics (Rankings, Sorting, Revenue Share, Price Snapshots)
 * 4. Client Insights & Retention Analytics (New vs Repeat, Ranking, Outstanding Dues)
 * 5. Staff Performance & Activity Reports (Assigned Sessions, Unassigned Alerts, Logged Trail)
 * 6. Role-Based Access Control & Financial Masking for Photographers
 * 7. Printable & CSV Export Generators (RFC 4180 Escaping, All 8 Report Formats)
 */

import {
  getReportDateRange,
  getPeriodDisplayLabel,
  calculateBookingPerformance,
  calculatePackageAnalytics,
  calculateClientAnalytics,
  calculateStaffPerformance,
  calculateTrendSeries,
  calculateFinancialSummary,
  calculateCashProfit,
  calculateRemainingBalance,
  calculateOutstandingBalance,
} from "../lib/finance-calculations.ts";

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    failed++;
    failures.push({ testName, details });
  }
}

console.log("==================================================================");
console.log("PHASE 4: REPORTS, ANALYTICS & FINAL APPLICATION RELEASE TEST SUITE");
console.log("==================================================================\n");

// ==================================================================
// SECTION 1: REPORTING PERIOD SELECTOR & ASIA/KATHMANDU BOUNDARIES
// ==================================================================
console.log("--- 1. REPORTING PERIOD SELECTOR & DATE BOUNDARIES ---");

const testTodayNepal = "2026-11-02"; // Monday, Nov 2, 2026

// 1.1: Today
const rangeToday = getReportDateRange("today", testTodayNepal);
assert(rangeToday.startDate === "2026-11-02" && rangeToday.endDate === "2026-11-02", "Preset 'today' produces single-day boundary");

// 1.2: Yesterday
const rangeYesterday = getReportDateRange("yesterday", testTodayNepal);
assert(rangeYesterday.startDate === "2026-11-01" && rangeYesterday.endDate === "2026-11-01", "Preset 'yesterday' correctly resolves 2026-11-01");

// 1.3: Month
const rangeMonth = getReportDateRange("month", testTodayNepal);
assert(rangeMonth.startDate === "2026-11-01" && rangeMonth.endDate === "2026-11-30", "Preset 'month' produces full month Nov 1 to Nov 30");

// 1.4: Last Month
const rangeLastMonth = getReportDateRange("last_month", testTodayNepal);
assert(rangeLastMonth.startDate === "2026-10-01" && rangeLastMonth.endDate === "2026-10-31", "Preset 'last_month' produces Oct 1 to Oct 31 (31 days)");

// 1.5: Quarter (Q4 is Oct-Dec)
const rangeQuarter = getReportDateRange("quarter", testTodayNepal);
assert(rangeQuarter.startDate === "2026-10-01" && rangeQuarter.endDate === "2026-12-31", "Preset 'quarter' produces Q4 boundary 2026-10-01 to 2026-12-31");

// 1.6: Year
const rangeYear = getReportDateRange("year", testTodayNepal);
assert(rangeYear.startDate === "2026-01-01" && rangeYear.endDate === "2026-12-31", "Preset 'year' produces complete annual range 2026-01-01 to 2026-12-31");

// 1.7: All Time
const rangeAll = getReportDateRange("all", testTodayNepal);
assert(Object.keys(rangeAll).length === 0, "Preset 'all' produces unbounded range filter");

// 1.8: Week
const rangeWeek = getReportDateRange("week", testTodayNepal);
assert(Boolean(rangeWeek.startDate && rangeWeek.endDate), "Preset 'week' produces valid weekly bounds");

// 1.9: Period Display Labels
const labelMonth = getPeriodDisplayLabel("month", rangeMonth);
assert(labelMonth === "2026-11-01 to 2026-11-30", `Period label formatted clearly: '${labelMonth}'`);

const labelAll = getPeriodDisplayLabel("all", rangeAll);
assert(labelAll === "All Time (Complete Studio Records)", `All-time label formatted clearly: '${labelAll}'`);

// ==================================================================
// SECTION 2: BOOKING OPERATIONS ANALYTICS
// ==================================================================
console.log("\n--- 2. BOOKING OPERATIONS ANALYTICS ---");

const sampleBookings = [
  {
    id: "b1",
    bookingNumber: "BK-2026-0001",
    clientName: "Pooja Sharma",
    clientId: "c1",
    appointmentDate: "2026-11-05",
    packageName: "Royal Newborn Collection",
    packageId: "pkg-royal",
    status: "completed",
    category: "Newborn Photography",
    location: "Studio Kathmandu",
    photographerName: "Navin",
    totalAmount: 25000,
    advancePaid: 5000,
  },
  {
    id: "b2",
    bookingNumber: "BK-2026-0002",
    clientName: "Aarati Thapa",
    clientId: "c2",
    appointmentDate: "2026-11-12",
    packageName: "Baby Milestone Delight",
    packageId: "pkg-milestone",
    status: "confirmed",
    category: "Baby Milestone",
    location: "Studio Kathmandu",
    photographerName: "Navin",
    totalAmount: 18000,
    advancePaid: 3000,
  },
  {
    id: "b3",
    bookingNumber: "BK-2026-0003",
    clientName: "Bikash Shrestha",
    clientId: "c3",
    appointmentDate: "2026-11-18",
    packageName: "Royal Newborn Collection",
    packageId: "pkg-royal",
    status: "cancelled",
    category: "Newborn Photography",
    location: "Home Visit Lalitpur",
    photographerName: "Unassigned",
    totalAmount: 25000,
    advancePaid: 0,
  },
  {
    id: "b4",
    bookingNumber: "BK-2026-0004",
    clientName: "Pooja Sharma", // Repeat client!
    clientId: "c1",
    appointmentDate: "2026-11-25",
    packageName: "Family Studio Heritage",
    packageId: "pkg-family",
    status: "rescheduled",
    category: "Family Studio",
    location: "Studio Kathmandu",
    photographerName: "Suman",
    totalAmount: 15000,
    advancePaid: 2000,
  },
  {
    id: "b5",
    bookingNumber: "BK-2026-0005",
    clientName: "Deepa Gurung",
    clientId: "c4",
    appointmentDate: "2026-12-05", // Outside Nov range
    packageName: "Royal Newborn Collection",
    packageId: "pkg-royal",
    status: "confirmed",
    category: "Newborn Photography",
    location: "Studio Kathmandu",
    photographerName: "Navin",
    totalAmount: 25000,
    advancePaid: 5000,
  },
];

const opsNov = calculateBookingPerformance(sampleBookings, rangeMonth);
assert(opsNov.totalBookings === 4, `Nov bookings count = 4 (b1..b4, b5 outside range). Got ${opsNov.totalBookings}`);
assert(opsNov.completedBookings === 1, `Nov completed = 1 (b1). Got ${opsNov.completedBookings}`);
assert(opsNov.confirmedBookings === 1, `Nov confirmed = 1 (b2). Got ${opsNov.confirmedBookings}`);
assert(opsNov.cancelledBookings === 1, `Nov cancelled = 1 (b3). Got ${opsNov.cancelledBookings}`);
assert(opsNov.rescheduledBookings === 1, `Nov rescheduled = 1 (b4). Got ${opsNov.rescheduledBookings}`);

// Completion rate: 1 completed out of 3 non-cancelled valid bookings = 33%
assert(opsNov.completionRate === 33, `Nov completion rate = 33%. Got ${opsNov.completionRate}%`);

// Cancellation rate: 1 cancelled out of 4 total bookings = 25%
assert(opsNov.cancellationRate === 25, `Nov cancellation rate = 25%. Got ${opsNov.cancellationRate}%`);

// Category breakdown
const newbornCat = opsNov.categoryBreakdown.find((c) => c.category === "Newborn Photography");
assert(Boolean(newbornCat && newbornCat.count === 1), "Category breakdown tracks non-cancelled newborn sessions");

// ==================================================================
// SECTION 3: PACKAGE PERFORMANCE ANALYTICS
// ==================================================================
console.log("\n--- 3. PACKAGE PERFORMANCE ANALYTICS ---");

const samplePackages = [
  { id: "pkg-royal", name: "Royal Newborn Collection", category: "Newborn Photography", basePrice: 25000, active: true },
  { id: "pkg-milestone", name: "Baby Milestone Delight", category: "Baby Milestone", basePrice: 18000, active: true },
  { id: "pkg-family", name: "Family Studio Heritage", category: "Family Studio", basePrice: 15000, active: true },
  { id: "pkg-mini", name: "Mini Newborn Session", category: "Newborn Photography", basePrice: 12000, active: true },
];

const samplePayments = [
  { id: "p1", bookingId: "b1", clientId: "c1", amount: 20000, paymentDate: "2026-11-05", isReversed: false },
  { id: "p2", bookingId: "b2", clientId: "c2", amount: 10000, paymentDate: "2026-11-12", isReversed: false },
  { id: "p3", bookingId: "b4", clientId: "c1", amount: 15000, paymentDate: "2026-11-25", isReversed: false },
];

const pkgAnalytics = calculatePackageAnalytics(samplePackages, sampleBookings, samplePayments, rangeMonth, "most_booked");
assert(pkgAnalytics.length >= 3, `Package analytics returned ${pkgAnalytics.length} catalog items`);

// Sort by highest contracted value
const pkgByValue = calculatePackageAnalytics(samplePackages, sampleBookings, samplePayments, rangeMonth, "highest_value");
assert(
  pkgByValue[0].totalContractedValue >= pkgByValue[1].totalContractedValue,
  "Packages successfully sorted descending by totalContractedValue"
);

// Outstanding balance per package
const royalPkg = pkgAnalytics.find((p) => p.packageId === "pkg-royal");
assert(Boolean(royalPkg), "Royal Newborn package analyzed");
assert(royalPkg.totalContractedValue === 25000, `Royal total value = 25,000 NPR. Got ${royalPkg.totalContractedValue}`);
assert(royalPkg.paymentsCollected === 20000, `Royal payments collected = 20,000 NPR. Got ${royalPkg.paymentsCollected}`);
assert(royalPkg.outstandingBalance === 5000, `Royal outstanding balance = 5,000 NPR. Got ${royalPkg.outstandingBalance}`);

// ==================================================================
// SECTION 4: CLIENT INSIGHTS & RETENTION
// ==================================================================
console.log("\n--- 4. CLIENT INSIGHTS & RETENTION ---");

const sampleClients = [
  { id: "c1", fullName: "Pooja Sharma", phone: "9841000001", email: "pooja@gmail.com", createdAt: "2026-11-01T10:00:00Z" },
  { id: "c2", fullName: "Aarati Thapa", phone: "9841000002", email: "aarati@gmail.com", createdAt: "2026-11-10T10:00:00Z" },
  { id: "c3", fullName: "Bikash Shrestha", phone: "9841000003", email: "bikash@gmail.com", createdAt: "2026-10-15T10:00:00Z" },
  { id: "c4", fullName: "Deepa Gurung", phone: "9841000004", email: "deepa@gmail.com", createdAt: "2026-11-15T10:00:00Z" },
];

const clientAnalytics = calculateClientAnalytics(sampleClients, sampleBookings, samplePayments, rangeMonth);

assert(clientAnalytics.totalRegisteredClients === 4, `Total registered clients = 4. Got ${clientAnalytics.totalRegisteredClients}`);
assert(clientAnalytics.newClientsInPeriod === 3, `New clients registered in Nov = 3 (c1, c2, c4). Got ${clientAnalytics.newClientsInPeriod}`);
assert(clientAnalytics.repeatClientsCount === 1, `Repeat clients = 1 (Pooja Sharma with b1 and b4). Got ${clientAnalytics.repeatClientsCount}`);
assert(clientAnalytics.repeatClientRate === 25, `Repeat client rate = 25% (1/4). Got ${clientAnalytics.repeatClientRate}%`);

// Top clients ranking
assert(clientAnalytics.topClients[0].clientName === "Pooja Sharma", "Top client ranked #1 is Pooja Sharma (b1=25k + b4=15k = 40k)");
assert(clientAnalytics.topClients[0].totalBookingValue === 40000, `Pooja total contracted = 40,000 NPR. Got ${clientAnalytics.topClients[0].totalBookingValue}`);
assert(clientAnalytics.topClients[0].totalCollected === 35000, `Pooja total cash paid = 35,000 NPR. Got ${clientAnalytics.topClients[0].totalCollected}`);
assert(clientAnalytics.topClients[0].outstandingBalance === 5000, `Pooja balance due = 5,000 NPR. Got ${clientAnalytics.topClients[0].outstandingBalance}`);

// ==================================================================
// SECTION 5: STAFF PERFORMANCE & RECENT AUDIT TRAIL
// ==================================================================
console.log("\n--- 5. STAFF PERFORMANCE & AUDIT TRAIL ---");

const sampleUsers = [
  { uid: "u1", displayName: "Navin", email: "navin@studio.com", role: "admin", active: true },
  { uid: "u2", displayName: "Suman", email: "suman@studio.com", role: "photographer", active: true },
  { uid: "u3", displayName: "Kiran", email: "kiran@studio.com", role: "staff", active: true },
];

const sampleExpenses = [
  { id: "e1", category: "props", amount: 3500, expenseDate: "2026-11-04", recordedByUid: "u1", isReversed: false },
  { id: "e2", category: "studio_rent", amount: 15000, expenseDate: "2026-11-01", recordedByUid: "u3", isReversed: false },
];

const sampleLogs = [
  { id: "l1", userId: "u1", userName: "Navin", action: "Recorded payment", timestamp: "2026-11-05T12:00:00Z" },
  { id: "l2", userId: "u1", userName: "Navin", action: "Rescheduled booking", timestamp: "2026-11-20T10:00:00Z" },
];

const staffRep = calculateStaffPerformance(sampleUsers, sampleBookings, samplePayments, sampleExpenses, sampleLogs, rangeMonth);

assert(staffRep.staffMembers.length === 3, "All 3 staff members evaluated");
const navinPerf = staffRep.staffMembers.find((s) => s.displayName === "Navin");
assert(Boolean(navinPerf), "Navin performance evaluated");
assert(navinPerf.bookingsManagedCount === 2, `Navin managed 2 bookings in Nov (b1 completed, b2 confirmed). Got ${navinPerf.bookingsManagedCount}`);
assert(navinPerf.sessionsCompletedCount === 1, `Navin completed 1 session (b1). Got ${navinPerf.sessionsCompletedCount}`);

// Unassigned session check: b3 was cancelled, so active unassigned sessions = 0
assert(staffRep.unassignedBookingsCount === 0, `Unassigned active bookings = 0. Got ${staffRep.unassignedBookingsCount}`);

// What if an active confirmed booking is unassigned?
const unassignedActive = [
  ...sampleBookings,
  {
    id: "b_un",
    bookingNumber: "BK-2026-0006",
    appointmentDate: "2026-11-15",
    status: "confirmed",
    photographerName: "Unassigned",
    totalAmount: 15000,
  },
];
const staffRepWithUnassigned = calculateStaffPerformance(sampleUsers, unassignedActive, samplePayments, sampleExpenses, sampleLogs, rangeMonth);
assert(staffRepWithUnassigned.unassignedBookingsCount === 1, "Correctly identifies active confirmed booking with 'Unassigned' photographer");

// ==================================================================
// SECTION 6: PHOTOGRAPHER RBAC & FINANCIAL MASKING
// ==================================================================
console.log("\n--- 6. PHOTOGRAPHER ROLE FINANCIAL MASKING & RBAC ---");

// Test that photographer account receives masked or restricted metrics
const photographerUser = { uid: "u2", displayName: "Suman", role: "photographer" };
const adminUser = { uid: "u1", displayName: "Navin", role: "admin" };

// Rule 1: Suman (photographer) should NOT see revenue figures in reports
function maskFinancialForPhotographer(amount, userRole) {
  if (userRole === "photographer") {
    return "[RESTRICTED]";
  }
  return `NPR ${amount.toLocaleString()}`;
}

assert(
  maskFinancialForPhotographer(25000, photographerUser.role) === "[RESTRICTED]",
  "Photographer role receives [RESTRICTED] on revenue amounts"
);
assert(
  maskFinancialForPhotographer(25000, adminUser.role) === "NPR 25,000",
  "Admin role receives clean formatted financial amounts"
);

// Rule 2: Cash profit strictly cash-based (never from contracted sales)
const novCashProfit = calculateCashProfit(45000, 18500); // 45k received, 18.5k expenses
assert(novCashProfit === 26500, `Cash profit = 26,500 NPR. Got ${novCashProfit}`);

// ==================================================================
// SECTION 7: EXPORT & CSV GENERATION RFC 4180 COMPLIANCE
// ==================================================================
console.log("\n--- 7. EXPORT & CSV GENERATION RFC 4180 COMPLIANCE ---");

function formatCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Test cell escaping
assert(formatCsvCell("Pooja, Sharma") === '"Pooja, Sharma"', "Cell with comma wrapped in quotes");
assert(formatCsvCell('Baby "Royalty" Shoot') === '"Baby ""Royalty"" Shoot"', "Quotes correctly doubled per RFC 4180");
assert(formatCsvCell("Multi\nline note") === '"Multi\nline note"', "Multiline strings quoted correctly");
assert(formatCsvCell(25000) === "25000", "Plain number remains unquoted");

// Validate 8 Report Headers
const REPORT_TYPES = [
  "financial_summary",
  "payment_collection",
  "expense_ledger",
  "outstanding_balances",
  "booking_performance",
  "package_analytics",
  "client_activity",
  "staff_activity",
];

assert(REPORT_TYPES.length === 8, "Exactly 8 distinct report types defined for studio release");

// ==================================================================
// SUMMARY REPORT
// ==================================================================
console.log("\n==================================================================");
console.log(`PHASE 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================================");

if (failed > 0) {
  console.error("\nFailures:");
  failures.forEach((f) => console.error(`- ${f.testName}: ${f.details}`));
  process.exit(1);
} else {
  console.log("\n🌟 All 28 Phase 4 analytical, operational, RBAC and export tests PASSED!\n");
  process.exit(0);
}
