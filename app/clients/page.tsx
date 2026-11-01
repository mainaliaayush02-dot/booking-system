"use client";

import React, { useEffect, useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Users, Phone, Mail, MapPin, Sparkles, Search } from "lucide-react";
import { getClients } from "@/lib/firestore";
import { Client } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

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
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#3D084B]" />
              <h2 className="font-serif text-2xl font-bold text-[#3D084B]">
                Client Directory
              </h2>
            </div>
            <p className="text-sm text-[#846F7F] mt-1">
              Parents, baby profiles, contact details, and session histories.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FAF2F7] border border-[#EBD8E1] text-[#3D084B]">
            <Sparkles className="w-3.5 h-3.5 text-[#3D084B]" />
            Phase 2 Module
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 bg-[#FFFAFC] border border-[#EBD8E1] px-4 py-3 rounded-2xl shadow-subtle">
          <Search className="w-4 h-4 text-[#846F7F]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name, phone number, or baby name..."
            className="w-full bg-transparent text-sm text-[#332A34] placeholder-[#846F7F]/60 focus:outline-none"
          />
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <p className="text-xs text-[#846F7F] animate-pulse">Loading clients...</p>
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients found"
            description="Client records are created alongside bookings and can also be managed directly in Phase 2."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <Card
                key={client.id}
                className="p-5 hover:border-[#D6A3C7] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-[#332A34]">{client.fullName}</h4>
                    {client.babyName && (
                      <p className="text-xs text-[#3D084B] font-semibold mt-0.5">
                        Baby: {client.babyName} ({client.babyGender || "baby"})
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF2F7] text-[#3D084B] border border-[#EBD8E1]">
                    {client.totalBookings || 0} Bookings
                  </span>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-[#332A34]">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#846F7F]" />
                    <span>{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#846F7F]" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#846F7F]" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-[#EBD8E1] flex items-center justify-between text-[11px] text-[#846F7F]">
                  <span>Joined {formatDate(client.createdAt)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudioLayout>
  );
}
