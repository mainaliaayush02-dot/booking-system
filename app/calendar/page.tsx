"use client";

import React from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Calendar, Clock, Sparkles } from "lucide-react";

export default function CalendarPage() {
  return (
    <StudioLayout>
      <div className="space-y-6">
        <div className="bg-white border border-[#EFE8DC] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-studio-600" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal-900">
                Studio Booking Calendar
              </h2>
            </div>
            <p className="text-sm text-charcoal-500 mt-1">
              Monthly, weekly, and daily appointment scheduling in Asia/Kathmandu timezone.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-studio-50 border border-studio-200 text-studio-800">
            <Sparkles className="w-3.5 h-3.5 text-studio-600" />
            Phase 2 Operations Hub
          </span>
        </div>

        <div className="bg-white border border-[#EFE8DC] rounded-2xl p-12 text-center space-y-4 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 text-studio-600 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif text-xl font-semibold text-charcoal-900">
              Interactive Studio Calendar
            </h3>
            <p className="text-sm text-charcoal-500 mt-2">
              The booking calendar, slot conflict detection, package assignments, and appointment scheduling are part of Phase 2.
            </p>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
