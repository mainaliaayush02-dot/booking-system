"use client";

import React, { useEffect, useState, useMemo } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import {
  UserPlus,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { getLeads, createLead, updateLead, deleteLead } from "@/lib/firestore";
import { Lead } from "@/lib/types";
import { useAuth } from "@/lib/firebase-auth";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

export default function LeadsPage() {
  const router = useRouter();
  const { studioUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "contacted" | "booked" | "lost">("all");

  // Create lead modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [babyDueDate, setBabyDueDate] = useState("");
  const [category, setCategory] = useState("Newborn Photography");
  const [packageName, setPackageName] = useState("Newborn Signature Collection");
  const [urgency, setUrgency] = useState<"high" | "medium" | "low">("high");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getLeads();
      setLeads(data);
    } catch (err) {
      console.error("Error loading leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = search.toLowerCase();
      const matchesSearch =
        lead.clientName.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.category.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !phone || !studioUser) return;
    try {
      setSubmitting(true);
      await createLead(
        {
          clientName,
          phone,
          email,
          babyDueDate,
          category,
          packageName,
          status: "new",
          urgency,
          notes,
        },
        { uid: studioUser.uid, displayName: studioUser.displayName }
      );
      setIsModalOpen(false);
      setClientName("");
      setPhone("");
      setEmail("");
      setBabyDueDate("");
      setNotes("");
      await loadData();
    } catch (err) {
      console.error("Error creating lead:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, status: Lead["status"]) => {
    if (!studioUser) return;
    try {
      await updateLead(leadId, { status }, { uid: studioUser.uid, displayName: studioUser.displayName });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    } catch (err) {
      console.error("Error updating lead status:", err);
    }
  };

  const handleConvertToBooking = (lead: Lead) => {
    // Navigate to calendar with query param to open booking modal
    router.push(`/calendar?newBooking=true&clientName=${encodeURIComponent(lead.clientName)}&phone=${encodeURIComponent(lead.phone)}`);
  };

  return (
    <StudioLayout>
      <div className="space-y-5 pb-16 max-w-4xl mx-auto">
        {/* Top Header Card */}
        <div className="bg-white border border-[#E8EBF0] p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#D9272E]" />
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#252B38]">
                Client Leads & Inquiries
              </h2>
            </div>
            <p className="text-xs text-[#8993A4] mt-0.5">
              Inquiry pipeline, expected baby due dates & conversion to sessions.
            </p>
          </div>

          <Button
            variant="action"
            size="md"
            onClick={() => setIsModalOpen(true)}
            className="gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-[#E8EBF0] p-3 sm:p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl overflow-x-auto w-full sm:w-auto">
            {(["all", "new", "contacted", "booked", "lost"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer shrink-0 ${
                  statusFilter === s
                    ? "bg-[#D9272E] text-white shadow-subtle"
                    : "text-[#8993A4] hover:text-[#252B38]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E8EBF0] px-3.5 py-1.5 rounded-xl w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8993A4] shrink-0" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-[#252B38] placeholder-[#8993A4] focus:outline-none"
            />
          </div>
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="p-16 text-center bg-white border border-[#E8EBF0] rounded-3xl text-xs text-[#8993A4] animate-pulse">
            Loading leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-16 text-center bg-white border border-[#E8EBF0] rounded-3xl">
            <UserPlus className="w-8 h-8 text-[#8993A4] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-[#252B38]">No leads matching your filter</p>
            <p className="text-xs text-[#8993A4] mt-1">
              Add parent inquiries to keep track of upcoming newborns.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white border border-[#E8EBF0] hover:border-[#D9272E] rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D084B] bg-[#FCEEEF] px-2.5 py-0.5 rounded-md">
                      {lead.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        lead.status === "new"
                          ? "bg-rose-50 text-rose-700"
                          : lead.status === "contacted"
                          ? "bg-amber-50 text-amber-700"
                          : lead.status === "booked"
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <h3 className="font-sans text-base font-bold text-[#252B38] mt-2.5">
                    {lead.clientName}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-[#8993A4]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#252B38]" />
                      <a href={`tel:${lead.phone}`} className="text-[#252B38] font-semibold hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                    {lead.babyDueDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8993A4]" />
                        <span>Due Date: {lead.babyDueDate}</span>
                      </div>
                    )}
                    {lead.packageName && (
                      <p className="text-[11px] text-[#3D084B] font-medium pt-1">
                        Interested: {lead.packageName}
                      </p>
                    )}
                  </div>

                  {lead.notes && (
                    <p className="mt-2.5 p-2 rounded-xl bg-[#F8FAFC] text-[11px] text-[#252B38] leading-relaxed italic border border-[#E8EBF0]">
                      "{lead.notes}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-[#E8EBF0] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {lead.status !== "booked" && (
                      <button
                        onClick={() => handleUpdateStatus(lead.id, "contacted")}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#F8FAFC] hover:bg-[#E8EBF0] text-[#252B38] cursor-pointer"
                      >
                        Contacted
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleConvertToBooking(lead)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D9272E] text-white text-xs font-semibold hover:bg-[#C21F25] active:scale-95 transition-all shadow-subtle cursor-pointer"
                  >
                    <span>Book Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Lead Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Client Lead / Inquiry" maxWidth="md">
          <form onSubmit={handleCreateLead} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                Parent / Client Name *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Sabina Oli"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                  Phone Number *
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                  Expected Due Date
                </label>
                <input
                  type="date"
                  value={babyDueDate}
                  onChange={(e) => setBabyDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                Photography Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] focus:outline-none"
              >
                <option value="Newborn Photography">Newborn Photography</option>
                <option value="Maternity Photography">Maternity Photography</option>
                <option value="Baby Photography">Baby Photography</option>
                <option value="Cake Smash Photography">Cake Smash Photography</option>
                <option value="Family Photography">Family Photography</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#252B38] mb-1">
                Internal Notes / Details
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Hospital location, twin birth, preferred themes..."
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-[#E8EBF0] flex items-center justify-end gap-2.5">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="action" isLoading={submitting}>
                Save Lead
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </StudioLayout>
  );
}
