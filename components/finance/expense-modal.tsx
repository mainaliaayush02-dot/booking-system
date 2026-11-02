"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StudioExpense, ExpenseCategory, PaymentMethod } from "@/lib/types";
import { createExpenseWithAudit, updateExpenseWithAudit } from "@/lib/firestore";
import { useAuth } from "@/lib/firebase-auth";
import { getTodayNepal } from "@/lib/utils";
import { Receipt, AlertCircle, Edit3, Plus } from "lucide-react";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialExpense?: StudioExpense | null;
}

export const EXPENSE_CATEGORIES: { label: string; value: ExpenseCategory }[] = [
  { label: "Studio Rent & Lease", value: "studio_rent" },
  { label: "Electricity, Water & Internet", value: "utilities" },
  { label: "Cameras, Lighting & Tech", value: "equipment" },
  { label: "Lenses, Memory Cards & Batteries", value: "camera_accessories" },
  { label: "Backdrops, Newborn Wraps & Props", value: "props_costumes" },
  { label: "Sanitizers, Heaters & Baby Hygiene", value: "baby_supplies" },
  { label: "Staff & Assistant Salaries", value: "salary" },
  { label: "Social Media Ads & Promotion", value: "marketing" },
  { label: "Travel & Outdoor Shoots", value: "transportation" },
  { label: "Studio Cleaning, Repairs & Care", value: "maintenance" },
  { label: "Cloud, Editing & Software Subscriptions", value: "software_subscriptions" },
  { label: "Photo Printing, Framing & Albums", value: "printing_framing" },
  { label: "Client Refreshments & Hospitality", value: "refreshments" },
  { label: "Miscellaneous Studio Overhead", value: "other" },
];

export function ExpenseModal({ isOpen, onClose, onSuccess, initialExpense }: ExpenseModalProps) {
  const { studioUser } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("props_costumes");
  const [amount, setAmount] = useState<number | "">("");
  const [expenseDate, setExpenseDate] = useState(getTodayNepal());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [paidTo, setPaidTo] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initialExpense);

  useEffect(() => {
    if (isOpen) {
      if (initialExpense) {
        setTitle(initialExpense.title || "");
        setCategory(initialExpense.category || "props_costumes");
        setAmount(initialExpense.amount || "");
        setExpenseDate(initialExpense.expenseDate || getTodayNepal());
        setPaymentMethod(initialExpense.paymentMethod || "bank_transfer");
        setPaidTo(initialExpense.paidTo || initialExpense.vendor || "");
        setReferenceNumber(initialExpense.referenceNumber || "");
        setNotes(initialExpense.notes || "");
      } else {
        setTitle("");
        setCategory("props_costumes");
        setAmount("");
        setExpenseDate(getTodayNepal());
        setPaymentMethod("bank_transfer");
        setPaidTo("");
        setReferenceNumber("");
        setNotes("");
      }
      setError(null);
    }
  }, [isOpen, initialExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioUser) return;
    if (!title.trim()) {
      setError("Please enter a title or item description for this expense.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid expense amount greater than zero.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing && initialExpense) {
        await updateExpenseWithAudit(
          initialExpense.id,
          {
            title: title.trim(),
            category,
            amount: Number(amount),
            expenseDate,
            paymentMethod,
            paidTo: paidTo.trim() || undefined,
            vendor: paidTo.trim() || undefined,
            referenceNumber: referenceNumber.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          {
            uid: studioUser.uid,
            displayName: studioUser.displayName,
          }
        );
      } else {
        await createExpenseWithAudit(
          {
            title: title.trim(),
            category,
            amount: Number(amount),
            expenseDate,
            paymentMethod,
            paidTo: paidTo.trim() || undefined,
            vendor: paidTo.trim() || undefined,
            referenceNumber: referenceNumber.trim() || undefined,
            notes: notes.trim() || undefined,
            recordedByUid: studioUser.uid,
            recordedByName: studioUser.displayName,
          },
          {
            uid: studioUser.uid,
            displayName: studioUser.displayName,
          }
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error saving expense:", err);
      setError(err?.message || "Failed to save studio expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Studio Expense" : "Log Studio Expense"}
      subtitle={
        isEditing
          ? "Update recorded overhead item, vendor, or financial category."
          : "Record studio rent, prop purchases, utilities, and photography overhead."
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Expense Title */}
        <div>
          <label className="block text-xs font-bold text-[#3D084B] mb-1">
            Expense Description / Item *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Newborn knit wrap props & wooden basket"
            className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
          />
        </div>

        {/* Category & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#3D084B] mb-1">
              Expense Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3D084B] mb-1">
              Amount Spent (NPR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#846F7F]">
                Rs.
              </span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="2500"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] font-semibold focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
              />
            </div>
          </div>
        </div>

        {/* Date & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#3D084B] mb-1">
              Expense Date *
            </label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3D084B] mb-1">
              Paid Via Channel
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
            >
              <option value="bank_transfer">Direct Bank Transfer / Fonepay</option>
              <option value="esewa">eSewa Wallet</option>
              <option value="khalti">Khalti Wallet</option>
              <option value="cash">Studio Cash</option>
              <option value="other">POS Card / Other</option>
            </select>
          </div>
        </div>

        {/* Paid To / Vendor & Reference Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#3D084B] mb-1">
              Vendor / Paid To
            </label>
            <input
              type="text"
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              placeholder="e.g. Kathmandu Handicrafts / Prop Supplier"
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3D084B] mb-1">
              Invoice / Ref Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. INV-2026-901 or Bill #"
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-[#3D084B] mb-1">
            Notes / Item Specifications
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Invoice remarks, item details, or warranty notes..."
            className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
          />
        </div>

        <div className="pt-3 border-t border-[#EBD8E1] flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? "Save Expense Changes" : "Log Studio Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
