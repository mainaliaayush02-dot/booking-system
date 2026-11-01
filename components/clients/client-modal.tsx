"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Client, BabyGender, ChildProfile } from "@/lib/types";
import { Plus, Trash2, User, Phone, Mail, MapPin, Heart, AlertCircle } from "lucide-react";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<Client, "id" | "createdAt" | "updatedAt">) => Promise<Client | void>;
  initialClient?: Client | null;
  onClientCreated?: (newClient: Client) => void;
}

export function ClientModal({
  isOpen,
  onClose,
  onSave,
  initialClient,
  onClientCreated,
}: ClientModalProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [babyName, setBabyName] = useState("");
  const [babyDob, setBabyDob] = useState("");
  const [babyGender, setBabyGender] = useState<BabyGender>("undisclosed");
  const [notes, setNotes] = useState("");
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialClient) {
      setFullName(initialClient.fullName);
      setPhone(initialClient.phone);
      setSecondaryPhone(initialClient.secondaryPhone || "");
      setEmail(initialClient.email || "");
      setAddress(initialClient.address || "");
      setBabyName(initialClient.babyName || "");
      setBabyDob(initialClient.babyDob || "");
      setBabyGender(initialClient.babyGender || "undisclosed");
      setNotes(initialClient.notes || "");
      setChildrenList(initialClient.children || []);
    } else {
      setFullName("");
      setPhone("");
      setSecondaryPhone("");
      setEmail("");
      setAddress("");
      setBabyName("");
      setBabyDob("");
      setBabyGender("undisclosed");
      setNotes("");
      setChildrenList([]);
    }
    setError(null);
  }, [initialClient, isOpen]);

  const handleAddSibling = () => {
    setChildrenList([
      ...childrenList,
      { name: "", dob: "", gender: "undisclosed", notes: "" },
    ]);
  };

  const handleUpdateSibling = (index: number, field: keyof ChildProfile, val: any) => {
    const updated = [...childrenList];
    updated[index] = { ...updated[index], [field]: val };
    setChildrenList(updated);
  };

  const handleRemoveSibling = (index: number) => {
    setChildrenList(childrenList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter the parent/client full name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter a primary contact phone number.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload: Omit<Client, "id" | "createdAt" | "updatedAt"> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        babyName: babyName.trim() || undefined,
        babyDob: babyDob || undefined,
        babyGender,
        children: childrenList.filter((c) => c.name.trim().length > 0),
        notes: notes.trim() || undefined,
      };

      const result = await onSave(payload);
      if (result && onClientCreated) {
        onClientCreated(result);
      }
      onClose();
    } catch (err: any) {
      console.error("Save client error:", err);
      setError(err.message || "Failed to save client.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialClient ? "Edit Client Profile" : "Register New Client"}
      subtitle="Parent contact information, baby profiles, and family notes"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Section 1: Parent/Client Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3D084B] border-b border-[#EBD8E1] pb-1.5">
            <User className="w-4 h-4" />
            <span>Parent & Contact Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#332A34] mb-1">
                Parent Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Shraddha Shrestha"
                className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#332A34] mb-1">
                Primary Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#332A34] mb-1">
                Secondary / Spouse Phone (Optional)
              </label>
              <input
                type="tel"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#332A34] mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@gmail.com"
                className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#332A34] mb-1">
                Address / City (Optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Jhamsikhel, Lalitpur"
                className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Baby & Child Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3D084B] border-b border-[#EBD8E1] pb-1.5">
            <Heart className="w-4 h-4" />
            <span>Baby & Children Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#332A34] mb-1">
                Baby Name / Nickname
              </label>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="e.g. Aarav"
                className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#332A34] mb-1">
                Date of Birth (or Due Date)
              </label>
              <input
                type="date"
                value={babyDob}
                onChange={(e) => setBabyDob(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#332A34] mb-1">
                Gender / Status
              </label>
              <select
                value={babyGender}
                onChange={(e) => setBabyGender(e.target.value as BabyGender)}
                className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
              >
                <option value="undisclosed">Undisclosed</option>
                <option value="boy">Baby Boy</option>
                <option value="girl">Baby Girl</option>
                <option value="twins">Twins</option>
                <option value="expecting">Expecting (Maternity)</option>
              </select>
            </div>
          </div>

          {/* Multiple Children / Siblings Support */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#846F7F]">
                Siblings / Additional Children ({childrenList.length})
              </span>
              <button
                type="button"
                onClick={handleAddSibling}
                className="text-xs text-[#3D084B] hover:text-[#68456E] font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sibling</span>
              </button>
            </div>

            {childrenList.map((child, idx) => (
              <div
                key={idx}
                className="p-3 mb-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-2 items-center"
              >
                <input
                  type="text"
                  placeholder="Sibling name"
                  value={child.name}
                  onChange={(e) => handleUpdateSibling(idx, "name", e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#EBD8E1] rounded-xl text-xs text-[#332A34]"
                />
                <input
                  type="date"
                  value={child.dob || ""}
                  onChange={(e) => handleUpdateSibling(idx, "dob", e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#EBD8E1] rounded-xl text-xs text-[#332A34]"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={child.gender || "undisclosed"}
                    onChange={(e) => handleUpdateSibling(idx, "gender", e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-[#EBD8E1] rounded-xl text-xs text-[#332A34]"
                  >
                    <option value="undisclosed">Undisclosed</option>
                    <option value="boy">Boy</option>
                    <option value="girl">Girl</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveSibling(idx)}
                    className="p-1.5 text-[#846F7F] hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-[#332A34] mb-1">
            Studio & Family Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special requests, baby feeding schedules, allergy warnings, or reference notes..."
            className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 focus:border-[#3D084B]"
          />
        </div>

        {/* Sticky Modal Actions */}
        <div className="pt-4 border-t border-[#EBD8E1] flex items-center justify-end gap-3 sticky bottom-0 bg-[#FFFAFC] py-3.5 -mb-6 -mx-6 px-6 mt-6 shadow-card">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="cursor-pointer">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting} className="cursor-pointer shadow-subtle">
            {initialClient ? "Update Client" : "Register Client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

