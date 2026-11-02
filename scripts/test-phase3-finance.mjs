// Automated Verification Script for Phase 3 Accounts & Finance
// Newborn Photography Nepal - Studio Manager (By Navin)

import {
  calculateRemainingBalance,
  calculateCashProfit,
  calculateOutstandingBalance,
  calculatePaymentStatus,
  validatePaymentAmount,
  isDateInRange,
  getDatePresetRange,
  calculateFinancialSummary,
} from "../lib/finance-calculations.ts";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("==================================================================");
console.log("PHASE 3: FINANCIAL CALCULATION & INTEGRITY VERIFICATION SUITE");
console.log("==================================================================\n");

// -------------------------------------------------------------
// TEST SUITE 1: MANDATORY DOMAIN TEST CASES
// -------------------------------------------------------------
console.log("1. MANDATORY DOMAIN CALCULATION TEST CASES");

// Case 1: Total = 15,999, Payments = 5,000 -> Remaining = 10,999
const rem1 = calculateRemainingBalance(15999, 5000);
assert(rem1 === 10999, `Case 1: Total 15,999, Paid 5,000 -> Remaining balance is 10,999 (Got: ${rem1})`);
assert(calculatePaymentStatus(15999, 5000) === "partially_paid", `Case 1: Status is partially_paid`);

// Case 2: Total = 15,999, Payments = 15,999 -> Remaining = 0
const rem2 = calculateRemainingBalance(15999, 15999);
assert(rem2 === 0, `Case 2: Total 15,999, Paid 15,999 -> Remaining balance is 0 (Got: ${rem2})`);
assert(calculatePaymentStatus(15999, 15999) === "paid", `Case 2: Status is paid`);

// Case 3: Total = 15,999, Payments = 0 -> Remaining = 15,999
const rem3 = calculateRemainingBalance(15999, 0);
assert(rem3 === 15999, `Case 3: Total 15,999, Paid 0 -> Remaining balance is 15,999 (Got: ${rem3})`);
assert(calculatePaymentStatus(15999, 0) === "unpaid", `Case 3: Status is unpaid`);

// Case 4: Payments Received = 20,000, Expenses = 7,000 -> Cash Profit = 13,000
const profit1 = calculateCashProfit(20000, 7000);
assert(profit1 === 13000, `Case 4: Received 20,000, Expenses 7,000 -> Cash Profit is 13,000 (Got: ${profit1})`);

// Case 5: Contracted Sales = 30,000, Received = 10,000, Expenses = 4,000
// Profit MUST BE Received (10,000) - Expenses (4,000) = 6,000, NOT Sales (30,000) - Expenses (4,000) = 26,000!
const profit2 = calculateCashProfit(10000, 4000);
const outstanding = calculateOutstandingBalance(30000, 10000);
assert(profit2 === 6000, `Case 5: Cash Profit is strictly 6,000 (Received 10,000 - Expenses 4,000) (Got: ${profit2})`);
assert(profit2 !== 26000, `Case 5: Cash Profit is NEVER contracted sales minus expenses`);
assert(outstanding === 20000, `Case 5: Outstanding Balance is 20,000 (Got: ${outstanding})`);

// -------------------------------------------------------------
// TEST SUITE 2: OVERPAYMENT VALIDATION
// -------------------------------------------------------------
console.log("\n2. OVERPAYMENT VALIDATION PREVENTION");

const valValid = validatePaymentAmount(15999, 5000, 10999);
assert(valValid.valid === true, `Exact remaining balance payment of 10,999 is valid`);

const valOver = validatePaymentAmount(15999, 5000, 11000);
assert(valOver.valid === false, `Overpayment of 11,000 when remaining is 10,999 is blocked`);
assert(valOver.error && valOver.error.includes("exceeds the remaining balance"), `Overpayment error message is clear`);

const valZero = validatePaymentAmount(15999, 5000, 0);
assert(valZero.valid === false, `Payment of 0 NPR is blocked`);

const valNegative = validatePaymentAmount(15999, 5000, -500);
assert(valNegative.valid === false, `Negative payment is blocked`);

// -------------------------------------------------------------
// TEST SUITE 3: DATE RANGE & PRESET CALCULATIONS
// -------------------------------------------------------------
console.log("\n3. DATE RANGE & PRESET CALCULATIONS");

const todayTest = "2026-11-02";
const rangeMonth = getDatePresetRange("month", todayTest);
assert(rangeMonth.startDate === "2026-11-01" && rangeMonth.endDate === "2026-11-30", `Month preset covers 2026-11-01 to 2026-11-30`);

