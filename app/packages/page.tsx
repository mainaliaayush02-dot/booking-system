"use client";

import React, { useEffect, useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Package, Plus, Sparkles, Check, Clock } from "lucide-react";
import { getPackages } from "@/lib/firestore";
import { PhotographyPackage } from "@/lib/types";
import { formatNPR } from "@/lib/utils";

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
        <div className="bg-white border border-[#EFE8DC] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-studio-600" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal-900">
                Photography Packages
              </h2>
            </div>
            <p className="text-sm text-charcoal-500 mt-1">
              Pricing, deposit minimums, session durations, and studio package deliverables.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-studio-50 border border-studio-200 text-studio-800">
            <Sparkles className="w-3.5 h-3.5 text-studio-600" />
            Phase 2 Package Suite
          </span>
        </div>

        {loading ? (
          <div className="bg-white border border-[#EFE8DC] rounded-2xl p-12 text-center">
            <p className="text-xs text-charcoal-400 animate-pulse">Loading packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white border border-[#EFE8DC] rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-cream-100 text-studio-600 mx-auto flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-serif font-semibold text-charcoal-800">
              No packages cataloged yet
            </h4>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              Packages can be added in Phase 2 with customizable inclusions and deposit amounts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white border border-[#EFE8DC] rounded-2xl p-6 shadow-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-studio-700 bg-studio-50 border border-studio-200 px-2.5 py-0.5 rounded-full">
                      {pkg.category}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        pkg.active ? "text-emerald-700 bg-emerald-50" : "text-charcoal-400 bg-sand-100"
                      }`}
                    >
                      {pkg.active ? "Active" : "Archived"}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-charcoal-900 mt-3">
                    {pkg.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-serif font-bold text-studio-800">
                      {formatNPR(pkg.price)}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-charcoal-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-charcoal-400" />
                    <span>Duration: {pkg.durationMinutes} mins</span>
                    <span>•</span>
                    <span>Deposit: {formatNPR(pkg.depositAmount)}</span>
                  </div>

                  {pkg.inclusions && pkg.inclusions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#EFE8DC] space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">
                        Package Inclusions:
                      </p>
                      <ul className="space-y-1.5">
                        {pkg.inclusions.map((inc, i) => (
                          <li key={i} className="text-xs text-charcoal-600 flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-studio-600 shrink-0 mt-0.5" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudioLayout>
  );
}

