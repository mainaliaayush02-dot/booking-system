"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { MonthlyTrendData } from "@/lib/firestore";
import { formatNPR } from "@/lib/utils";

interface RevenueChartProps {
  data: MonthlyTrendData[];
  loading?: boolean;
}

export function RevenueChart({ data, loading = false }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="h-72 w-full flex items-center justify-center bg-cream-50/50 rounded-xl border border-cream-200">
        <p className="text-xs text-charcoal-400 animate-pulse font-medium">
          Loading studio financial trend...
        </p>
      </div>
    );
  }

  const hasAnyData = data.some(
    (d) => d.salesBooked > 0 || d.cashReceived > 0 || d.expenses > 0
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#EFE8DC] p-3 rounded-xl shadow-float text-xs space-y-1">
          <p className="font-semibold text-charcoal-900 border-b border-[#F2ECE1] pb-1">
            Month: {label}
          </p>
          <div className="space-y-0.5 pt-1">
            <p className="text-studio-700 font-medium">
              Sales Booked: {formatNPR(payload[0]?.value)}
            </p>
            <p className="text-emerald-700 font-medium">
              Cash Received: {formatNPR(payload[1]?.value)}
            </p>
            <p className="text-rose-700 font-medium">
              Expenses Paid: {formatNPR(payload[2]?.value)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {!hasAnyData && (
        <div className="mb-3 px-3.5 py-2 rounded-lg bg-[#FAF8F5] border border-[#E8DFD3] flex items-center justify-between text-[11px] text-charcoal-500">
          <span>Database currently has zero historical financial entries. Chart displays empty baseline.</span>
          <span className="font-mono text-studio-600 font-semibold">NPR Currency</span>
        </div>
      )}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "#78716C", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#E5DDD0" }}
            />
            <YAxis
              tick={{ fill: "#78716C", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#E5DDD0" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="salesBooked"
              name="Sales Booked"
              fill="#8C7355"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="cashReceived"
              name="Cash Collected"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="expenses"
              name="Studio Expenses"
              fill="#F43F5E"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
