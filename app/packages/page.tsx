"use client";

import React, { useEffect, useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import {
  Package,
  Plus,
  Sparkles,
  Check,
  Clock,
  Search,
  Edit2,
  Power,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import {
  getPackages,
  createPackage,
  updatePackage,
  togglePackageActive,
  seedStandardPackages,
} from "@/lib/firestore";
import { PhotographyPackage, PackageCategory } from "@/lib/types";
import { formatNPR, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PackageModal } from "@/components/packages/package-modal";
import { useAuth } from "@/lib/firebase-auth";

const CATEGORIES = [
  "All Categories",
  "Newborn Photography",
  "Maternity Photography",
  "Baby Photography",
  "Cake Smash Photography",
  "Family Photography",
  "Couple Photography",
];

export default function PackagesPage() {
  const { studioUser } = useAuth();
  const [packages, setPackages] = useState<PhotographyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PhotographyPackage | null>(null);
  const [seedingTemplates, setSeedingTemplates] = useState(false);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await getPackages(true);
      setPackages(data);
    } catch (err) {
      console.error("Error loading packages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleSavePackage = async (
    pkgData: Omit<PhotographyPackage, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!studioUser) return;
    if (editingPackage) {
      await updatePackage(editingPackage.id, pkgData, {
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
    } else {
      await createPackage(pkgData, {
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
    }
    await loadPackages();
  };

  const handleToggleActive = async (pkg: PhotographyPackage) => {
    if (!studioUser) return;
    await togglePackageActive(pkg.id, !pkg.active, pkg.name, {
      uid: studioUser.uid,
      displayName: studioUser.displayName,
    });
    await loadPackages();
  };

  const handleSeedTemplates = async () => {
    if (!studioUser) return;
    try {
      setSeedingTemplates(true);
      await seedStandardPackages({
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
      await loadPackages();
    } catch (err) {
      console.error("Template seed error:", err);
    } finally {
      setSeedingTemplates(false);
    }
  };

  const filtered = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.category.toLowerCase().includes(search.toLowerCase()) ||
      pkg.inclusions.some((inc) => inc.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All Categories" || pkg.category === selectedCategory;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && pkg.active) ||
      (statusFilter === "inactive" && !pkg.active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <StudioLayout>
      <div className="space-y-6 pb-12">
        {/* Header Bar */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#3D084B]" />
              <h2 className="font-serif text-2xl font-bold text-[#3D084B] tracking-tight">
                Photography Packages
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#846F7F] mt-1">
              Configure session durations, photography deliverables, pricing snapshots, and inclusions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {packages.length === 0 && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleSeedTemplates}
                isLoading={seedingTemplates}
                className="gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#3D084B]" />
                <span>Load Studio Templates (Rs. 7,999 - 31,999)</span>
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingPackage(null);
                setIsModalOpen(true);
              }}
              className="gap-1.5 shadow-subtle"
            >
              <Plus className="w-4 h-4" />
              <span>Create Package</span>
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-4 rounded-2xl shadow-subtle flex flex-col lg:flex-row items-center gap-4 justify-between">
          {/* Search */}
          <div className="flex items-center gap-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] px-3.5 py-2 rounded-xl w-full lg:w-80">
            <Search className="w-4 h-4 text-[#846F7F]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by package name or inclusions..."
              className="w-full bg-transparent text-xs text-[#332A34] placeholder-[#846F7F]/60 focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Pills */}
            <div className="flex items-center p-1 bg-[#FAF2F7]/80 rounded-xl border border-[#EBD8E1]">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-[#3D084B] text-white shadow-subtle"
                    : "text-[#846F7F] hover:text-[#3D084B]"
                }`}
              >
                All ({packages.length})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "active"
                    ? "bg-[#3D084B] text-white shadow-subtle"
                    : "text-[#846F7F] hover:text-[#3D084B]"
                }`}
              >
                Active ({packages.filter((p) => p.active).length})
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "inactive"
                    ? "bg-[#3D084B] text-white shadow-subtle"
                    : "text-[#846F7F] hover:text-[#3D084B]"
                }`}
              >
                Inactive ({packages.filter((p) => !p.active).length})
              </button>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        {loading ? (
          <Card className="p-16 text-center">
            <p className="text-xs text-[#846F7F] animate-pulse font-medium">
              Loading photography packages...
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={packages.length === 0 ? "No packages configured yet" : "No packages match your search"}
            description={
              packages.length === 0
                ? "Click 'Load Studio Templates' or 'Create Package' to set up your photography packages."
                : "Try clearing your category or status filters to view cataloged packages."
            }
            action={
              packages.length === 0
                ? {
                    label: "Load Studio Pricing Templates",
                    onClick: handleSeedTemplates,
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((pkg) => (
              <Card
                key={pkg.id}
                className={`p-6 flex flex-col justify-between hover:border-[#D6A3C7] transition-all ${
                  !pkg.active ? "opacity-75 bg-[#FAF2F7]/30" : ""
                }`}
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D084B] bg-[#FAF2F7] border border-[#EBD8E1] px-2.5 py-0.5 rounded-full">
                      {pkg.category}
                    </span>
                    <Badge
                      variant={pkg.active ? "success" : "neutral"}
                      size="sm"
                    >
                      {pkg.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Title & Price */}
                  <h3 className="font-serif text-xl font-bold text-[#3D084B] mt-3">
                    {pkg.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-serif font-bold text-[#3D084B]">
                      {formatNPR(pkg.price)}
                    </span>
                    <span className="text-xs text-[#846F7F]">
                      (Deposit: {formatNPR(pkg.depositAmount)})
                    </span>
                  </div>

                  {/* Highlights Grid */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[#332A34] pt-3 border-t border-[#EBD8E1]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#846F7F]" />
                      <span>{pkg.durationMinutes} mins duration</span>
                    </div>
                    {pkg.editedPhotosCount !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#846F7F]" />
                        <span>{pkg.editedPhotosCount} Edited Photos</span>
                      </div>
                    )}
                    {pkg.outfitChanges !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#846F7F]" />
                        <span>{pkg.outfitChanges} Outfit Setups</span>
                      </div>
                    )}
                    {pkg.familyPortraitsIncluded && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#846F7F]" />
                        <span>Family Portraits</span>
                      </div>
                    )}
                  </div>

                  {/* Inclusions List */}
                  {pkg.inclusions && pkg.inclusions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#EBD8E1] space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F]">
                        Deliverables & Inclusions:
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

                  {pkg.description && (
                    <p className="mt-3 text-xs text-[#846F7F] italic leading-relaxed">
                      "{pkg.description}"
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-6 pt-4 border-t border-[#EBD8E1] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#846F7F]">
                    Added {formatDate(pkg.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingPackage(pkg);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF2F7] hover:bg-[#F5E5EB] text-[#3D084B] font-semibold transition-colors border border-[#EBD8E1]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(pkg)}
                      title={pkg.active ? "Deactivate package" : "Activate package"}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-colors border ${
                        pkg.active
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{pkg.active ? "Deactivate" : "Activate"}</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Package Modal */}
        <PackageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePackage}
          initialPackage={editingPackage}
        />
      </div>
    </StudioLayout>
  );
}
