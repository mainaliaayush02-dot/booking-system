"use client";

import React, { useEffect, useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Receipt, DollarSign, CreditCard, TrendingUp, Sparkles, Plus } from "lucide-react";
import { getPayments, getExpenses, getDashboardMetrics } from "@/lib/firestore";
import { Payment, StudioExpense, DashboardMetrics } from "@/lib/types";
import { formatNPR, formatDate } from "@/lib/utils";

export default function FinancePage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<StudioExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinanceData() {
      try {
        setLoading(true);
        const [dashMetrics, pList, eList] = await Promise.all([
          getDashboardMetrics(),
          getPayments(),
          getExpenses(),
        ]);
        setMetrics(dashMetrics);
        setPayments(pList);
        setExpenses(eList);
      } catch (err) {
        console.error("Finance data fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFinanceData();
  }, []);

  return (
    <StudioLayout>
      <div className="space-y-6">
        <div className="bg-white border border-[#EFE8DC] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-studio-600" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal-900">
                Accounts & Finance
              </h2>
            </div>
            <p className="text-sm text-charcoal-500 mt-1">
              Payment recording, studio expenses, cash flow, and monthly profit & loss.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-studio-50 border border-studio-200 text-studio-800">
            <Sparkles className="w-3.5 h-3.5 text-studio-600" />
            Phase 3 Financial Engine
          </span>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
              Cash Collected
            </span>
            <p className="text-2xl font-serif font-bold text-emerald-800 mt-2">
              {loading ? "..." : formatNPR(metrics?.monthlyCashCollected)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1">Actual revenue received</p>
          </div>

          <div className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
              Studio Expenses
            </span>
            <p className="text-2xl font-serif font-bold text-rose-700 mt-2">
              {loading ? "..." : formatNPR(metrics?.monthlyExpenses)}
            </p>
            <p className="text-[11px] text-charcoal-500 mt-1">Studio rent, props, utilities</p>
          </div>

          <div className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
              Net Cash Profit
            </span>
            <p className="text-2xl font-serif font-bold text-charcoal-900 mt-2">
              {loading ? "..." : formatNPR(metrics?.cashProfit)}
            </p>
            <p className="text-[11px] text-charcoal-500 mt-1">Cash received minus expenses</p>
          </div>
        </div>

        {/* Transactions & Expenses Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="bg-white border border-[#EFE8DC] rounded-xl p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-4 border-b border-cream-100">
              <h3 className="font-serif font-semibold text-charcoal-900">Recent Payment Receipts</h3>
              <span className="text-xs text-charcoal-400">{payments.length} Recorded</span>
            </div>
            {loading ? (
              <p className="text-xs text-charcoal-400 py-6 text-center animate-pulse">Loading payments...</p>
            ) : payments.length === 0 ? (
              <p className="text-xs text-charcoal-500 py-6 text-center">
                No payments recorded yet. Advance and remaining payments will appear here.
              </p>
            ) : (
              <div className="divide-y divide-cream-100">
                {payments.slice(0, 5).map((pay) => (
                  <div key={pay.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-charcoal-800">{pay.clientName}</p>
                      <p className="text-[11px] text-charcoal-400">
                        {pay.receiptNumber} • {pay.paymentMethod} • {formatDate(pay.paymentDate)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 font-serif">
                      {formatNPR(pay.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="bg-white border border-[#EFE8DC] rounded-xl p-5 shadow-subtle">
            <div className="flex items-center justify-between pb-4 border-b border-cream-100">
              <h3 className="font-serif font-semibold text-charcoal-900">Studio Expenses</h3>
              <span className="text-xs text-charcoal-400">{expenses.length} Recorded</span>
            </div>
            {loading ? (
              <p className="text-xs text-charcoal-400 py-6 text-center animate-pulse">Loading expenses...</p>
            ) : expenses.length === 0 ? (
              <p className="text-xs text-charcoal-500 py-6 text-center">
                No studio expenses logged yet.
              </p>
            ) : (
              <div className="divide-y divide-cream-100">
                {expenses.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-charcoal-800">{exp.title}</p>
                      <p className="text-[11px] text-charcoal-400">
                        {exp.category} • {formatDate(exp.expenseDate)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-rose-700 font-serif">
                      {formatNPR(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
