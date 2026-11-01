"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Client, Booking } from "@/lib/types";
import { getClientBookings } from "@/lib/firestore";
import { formatNPR, formatDate, formatTime12h, getStatusBadgeStyle } from "@/lib/utils";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  Calendar,
  Clock,
  Edit2,
  PlusCircle,
  FileText,
} from "lucide-react";

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit: (client: Client) => void;
  onCreateBooking?: (client: Client) => void;
}

export function ClientDetailModal({
  isOpen,
  onClose,
  client,
  onEdit,
  onCreateBooking,
}: ClientDetailModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    async function loadBookings() {
      if (!client) return;
      try {
        setLoadingBookings(true);
        const bList = await getClientBookings(client.id);
        setBookings(bList);
      } catch (err) {
        console.error("Error fetching client bookings:", err);
      } finally {
        setLoadingBookings(false);
      }
    }

    if (isOpen && client) {
      loadBookings();
    }
  }, [isOpen, client]);

  if (!client) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client.fullName}
      subtitle={`Client ID: ${client.id} • Registered ${formatDate(client.createdAt)}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Header Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
              Total Bookings
            </span>
            <p className="text-xl font-serif font-bold text-[#3D084B] mt-1">
              {bookings.length || client.totalBookings || 0} Sessions
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
              Total Booking Value
            </span>
            <p className="text-xl font-serif font-bold text-[#3D084B] mt-1">
              {formatNPR(
                bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) || client.totalSpent || 0
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
              Primary Contact
            </span>
            <p className="text-sm font-bold text-[#332A34] mt-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#3D084B]" />
              <span>{client.phone}</span>
            </p>
          </div>
        </div>

        {/* Parent & Family Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-white border border-[#EBD8E1]">
          {/* Left: Parent Info */}
          <div className="space-y-2.5 text-xs text-[#332A34]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#3D084B] border-b border-[#EBD8E1] pb-1">
              <User className="w-3.5 h-3.5" />
              <span>Parent Information</span>
            </div>
            <div>
              <span className="text-[#846F7F] block">Primary Phone:</span>
              <span className="font-semibold">{client.phone}</span>
            </div>
            {client.secondaryPhone && (
              <div>
                <span className="text-[#846F7F] block">Secondary Phone:</span>
                <span className="font-semibold">{client.secondaryPhone}</span>
              </div>
            )}
            {client.email && (
              <div>
                <span className="text-[#846F7F] block">Email Address:</span>
                <span className="font-semibold">{client.email}</span>
              </div>
            )}
            {client.address && (
              <div>
                <span className="text-[#846F7F] block">Studio Address:</span>
                <span className="font-semibold">{client.address}</span>
              </div>
            )}
          </div>

          {/* Right: Baby & Children Info */}
          <div className="space-y-2.5 text-xs text-[#332A34]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#3D084B] border-b border-[#EBD8E1] pb-1">
              <Heart className="w-3.5 h-3.5" />
              <span>Baby & Children Profiles</span>
            </div>
            {client.babyName ? (
              <div>
                <span className="text-[#846F7F] block">Baby Name:</span>
                <span className="font-bold text-[#3D084B] text-sm">
                  {client.babyName} ({client.babyGender || "baby"})
                </span>
                {client.babyDob && (
                  <p className="text-[11px] text-[#846F7F] mt-0.5">
                    DOB / Due Date: {formatDate(client.babyDob)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[#846F7F] italic">No baby profile specified</p>
            )}

            {client.children && client.children.length > 0 && (
              <div className="pt-2 border-t border-[#EBD8E1]">
                <span className="text-[#846F7F] font-bold block mb-1">Siblings:</span>
                <ul className="space-y-1">
                  {client.children.map((child, i) => (
                    <li key={i} className="text-[11px] text-[#332A34] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3D084B]" />
                      <span>{child.name}</span>
                      {child.dob && <span className="text-[#846F7F]">({formatDate(child.dob)})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Client Notes */}
        {client.notes && (
          <div className="p-4 rounded-2xl bg-[#FAF2F7]/50 border border-[#EBD8E1] text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider text-[#3D084B] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Studio & Care Notes:</span>
            </span>
            <p className="text-[#332A34] leading-relaxed italic">{client.notes}</p>
          </div>
        )}

        {/* Client Booking History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3D084B]" />
              <h4 className="font-serif text-base font-bold text-[#3D084B]">
                Photography Booking History
              </h4>
            </div>
            {onCreateBooking && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onCreateBooking(client);
                }}
                className="gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Session for Client</span>
              </Button>
            )}
          </div>

          {loadingBookings ? (
            <p className="text-xs text-[#846F7F] py-6 text-center animate-pulse">
              Loading session history...
            </p>
          ) : bookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-[#EBD8E1] text-center text-xs text-[#846F7F]">
              No bookings recorded for this client yet.
            </div>
          ) : (
            <div className="rounded-2xl border border-[#EBD8E1] overflow-hidden bg-white divide-y divide-[#EBD8E1]">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#FAF2F7]/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#332A34]">
                        {booking.bookingNumber}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#846F7F] mt-1 flex items-center gap-3">
                      <span className="font-semibold text-[#3D084B]">{booking.packageName}</span>
                      <span>•</span>
                      <span>{formatDate(booking.appointmentDate)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#846F7F]" />
                        {formatTime12h(booking.startTime)} - {formatTime12h(booking.endTime)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-[#3D084B] font-serif block">
                      {formatNPR(booking.totalAmount)}
                    </span>
                    {booking.remainingBalance > 0 ? (
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Due: {formatNPR(booking.remainingBalance)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Paid
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#EBD8E1] flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(client);
            }}
            className="gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </Button>

          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

