"use client";

import React, { useEffect, useState } from "react";
import { StudioLayout } from "@/components/layout/studio-layout";
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Search,
  Eye,
  Edit2,
  Calendar,
  Heart,
} from "lucide-react";
import { getClients, createClient, updateClient } from "@/lib/firestore";
import { Client } from "@/lib/types";
import { formatDate, formatNPR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientModal } from "@/components/clients/client-modal";
import { ClientDetailModal } from "@/components/clients/client-detail-modal";
import { useAuth } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";

export default function ClientsPage() {
  const router = useRouter();
  const { studioUser } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSaveClient = async (
    clientData: Omit<Client, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!studioUser) return;
    if (editingClient) {
      await updateClient(editingClient.id, clientData, {
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
    } else {
      await createClient(clientData, {
        uid: studioUser.uid,
        displayName: studioUser.displayName,
      });
    }
    await loadClients();
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchesName = c.fullName.toLowerCase().includes(q);
    const matchesPhone = c.phone.includes(q) || (c.secondaryPhone && c.secondaryPhone.includes(q));
    const matchesBaby = c.babyName && c.babyName.toLowerCase().includes(q);
    const matchesSiblings = c.children?.some((child) => child.name.toLowerCase().includes(q));
    return matchesName || matchesPhone || matchesBaby || matchesSiblings;
  });

  return (
    <StudioLayout>
      <div className="space-y-6 pb-12">
        {/* Header Bar */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#3D084B]" />
              <h2 className="font-serif text-2xl font-bold text-[#3D084B] tracking-tight">
                Client Directory
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#846F7F] mt-1">
              Registered families, parent contacts, baby profiles, and historical photography sessions.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingClient(null);
              setIsModalOpen(true);
            }}
            className="gap-1.5 shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Client</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-[#FFFAFC] border border-[#EBD8E1] p-4 rounded-2xl shadow-subtle flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="flex items-center gap-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] px-4 py-2.5 rounded-xl w-full sm:max-w-md">
            <Search className="w-4 h-4 text-[#846F7F]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by parent name, phone number, or baby name..."
              className="w-full bg-transparent text-xs text-[#332A34] placeholder-[#846F7F]/60 focus:outline-none"
            />
          </div>

          <div className="text-xs text-[#846F7F] font-semibold">
            <span>Showing {filtered.length} of {clients.length} Clients</span>
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <Card className="p-16 text-center">
            <p className="text-xs text-[#846F7F] animate-pulse font-medium">
              Loading client directory...
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={clients.length === 0 ? "No clients registered yet" : "No clients match your search"}
            description={
              clients.length === 0
                ? "Click 'Register New Client' to add parents and their baby profiles."
                : "Try searching with a different client name or phone number."
            }
            action={
              clients.length === 0
                ? {
                    label: "Register First Client",
                    onClick: () => {
                      setEditingClient(null);
                      setIsModalOpen(true);
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((client) => (
              <Card
                key={client.id}
                className="p-5 flex flex-col justify-between hover:border-[#D6A3C7] transition-all cursor-pointer group"
                onClick={() => setViewingClient(client)}
              >
                <div>
                  {/* Top: Name & Bookings Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif text-base font-bold text-[#3D084B] group-hover:text-[#68456E] transition-colors">
                        {client.fullName}
                      </h4>
                      {client.babyName ? (
                        <p className="text-xs text-[#68456E] font-semibold mt-0.5 flex items-center gap-1">
                          <Heart className="w-3 h-3 text-[#3D084B]" />
                          <span>Baby: {client.babyName}</span>
                          {client.babyDob && (
                            <span className="text-[11px] text-[#846F7F] font-normal">
                              ({formatDate(client.babyDob)})
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs text-[#846F7F] mt-0.5 italic">Baby profile pending</p>
                      )}
                    </div>

                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF2F7] text-[#3D084B] border border-[#EBD8E1] shrink-0">
                      {client.totalBookings || 0} Sessions
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1.5 text-xs text-[#332A34] pt-3 border-t border-[#EBD8E1]">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#846F7F]" />
                      <span className="font-medium">{client.phone}</span>
                      {client.secondaryPhone && (
                        <span className="text-[#846F7F] text-[11px]">/ {client.secondaryPhone}</span>
                      )}
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#846F7F]" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#846F7F]" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Children / Siblings pill */}
                  {client.children && client.children.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[#846F7F] font-semibold">Siblings:</span>
                      {client.children.map((ch, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF2F7] border border-[#EBD8E1] text-[#332A34]"
                        >
                          {ch.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-[#EBD8E1] flex items-center justify-between text-[11px] text-[#846F7F]">
                  <span>Registered {formatDate(client.createdAt)}</span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewingClient(client)}
                      title="View Client Details"
                      className="p-1.5 rounded-lg bg-[#FAF2F7] hover:bg-[#F5E5EB] text-[#3D084B] border border-[#EBD8E1]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingClient(client);
                        setIsModalOpen(true);
                      }}
                      title="Edit Client"
                      className="p-1.5 rounded-lg bg-[#FAF2F7] hover:bg-[#F5E5EB] text-[#3D084B] border border-[#EBD8E1]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Client Modal */}
        <ClientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveClient}
          initialClient={editingClient}
        />

        {/* Client Detail Modal */}
        <ClientDetailModal
          isOpen={Boolean(viewingClient)}
          onClose={() => setViewingClient(null)}
          client={viewingClient}
          onEdit={(c) => {
            setViewingClient(null);
            setEditingClient(c);
            setIsModalOpen(true);
          }}
          onCreateBooking={(c) => {
            router.push(`/calendar?newBooking=true&clientId=${c.id}`);
          }}
        />
      </div>
    </StudioLayout>
  );
}
