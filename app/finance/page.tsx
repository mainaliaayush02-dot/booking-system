"use client";

import React, { useEffect, useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Receipt, Sparkles } from "lucide-react";
import { getPayments, getExpenses, getDashboardMetrics } from "@/lib/firestore";
import { Payment, StudioExpense, DashboardMetrics } from "@/lib/types";
import { formatNPR, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#3D084B]" />
              <h2 className="font-serif text-2xl font-bold text-[#3D084B]">
                Accounts & Finance
              </h2>
            </div>
            <p className="text-sm text-[#846F7F] mt-1">
              Payment recording, studio expenses, cash flow, and monthly profit & loss.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FAF2F7] border border-[#EBD8E1] text-[#3D084B]">
            <Sparkles className="w-3.5 h-3.5 text-[#3D084B]" />
            Phase 3 Financial Engine
          </span>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F]">
              Cash Collected
            </span>
            <p className="text-2xl font-serif font-bold text-[#3D084B] mt-2">
              {loading ? "..." : formatNPR(metrics?.monthlyCashCollected)}
            </p>
            <p className="text-[11px] text-[#68456E] mt-1 font-medium">Actual revenue received</p>
          </Card>

          <Card className="p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F]">
              Studio Expenses
            </span>
            <p className="text-2xl font-serif font-bold text-[#332A34] mt-2">
              {loading ? "..." : formatNPR(metrics?.monthlyExpenses)}
            </p>
            <p className="text-[11px] text-[#846F7F] mt-1">Studio rent, props, utilities</p>
          </Card>

          <Card className="p-5 bg-[#FAF2F7]/70 border-[#D6A3C7]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D084B]">
              Net Cash Profit
            </span>
            <p className="text-2xl font-serif font-bold text-[#3D084B] mt-2">
              {loading ? "..." : formatNPR(metrics?.cashProfit)}
            </p>
            <p className="text-[11px] text-[#68456E] mt-1 font-medium">Cash received minus expenses</p>
          </Card>
        </div>

        {/* Transactions & Expenses Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EBD8E1]">
              <h3 className="font-serif font-bold text-[#3D084B]">Recent Payment Receipts</h3>
              <span className="text-xs text-[#846F7F] font-medium">{payments.length} Recorded</span>
            </div>
            {loading ? (
              <p className="text-xs text-[#846F7F] py-6 text-center animate-pulse">Loading payments...</p>
            ) : payments.length === 0 ? (
              <p className="text-xs text-[#846F7F] py-6 text-center">
                No payments recorded yet. Advance and remaining payments will appear here.
              </p>
            ) : (
              <div className="divide-y divide-[#EBD8E1]">
                {payments.slice(0, 5).map((pay) => (
                  <div key={pay.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#332A34]">{pay.clientName}</p>
                      <p className="text-[11px] text-[#846F7F]">
                        {pay.receiptNumber} • {pay.paymentMethod} • {formatDate(pay.paymentDate)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#3D084B] font-serif">
                      {formatNPR(pay.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Expenses */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EBD8E1]">
              <h3 className="font-serif font-bold text-[#3D084B]">Studio Expenses</h3>
              <span className="text-xs text-[#846F7F] font-medium">{expenses.length} Recorded</span>
            </div>
            {loading ? (
              <p className="text-xs text-[#846F7F] py-6 text-center animate-pulse">Loading expenses...</p>
            ) : expenses.length === 0 ? (
              <p className="text-xs text-[#846F7F] py-6 text-center">
                No studio expenses logged yet.
              </p>
            ) : (
              <div className="divide-y divide-[#EBD8E1]">
                {expenses.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#332A34]">{exp.title}</p>
                      <p className="text-[11px] text-[#846F7F]">
                        {exp.category} • {formatDate(exp.expenseDate)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#846F7F] font-serif">
                      {formatNPR(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </StudioLayout>
  );
}
