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
      <div className="h-72 w-full flex items-center justify-center bg-[#FAF2F7]/50 rounded-2xl border border-[#EBD8E1]">
        <p className="text-xs text-[#846F7F] animate-pulse font-medium">
          Loading studio financial performance...
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
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-3.5 rounded-2xl shadow-float text-xs space-y-1.5">
          <p className="font-bold text-[#3D084B] border-b border-[#EBD8E1] pb-1 font-serif">
            Month: {label}
          </p>
          <div className="space-y-1 pt-1 font-medium">
            <p className="text-[#3D084B] flex items-center justify-between gap-4">
              <span>Sales Booked:</span>
              <span className="font-bold">{formatNPR(payload[0]?.value)}</span>
            </p>
            <p className="text-[#68456E] flex items-center justify-between gap-4">
              <span>Cash Collected:</span>
              <span className="font-bold">{formatNPR(payload[1]?.value)}</span>
            </p>
            <p className="text-[#A4537F] flex items-center justify-between gap-4">
              <span>Expenses Paid:</span>
              <span className="font-bold">{formatNPR(payload[2]?.value)}</span>
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
        <div className="mb-3 px-4 py-2 rounded-xl bg-[#FAF2F7] border border-[#EBD8E1] flex items-center justify-between text-[11px] text-[#846F7F]">
          <span>Database currently has zero historical financial entries. Chart displays empty baseline.</span>
          <span className="font-mono text-[#3D084B] font-bold">NPR Currency</span>
        </div>
      )}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0DEE7" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "#846F7F", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#EBD8E1" }}
            />
            <YAxis
              tick={{ fill: "#846F7F", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#EBD8E1" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "14px", color: "#332A34" }}
              iconType="circle"
              iconSize={8}
            />
            {/* Deep Plum - Primary Brand */}
            <Bar
              dataKey="salesBooked"
              name="Sales Booked"
              fill="#3D084B"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            {/* Muted Plum - Secondary Brand */}
            <Bar
              dataKey="cashReceived"
              name="Cash Collected"
              fill="#68456E"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            {/* Dusty Rose / Rose Mauve */}
            <Bar
              dataKey="expenses"
              name="Studio Expenses"
              fill="#A4537F"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
