"use client";

import React, { useEffect, useState, useMemo } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import {
  Heart,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Phone,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import { getFollowUps, createFollowUp, toggleFollowUpComplete } from "@/lib/firestore";
import { FollowUp } from "@/lib/types";
import { useAuth } from "@/lib/firebase-auth";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export default function FollowUpsPage() {
  const { studioUser } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("pending");
  const [search, setSearch] = useState("");

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState<FollowUp["type"]>("prep_guide");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getFollowUps();
      setFollowUps(data);
    } catch (err) {
      console.error("Error loading follow-ups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return followUps.filter((f) => {
      const q = search.toLowerCase();
      const matchesSearch =
        f.title.toLowerCase().includes(q) ||
        f.clientName.toLowerCase().includes(q) ||
        f.phone.includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && !f.completed) ||
        (statusFilter === "completed" && f.completed);

      return matchesSearch && matchesStatus;
    });
  }, [followUps, search, statusFilter]);

  const handleToggle = async (f: FollowUp) => {
    if (!studioUser) return;
    try {
      const newCompleted = !f.completed;
      await toggleFollowUpComplete(f.id, newCompleted, {
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
      setFollowUps((prev) =>
        prev.map((item) => (item.id === f.id ? { ...item, completed: newCompleted } : item))
      );
    } catch (err) {
      console.error("Error toggling follow-up:", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientName || !phone || !studioUser) return;
    try {
      setSubmitting(true);
      await createFollowUp(
        {
          title,
          clientName,
          phone,
          type,
          dueDate: dueDate || new Date().toISOString().slice(0, 10),
          completed: false,
          notes,
        },
        { uid: studioUser.uid, displayName: studioUser.displayName }
      );
      setIsModalOpen(false);
      setTitle("");
      setClientName("");
      setPhone("");
      setDueDate("");
      setNotes("");
      await loadData();
    } catch (err) {
      console.error("Error creating follow-up:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudioLayout>
      <div className="space-y-5 pb-16 max-w-4xl mx-auto">
        {/* Header Bar */}
        <div className="bg-white border border-[#E8EBF0] p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#D9272E]" />
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#252B38]">
                Studio Follow-ups
              </h2>
            </div>
            <p className="text-xs text-[#8993A4] mt-0.5">
              Client care, gallery delivery reminders & session prep calls.
            </p>
          </div>

          <Button
            variant="action"
            size="md"
            onClick={() => setIsModalOpen(true)}
            className="gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Follow-up</span>
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-[#E8EBF0] p-3 sm:p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-[#D9272E] text-white shadow-subtle"
                  : "text-[#8993A4] hover:text-[#252B38]"
              }`}
            >
              Pending ({followUps.filter((f) => !f.completed).length})
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "completed"
                  ? "bg-[#D9272E] text-white shadow-subtle"
                  : "text-[#8993A4] hover:text-[#252B38]"
              }`}
            >
              Completed ({followUps.filter((f) => f.completed).length})
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-[#D9272E] text-white shadow-subtle"
                  : "text-[#8993A4] hover:text-[#252B38]"
              }`}
            >
              All ({followUps.length})
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E8EBF0] px-3.5 py-1.5 rounded-xl w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8993A4] shrink-0" />
            <input
              type="text"
              placeholder="Search follow-ups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-[#252B38] placeholder-[#8993A4] focus:outline-none"
            />
          </div>
        </div>

        {/* Follow-up Items */}
        {loading ? (
          <div className="p-16 text-center bg-white border border-[#E8EBF0] rounded-3xl text-xs text-[#8993A4] animate-pulse">
            Loading follow-up tasks...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center bg-white border border-[#E8EBF0] rounded-3xl">
            <Heart className="w-8 h-8 text-[#8993A4] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-[#252B38]">No follow-up tasks</p>
            <p className="text-xs text-[#8993A4] mt-1">
              Add follow-ups to ensure high-touch newborn parent satisfaction.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((f) => (
              <div
                key={f.id}
                onClick={() => handleToggle(f)}
                className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm transition-all flex items-start justify-between gap-4 cursor-pointer hover:border-[#D9272E] ${
                  f.completed ? "opacity-60 bg-[#F8FAFC]/50 border-[#E8EBF0]" : "border-[#E8EBF0]"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(f);
                    }}
                    className="mt-0.5 text-[#D9272E] shrink-0 cursor-pointer"
                  >
                    {f.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#8993A4] hover:text-[#D9272E]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <h4
                      className={`font-sans text-sm sm:text-base font-bold text-[#252B38] ${
                        f.completed ? "line-through text-[#8993A4]" : ""
                      }`}
                    >
                      {f.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#8993A4]">
                      <span className="font-semibold text-[#252B38]">{f.clientName}</span>
                      <a
                        href={`tel:${f.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline flex items-center gap-1 text-[#D9272E] font-medium"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{f.phone}</span>
                      </a>
                      {f.dueDate && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {f.dueDate}</span>
                        </span>
                      )}
                    </div>

                    {f.notes && (
                      <p className="mt-2 text-xs text-[#8993A4] leading-relaxed italic">
                        "{f.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                    f.type === "gallery_delivery"
                      ? "bg-purple-50 text-purple-700"
                      : f.type === "prep_guide"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-[#FCEEEF] text-[#D9272E]"
                  }`}
                >
                  {f.type.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Create Follow-up Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Client Follow-up" maxWidth="md">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                Follow-up Title / Task *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Call for 7-day newborn prep guidance"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Parent full name"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                  Follow-up Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] focus:outline-none"
                >
                  <option value="prep_guide">Newborn Prep Call</option>
                  <option value="gallery_delivery">Gallery Delivery Reminder</option>
                  <option value="due_date_checkin">Baby Due Date Check-in</option>
                  <option value="balance_payment">Balance Settlement</option>
                  <option value="other">General Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details for staff when making this follow-up..."
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-[#E8EBF0] flex items-center justify-end gap-2.5">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="action" isLoading={submitting}>
                Save Follow-up
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </StudioLayout>
  );
}
