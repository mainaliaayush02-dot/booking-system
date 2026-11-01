"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PhotographyPackage, PackageCategory } from "@/lib/types";
import { Plus, Trash2, Sparkles, AlertCircle } from "lucide-react";

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkgData: Omit<PhotographyPackage, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  initialPackage?: PhotographyPackage | null;
}

const CATEGORIES: PackageCategory[] = [
  "Newborn Photography",
  "Maternity Photography",
  "Baby Photography",
  "Cake Smash Photography",
  "Family Photography",
  "Couple Photography",
  "Other",
];

export function PackageModal({
  isOpen,
  onClose,
  onSave,
  initialPackage,
}: PackageModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PackageCategory>("Newborn Photography");
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState<number>(15999);
  const [depositAmount, setDepositAmount] = useState<number>(5000);
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [editedPhotosCount, setEditedPhotosCount] = useState<number>(25);
  const [outfitChanges, setOutfitChanges] = useState<number>(3);
  const [propsIncluded, setPropsIncluded] = useState<boolean>(true);
  const [familyPortraitsIncluded, setFamilyPortraitsIncluded] = useState<boolean>(true);
  const [description, setDescription] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [active, setActive] = useState<boolean>(true);
  const [inclusions, setInclusions] = useState<string[]>([
    "25 Fully Retouched High-Resolution Photographs",
    "3 Thematic Setups & Outfits Provided",
    "Parent & Sibling Portraits Included",
    "Online Private Viewing Gallery",
  ]);
  const [newInclusion, setNewInclusion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPackage) {
      setName(initialPackage.name);
      if (CATEGORIES.includes(initialPackage.category)) {
        setCategory(initialPackage.category);
        setCustomCategory("");
      } else {
        setCategory("Other");
        setCustomCategory(initialPackage.category);
      }
      setPrice(initialPackage.price);
      setDepositAmount(initialPackage.depositAmount || Math.round(initialPackage.price * 0.3));
      setDurationMinutes(initialPackage.durationMinutes || 120);
      setEditedPhotosCount(initialPackage.editedPhotosCount || 25);
      setOutfitChanges(initialPackage.outfitChanges || 2);
      setPropsIncluded(initialPackage.propsIncluded ?? true);
      setFamilyPortraitsIncluded(initialPackage.familyPortraitsIncluded ?? true);
      setDescription(initialPackage.description || "");
      setInternalNotes(initialPackage.internalNotes || "");
      setActive(initialPackage.active ?? true);
      setInclusions(initialPackage.inclusions || []);
    } else {
      // Defaults for new package
      setName("");
      setCategory("Newborn Photography");
      setCustomCategory("");
      setPrice(15999);
      setDepositAmount(5000);
      setDurationMinutes(120);
      setEditedPhotosCount(25);
      setOutfitChanges(3);
      setPropsIncluded(true);
      setFamilyPortraitsIncluded(true);
      setDescription("");
      setInternalNotes("");
      setActive(true);
      setInclusions([
        "25 Fully Retouched High-Resolution Photographs",
        "3 Thematic Setups & Outfits Provided",
        "Parent & Sibling Portraits Included",
      ]);
    }
    setError(null);
  }, [initialPackage, isOpen]);

  const handleAddInclusion = () => {
    if (!newInclusion.trim()) return;
    setInclusions([...inclusions, newInclusion.trim()]);
    setNewInclusion("");
  };

  const handleRemoveInclusion = (index: number) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a package name.");
      return;
    }
    if (price <= 0) {
      setError("Please enter a valid package price.");
      return;
    }

    const finalCategory = category === "Other" && customCategory.trim() ? customCategory.trim() : category;

    setError(null);
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        category: finalCategory,
        price: Number(price),
        depositAmount: Number(depositAmount) || 0,
        durationMinutes: Number(durationMinutes) || 60,
        editedPhotosCount: Number(editedPhotosCount) || 0,
        outfitChanges: Number(outfitChanges) || 0,
        propsIncluded,
        familyPortraitsIncluded,
        inclusions,
        description: description.trim(),
        internalNotes: internalNotes.trim(),
        active,
      });
      onClose();
    } catch (err: any) {
      console.error("Save package error:", err);
      setError(err.message || "Failed to save photography package.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialPackage ? "Edit Photography Package" : "Create Photography Package"}
      subtitle="Configure studio package pricing, session details, and client deliverables"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Snapshot Preservation Notice */}
        <div className="bg-[#FAF2F7] border border-[#EBD8E1] p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-[#3D084B]">
          <Sparkles className="w-4 h-4 shrink-0 text-[#3D084B] mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-bold">Historical Price Protection:</strong> Changes made here will only apply to new bookings. Previously created bookings preserve their original contracted price and deliverables.
          </p>
        </div>

        {/* General Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1.5">
              Package Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Newborn Signature Collection"
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1.5">
              Photography Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PackageCategory)}
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {category === "Other" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1.5">
                Custom Category Name
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Milestone Portraits"
                className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1.5">
              Package Price (NPR) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-[#846F7F]">
                Rs.
              </span>
              <input
                type="number"
                required
                min={0}
                step={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm font-bold text-[#3D084B] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1.5">
              Minimum Advance Deposit (NPR)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-[#846F7F]">
                Rs.
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1.5">
              Session Duration (Minutes)
            </label>
            <input
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              placeholder="120"
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1.5">
              Edited Photos Count
            </label>
            <input
              type="number"
              min={0}
              value={editedPhotosCount}
              onChange={(e) => setEditedPhotosCount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1.5">
              Outfit Changes
            </label>
            <input
              type="number"
              min={0}
              value={outfitChanges}
              onChange={(e) => setOutfitChanges(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
            />
          </div>
        </div>

        {/* Feature Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-2xl">
          <label className="flex items-center gap-2.5 text-xs text-[#332A34] font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={propsIncluded}
              onChange={(e) => setPropsIncluded(e.target.checked)}
              className="w-4 h-4 rounded text-[#3D084B] focus:ring-[#3D084B]"
            />
            <span>Props & Setups Included</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-[#332A34] font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={familyPortraitsIncluded}
              onChange={(e) => setFamilyPortraitsIncluded(e.target.checked)}
              className="w-4 h-4 rounded text-[#3D084B] focus:ring-[#3D084B]"
            />
            <span>Family & Sibling Portraits</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-[#332A34] font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#3D084B] focus:ring-[#3D084B]"
            />
            <span>Active for New Bookings</span>
          </label>
        </div>

        {/* Dynamic Package Inclusions */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-2">
            Package Deliverables & Inclusions
          </label>
          <div className="space-y-2 mb-3">
            {inclusions.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EBD8E1] text-xs text-[#332A34]"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInclusion(idx)}
                  className="p-1 text-[#846F7F] hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddInclusion();
                }
              }}
              placeholder="Add inclusion (e.g. 10x10 Flush-mount Album)..."
              className="flex-1 px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddInclusion}
              className="gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </Button>
          </div>
        </div>

        {/* Descriptions & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1">
              Public Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of experience shown to parents..."
              className="w-full px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#332A34] mb-1">
              Internal Studio Notes
            </label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Staff guidance on lighting, gear, setup time..."
              className="w-full px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[#EBD8E1] flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting}>
            {initialPackage ? "Save Changes" : "Create Package"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
