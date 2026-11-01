"use client";

import React from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { BarChart3, Download, Sparkles, FileSpreadsheet } from "lucide-react";

export default function ReportsPage() {
  return (
    <StudioLayout>
      <div className="space-y-6">
        <div className="bg-white border border-[#EFE8DC] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-studio-600" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal-900">
                Business Reports & Exports
              </h2>
            </div>
            <p className="text-sm text-charcoal-500 mt-1">
              Monthly and yearly revenue breakdowns, package performance, and CSV/Excel exports.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-studio-50 border border-studio-200 text-studio-800">
            <Sparkles className="w-3.5 h-3.5 text-studio-600" />
            Phase 4 Analytics
          </span>
        </div>

        <div className="bg-white border border-[#EFE8DC] rounded-2xl p-12 text-center space-y-4 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 text-studio-600 mx-auto flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif text-xl font-semibold text-charcoal-900">
              Studio Reporting Engine
            </h3>
            <p className="text-sm text-charcoal-500 mt-2">
              Comprehensive analytics, package conversion trends, customer retention, and exportable financial sheets are part of Phase 4.
            </p>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}