const rangeYear = getDatePresetRange("year", todayTest);
assert(rangeYear.startDate === "2026-01-01" && rangeYear.endDate === "2026-12-31", `Year preset covers 2026-01-01 to 2026-12-31`);

const rangeQuarter = getDatePresetRange("quarter", todayTest);
assert(rangeQuarter.startDate === "2026-10-01" && rangeQuarter.endDate === "2026-12-31", `Q4 preset covers 2026-10-01 to 2026-12-31`);

assert(isDateInRange("2026-11-15", rangeMonth) === true, `2026-11-15 is inside November range`);
assert(isDateInRange("2026-12-01", rangeMonth) === false, `2026-12-01 is outside November range`);

// -------------------------------------------------------------
// TEST SUITE 4: FINANCIAL SUMMARY & AUDIT REVERSAL INTEGRITY
// -------------------------------------------------------------
console.log("\n4. FINANCIAL SUMMARY WITH AUDIT REVERSAL EXCLUSION");

const mockBookings = [
  { id: "b1", totalAmount: 25000, advancePaid: 10000, remainingBalance: 15000, status: "confirmed", appointmentDate: "2026-11-10" },
  { id: "b2", totalAmount: 15000, advancePaid: 15000, remainingBalance: 0, status: "completed", appointmentDate: "2026-11-12" },
  { id: "b3", totalAmount: 20000, advancePaid: 5000, remainingBalance: 15000, status: "cancelled", appointmentDate: "2026-11-15" }, // Cancelled!
];

const mockPayments = [
  { id: "p1", bookingId: "b1", amount: 10000, paymentDate: "2026-11-05", paymentMethod: "esewa", isReversed: false },
  { id: "p2", bookingId: "b2", amount: 15000, paymentDate: "2026-11-08", paymentMethod: "bank_transfer", isReversed: false },
  { id: "p3", bookingId: "b1", amount: 3000, paymentDate: "2026-11-09", paymentMethod: "cash", isReversed: true, reversalReason: "Mistaken entry" }, // Reversed!
];

const mockExpenses = [
  { id: "e1", category: "props_costumes", amount: 4000, expenseDate: "2026-11-04", paymentMethod: "bank_transfer", isReversed: false },
  { id: "e2", category: "utilities", amount: 2000, expenseDate: "2026-11-06", paymentMethod: "esewa", isReversed: false },
  { id: "e3", category: "equipment", amount: 8000, expenseDate: "2026-11-07", paymentMethod: "cash", isReversed: true }, // Reversed!
];

const report = calculateFinancialSummary(mockBookings, mockPayments, mockExpenses, rangeMonth, "November 2026");

// Total Booking Sales: b1 (25,000) + b2 (15,000) = 40,000 (b3 cancelled excluded!)
assert(report.totalBookingSales === 40000, `Total Booking Sales is 40,000 (cancelled excluded) (Got: ${report.totalBookingSales})`);

// Total Payments Received: p1 (10,000) + p2 (15,000) = 25,000 (p3 reversed excluded!)
assert(report.totalPaymentsReceived === 25000, `Payments Received is 25,000 (reversed payment excluded) (Got: ${report.totalPaymentsReceived})`);

// Total Expenses: e1 (4,000) + e2 (2,000) = 6,000 (e3 reversed excluded!)
assert(report.totalExpensesPaid === 6000, `Expenses Paid is 6,000 (reversed expense excluded) (Got: ${report.totalExpensesPaid})`);

// Cash Profit: Received (25,000) - Expenses (6,000) = 19,000
assert(report.cashProfit === 19000, `Net Cash Profit is strictly 19,000 (Got: ${report.cashProfit})`);

// Outstanding: b1 remaining (15,000) + b2 remaining (0) = 15,000
assert(report.outstandingAmount === 15000, `Outstanding Amount is 15,000 (Got: ${report.outstandingAmount})`);

// Payment channel breakdown
assert(report.paymentMethodBreakdown.esewa === 10000, `eSewa collection is 10,000`);
assert(report.paymentMethodBreakdown.bank_transfer === 15000, `Bank Transfer collection is 15,000`);
assert(report.paymentMethodBreakdown.cash === 0, `Cash collection is 0 (reversed cash payment excluded)`);

// Expense category breakdown
assert(report.expenseCategoryBreakdown.props_costumes === 4000, `Props & Costumes overhead is 4,000`);
assert(report.expenseCategoryBreakdown.utilities === 2000, `Utilities overhead is 2,000`);
assert(report.expenseCategoryBreakdown.equipment === undefined, `Equipment expense is excluded because reversed`);

console.log("\n==================================================================");
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL PHASE 3 FINANCIAL CALCULATIONS VERIFIED SUCCESSFULLY!\n");
}
