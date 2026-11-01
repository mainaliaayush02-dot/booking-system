"use client";

import React, { useEffect, useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Package, Sparkles, Check, Clock } from "lucide-react";
import { getPackages } from "@/lib/firestore";
import { PhotographyPackage } from "@/lib/types";
import { formatNPR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function PackagesPage() {
  const [packages, setPackages] = useState<PhotographyPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      try {
        setLoading(true);
        const data = await getPackages(true);
        setPackages(data);
      } catch (err) {
        console.error("Error fetching packages:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  return (
    <StudioLayout>
      <div className="space-y-6">
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#3D084B]" />
              <h2 className="font-serif text-2xl font-bold text-[#3D084B]">
                Photography Packages
              </h2>
            </div>
            <p className="text-sm text-[#846F7F] mt-1">
              Pricing, deposit minimums, session durations, and studio package deliverables.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FAF2F7] border border-[#EBD8E1] text-[#3D084B]">
            <Sparkles className="w-3.5 h-3.5 text-[#3D084B]" />
            Phase 2 Package Suite
          </span>
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <p className="text-xs text-[#846F7F] animate-pulse">Loading packages...</p>
          </Card>
        ) : packages.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No packages cataloged yet"
            description="Photography packages can be configured in Phase 2 with customizable inclusions and deposit amounts."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D084B] bg-[#FAF2F7] border border-[#EBD8E1] px-2.5 py-0.5 rounded-full">
                      {pkg.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pkg.active ? "text-emerald-800 bg-emerald-50 border border-emerald-200" : "text-[#846F7F] bg-[#EAD1DC]/40"
                      }`}
                    >
                      {pkg.active ? "Active" : "Archived"}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-[#3D084B] mt-3">
                    {pkg.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-serif font-bold text-[#3D084B]">
                      {formatNPR(pkg.price)}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-[#846F7F] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#846F7F]" />
                    <span>Duration: {pkg.durationMinutes} mins</span>
                    <span>•</span>
                    <span>Deposit: {formatNPR(pkg.depositAmount)}</span>
                  </div>

                  {pkg.inclusions && pkg.inclusions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#EBD8E1] space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F]">
                        Package Inclusions:
                      </p>
                      <ul className="space-y-1.5">
                        {pkg.inclusions.map((inc, i) => (
                          <li key={i} className="text-xs text-[#332A34] flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-[#3D084B] shrink-0 mt-0.5" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudioLayout>
  );
}
