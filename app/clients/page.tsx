"use client";

import React, { useEffect, useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Users, Plus, Phone, Mail, MapPin, Sparkles, Search } from "lucide-react";
import { getClients } from "@/lib/firestore";
import { Client } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const data = await getClients();
        setClients(data);
      } catch (err) {
        console.error("Error fetching clients:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.babyName && c.babyName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <StudioLayout>
      <div className="space-y-6">
        <div className="bg-white border border-[#EFE8DC] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-studio-600" />
              <h2 className="font-serif text-2xl font-semibold text-charcoal-900">
                Client Directory
              </h2>
            </div>
            <p className="text-sm text-charcoal-500 mt-1">
              Parents, baby profiles, contact details, and session histories.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-studio-50 border border-studio-200 text-studio-800">
              <Sparkles className="w-3.5 h-3.5 text-studio-600" />
              Phase 2 Module
            </span>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 bg-white border border-[#EFE8DC] px-4 py-2.5 rounded-xl shadow-subtle">
          <Search className="w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name, phone number, or baby name..."
            className="w-full bg-transparent text-sm text-charcoal-900 placeholder-charcoal-400 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="bg-white border border-[#EFE8DC] rounded-2xl p-12 text-center">
            <p className="text-xs text-charcoal-400 animate-pulse">Loading clients...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#EFE8DC] rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-cream-100 text-studio-600 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-serif font-semibold text-charcoal-800">
              No clients found
            </h4>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              Client records are created alongside bookings and can also be managed directly in Phase 2.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <div
                key={client.id}
                className="bg-white border border-[#EFE8DC] p-5 rounded-xl shadow-subtle hover:border-studio-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-charcoal-900">{client.fullName}</h4>
                    {client.babyName && (
                      <p className="text-xs text-studio-700 font-medium mt-0.5">
                        Baby: {client.babyName} ({client.babyGender || "baby"})
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-cream-100 text-charcoal-600 border border-cream-200">
                    {client.totalBookings || 0} Bookings
                  </span>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-charcoal-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-charcoal-400" />
                    <span>{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-cream-100 flex items-center justify-between text-[11px] text-charcoal-400">
                  <span>Joined {formatDate(client.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudioLayout>
  );
}
