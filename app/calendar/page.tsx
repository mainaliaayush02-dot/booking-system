"use client";

import React from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Calendar, Clock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <StudioLayout>
      <div className="space-y-6">
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#3D084B]" />
              <h2 className="font-serif text-2xl font-bold text-[#3D084B]">
                Studio Booking Calendar
              </h2>
            </div>
            <p className="text-sm text-[#846F7F] mt-1">
              Monthly, weekly, and daily appointment scheduling in Asia/Kathmandu timezone.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FAF2F7] border border-[#EBD8E1] text-[#3D084B]">
            <Sparkles className="w-3.5 h-3.5 text-[#3D084B]" />
            Phase 2 Operations Hub
          </span>
        </div>

        <Card className="p-12 text-center space-y-4 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF2F7] text-[#3D084B] border border-[#EBD8E1] mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif text-xl font-bold text-[#3D084B]">
              Interactive Studio Calendar
            </h3>
            <p className="text-sm text-[#846F7F] mt-2">
              The booking calendar, slot conflict detection, package assignments, and appointment scheduling are part of Phase 2.
            </p>
          </div>
        </Card>
      </div>
    </StudioLayout>
  );
}
