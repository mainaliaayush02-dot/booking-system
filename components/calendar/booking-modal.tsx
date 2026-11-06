"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Booking,
  Client,
  PhotographyPackage,
  PackageCategory,
  BookingStatus,
} from "@/lib/types";
import {
  getClients,
  getPackages,
  createBooking,
  updateBooking,
  detectBookingConflicts,
  createClient,
} from "@/lib/firestore";
import { formatNPR, formatTime12h, getTodayNepal } from "@/lib/utils";
import {
  User,
  Camera,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  AlertTriangle,
  Plus,
  Search,
  Check,
  ShieldAlert,
} from "lucide-react";
import { ClientModal } from "@/components/clients/client-modal";
import { useAuth } from "@/lib/firebase-auth";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  initialDate?: string;
  initialTime?: string;
  initialClientId?: string;
  editingBooking?: Booking | null;
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

export function BookingModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialTime,
  initialClientId,
  editingBooking,
}: BookingModalProps) {
  const { studioUser, isAdmin } = useAuth();

  // Reference data
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<PhotographyPackage[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Section A: Client Information
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Section B: Photography Details
  const [category, setCategory] = useState<PackageCategory>("Newborn Photography");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [customPackageName, setCustomPackageName] = useState("");
  const [packagePrice, setPackagePrice] = useState<number>(15999);
  const [customAgreedPrice, setCustomAgreedPrice] = useState<number | undefined>(undefined);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState("");
  const [inclusions, setInclusions] = useState<string[]>([]);

  // Section C: Appointment
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("11:00");
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [endTime, setEndTime] = useState("13:00");
  const [location, setLocation] = useState<"studio" | "home" | "outdoor">("studio");
  const [photographerName, setPhotographerName] = useState("Navin");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [notes, setNotes] = useState("");

  // Section D: Status
  const [status, setStatus] = useState<BookingStatus>("pending");

  // Conflict state
  const [conflicts, setConflicts] = useState<Booking[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [hasConflictOverride, setHasConflictOverride] = useState(false);
  const [conflictOverrideReason, setConflictOverrideReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load clients and packages
  useEffect(() => {
    async function loadRefs() {
      try {
        setLoadingData(true);
        const [cList, pList] = await Promise.all([getClients(), getPackages(false)]);
        setClients(cList);
        setPackages(pList);

        if (initialClientId) {
          setSelectedClientId(initialClientId);
        }
      } catch (err) {
        console.error("Error loading reference data:", err);
      } finally {
        setLoadingData(false);
      }
    }
    if (isOpen) {
      loadRefs();
    }
  }, [isOpen, initialClientId]);

  // Set initial form states
  useEffect(() => {
    if (editingBooking) {
      setSelectedClientId(editingBooking.clientId);
      setCategory(editingBooking.category || "Newborn Photography");
      setSelectedPackageId(editingBooking.packageId || "");
      setCustomPackageName(editingBooking.packageName || "");
      setPackagePrice(editingBooking.packagePriceSnapshot || 0);
      setCustomAgreedPrice(editingBooking.customAgreedPrice);
      setDiscountAmount(editingBooking.discountAmount || 0);
      setDiscountReason(editingBooking.discountReason || "");
      setInclusions(editingBooking.packageSnapshot?.inclusions || []);

      setAppointmentDate(editingBooking.appointmentDate);
      setStartTime(editingBooking.startTime);
      setEndTime(editingBooking.endTime);
      setDurationMinutes(editingBooking.durationMinutes || 120);
      setLocation(editingBooking.location || "studio");
      setPhotographerName(editingBooking.photographerName || "Navin");
      setSpecialInstructions(editingBooking.specialInstructions || "");
      setNotes(editingBooking.notes || "");
      setStatus(editingBooking.status);
    } else {
      const today = getTodayNepal();
      setAppointmentDate(initialDate || today);
      setStartTime(initialTime || "11:00");
      setDurationMinutes(120);
      calculateEndTime("11:00", 120);
      setStatus("pending");
      setDiscountAmount(0);
      setDiscountReason("");
      setCustomAgreedPrice(undefined);
      setHasConflictOverride(false);
      setConflictOverrideReason("");
      setError(null);
      setConflictWarning(null);
    }
  }, [editingBooking, initialDate, initialTime, isOpen]);

  // Auto-calculate end time whenever start time or duration changes
  const calculateEndTime = (start: string, duration: number) => {
    if (!start) return;
    const [hStr, mStr] = start.split(":");
    let totalMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + duration;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    const computedEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    setEndTime(computedEnd);
    return computedEnd;
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    calculateEndTime(newStart, durationMinutes);
  };

  const handleDurationChange = (newDuration: number) => {
    setDurationMinutes(newDuration);
    calculateEndTime(startTime, newDuration);
  };

  // Auto-fill when package is selected
  const handleSelectPackage = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    if (!pkgId) {
      setCustomPackageName("Custom Session Quote");
      return;
    }
    const selected = packages.find((p) => p.id === pkgId);
    if (selected) {
      setCustomPackageName(selected.name);
      setCategory(selected.category);
      setPackagePrice(selected.price);
      setDurationMinutes(selected.durationMinutes || 120);
      calculateEndTime(startTime, selected.durationMinutes || 120);
      setInclusions(selected.inclusions || []);
    }
  };

  // Check conflicts in real-time when date/time changes
  useEffect(() => {
    async function checkConflict() {
      if (!appointmentDate || !startTime || !endTime) return;
      try {
        const found = await detectBookingConflicts(
          appointmentDate,
          startTime,
          endTime,
          editingBooking?.id
        );
        setConflicts(found);
        if (found.length > 0) {
          setConflictWarning(
            `Schedule Conflict Detected: Slot overlaps with ${found[0].clientName} (${found[0].bookingNumber}, ${formatTime12h(
              found[0].startTime
            )} - ${formatTime12h(found[0].endTime)}).`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.error("Conflict detection check error:", err);
      }
    }

    if (isOpen) {
      checkConflict();
    }
  }, [appointmentDate, startTime, endTime, isOpen, editingBooking]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const basePrice = customAgreedPrice !== undefined ? customAgreedPrice : packagePrice;
  const finalTotalAmount = Math.max(0, basePrice - (discountAmount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedClient) {
      setError("Please select or register a client for this booking.");
      return;
    }
    if (!appointmentDate) {
      setError("Please select an appointment date.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Please set a valid start and end time.");
      return;
    }

    if (conflicts.length > 0 && !hasConflictOverride) {
      setError("Cannot save booking: Time slot has an active conflict. Please adjust the time or request admin override.");
      return;
    }

    if (hasConflictOverride && !conflictOverrideReason.trim()) {
      setError("Please provide an administrator override reason for this conflicting slot.");
      return;
    }

    if (!studioUser) return;

    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        clientId: selectedClient.id,
        clientName: selectedClient.fullName,
        clientPhone: selectedClient.phone,
        clientEmail: selectedClient.email || "",
        babyName: selectedClient.babyName || "",
        babyDob: selectedClient.babyDob || "",
        category,
        packageId: selectedPackageId || undefined,
        packageName: customPackageName || "Photography Session",
        packagePriceSnapshot: packagePrice,
        packageSnapshot: {
          id: selectedPackageId || undefined,
          name: customPackageName || "Photography Session",
          category,
          price: packagePrice,
          durationMinutes,
          inclusions,
        },
        customAgreedPrice,
        discountAmount: Number(discountAmount) || 0,
        discountReason: discountReason.trim() || undefined,
        appointmentDate,
        startTime,
        endTime,
        durationMinutes,
        status,
        location,
        photographerName,
        specialInstructions: specialInstructions.trim(),
        notes: notes.trim(),
        hasConflictOverride,
        conflictOverrideReason: hasConflictOverride ? conflictOverrideReason.trim() : undefined,
      };

      if (editingBooking) {
        await updateBooking(editingBooking.id, payload, {
          uid: studioUser.uid,
          displayName: studioUser.displayName,
        });
        onSuccess({ ...editingBooking, ...payload, id: editingBooking.id });
      } else {
        const created = await createBooking(payload, {
          uid: studioUser.uid,
          displayName: studioUser.displayName,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error("Booking save error:", err);
      setError(err.message || "Failed to save booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch) ||
      (c.babyName && c.babyName.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingBooking ? `Edit Booking ${editingBooking.bookingNumber}` : "Create Photography Booking"}
        subtitle="Schedule new studio photoshoot, select package, and verify slot availability"
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Conflict Warning Alert Banner */}
          {conflictWarning && (
            <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-amber-900 font-semibold">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{conflictWarning}</p>
                  <p className="font-normal text-[11px] text-amber-800 mt-0.5">
                    Double-booking studio slots is prevented to ensure quality. Please pick another time or use administrator override.
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-2 border-t border-amber-200 flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#3D084B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasConflictOverride}
                      onChange={(e) => setHasConflictOverride(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3D084B] focus:ring-[#3D084B]"
                    />
                    <span>Administrator Override (Allow concurrent session)</span>
                  </label>

                  {hasConflictOverride && (
                    <input
                      type="text"
                      required
                      value={conflictOverrideReason}
                      onChange={(e) => setConflictOverrideReason(e.target.value)}
                      placeholder="Specify reason for override (e.g. 2nd photographer assigned, home session)..."
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= SECTION A: CLIENT INFORMATION ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#EBD8E1] pb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3D084B]">
                <User className="w-4 h-4" />
                <span>Section A — Client & Family Details</span>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsClientModalOpen(true)}
                className="gap-1 text-[11px] py-1"
              >
                <Plus className="w-3.5 h-3.5 text-[#3D084B]" />
                <span>Add New Client</span>
              </Button>
            </div>

            {/* Client Search and Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Select Existing Client *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search client by name or phone..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20 mb-1.5"
                  />
                  <Search className="w-3.5 h-3.5 text-[#846F7F] absolute left-2.5 top-2.5" />
                </div>

                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-sm text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                >
                  <option value="">-- Choose Client Profile --</option>
                  {filteredClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName} ({client.phone}) {client.babyName ? `• Baby: ${client.babyName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Client Card Summary */}
              {selectedClient ? (
                <div className="p-3.5 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#3D084B] text-sm">{selectedClient.fullName}</span>
                    <span className="text-[10px] text-[#68456E] font-semibold bg-white px-2 py-0.5 rounded-full border border-[#EBD8E1]">
                      {selectedClient.totalBookings || 0} Bookings
                    </span>
                  </div>
                  <p className="text-[#846F7F]">Phone: {selectedClient.phone}</p>
                  {selectedClient.babyName && (
                    <p className="text-[#332A34]">
                      Baby: <strong className="font-semibold text-[#3D084B]">{selectedClient.babyName}</strong> ({selectedClient.babyGender || "baby"})
                    </p>
                  )}
                  {selectedClient.notes && (
                    <p className="text-[#846F7F] italic text-[11px] truncate">Note: {selectedClient.notes}</p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl border border-dashed border-[#EBD8E1] text-xs text-[#846F7F] flex items-center justify-center text-center">
                  Select an existing client or click "Add New Client" to proceed.
                </div>
              )}
            </div>
          </div>

          {/* ================= SECTION B: PHOTOGRAPHY DETAILS ================= */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3D084B] border-b border-[#EBD8E1] pb-2">
              <Camera className="w-4 h-4" />
              <span>Section B — Photography Details & Package</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Photography Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PackageCategory)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Select Package (Optional)
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => handleSelectPackage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                >
                  <option value="">-- Custom Booking (No Package) --</option>
                  {packages
                    .filter((p) => p.active || p.id === selectedPackageId)
                    .map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — {formatNPR(pkg.price)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Package / Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={customPackageName}
                  onChange={(e) => setCustomPackageName(e.target.value)}
                  placeholder="e.g. Newborn Signature Collection"
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Package Listed Price (NPR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={packagePrice}
                  onChange={(e) => setPackagePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Custom Agreed Price (If quote altered)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Leave empty to use package price"
                  value={customAgreedPrice !== undefined ? customAgreedPrice : ""}
                  onChange={(e) =>
                    setCustomAgreedPrice(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Special Discount (NPR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>
            </div>

            {discountAmount > 0 && (
              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Discount Reason / Campaign
                </label>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="e.g. Festival Offer / Returning Family Promo"
                  className="w-full px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>
            )}
          </div>

          {/* ================= SECTION C: APPOINTMENT TIME ================= */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3D084B] border-b border-[#EBD8E1] pb-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Section C — Appointment Schedule (Asia/Kathmandu)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Photoshoot Date *
                </label>
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={durationMinutes}
                  onChange={(e) => handleDurationChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Calculated End Time
                </label>
                <input
                  type="time"
                  disabled
                  value={endTime}
                  className="w-full px-3.5 py-2.5 bg-gray-100 border border-[#EBD8E1] rounded-xl text-xs text-[#846F7F] cursor-not-allowed font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Session Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                >
                  <option value="studio">Studio (Newborn Photography Nepal)</option>
                  <option value="home">Client Home (Lifestyle Session)</option>
                  <option value="outdoor">Outdoor / Garden</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Assigned Photographer
                </label>
                <input
                  type="text"
                  value={photographerName}
                  onChange={(e) => setPhotographerName(e.target.value)}
                  placeholder="Navin"
                  className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Client props, dress color preferences, heater setup requirements..."
                  className="w-full px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332A34] mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Staff observations or reminder logs..."
                  className="w-full px-3.5 py-2 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
                />
              </div>
            </div>
          </div>

          {/* ================= SECTION D: STATUS & FINANCIAL SUMMARY ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-[#EBD8E1]">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3D084B] mb-1.5">
                Section D — Initial Booking Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookingStatus)}
                className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/50 border border-[#EBD8E1] rounded-xl text-xs text-[#332A34] font-semibold focus:outline-none focus:ring-2 focus:ring-[#3D084B]/20"
              >
                <option value="pending">Pending (Awaiting deposit)</option>
                <option value="confirmed">Confirmed (Scheduled & Locked)</option>
                <option value="completed">Completed (Photoshoot finished)</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Section E: Financial Summary Box */}
            <div className="p-4 rounded-2xl bg-[#FAF2F7] border border-[#EBD8E1] space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#846F7F] block border-b border-[#EBD8E1] pb-1">
                Section E — Financial Summary
              </span>
              <div className="flex justify-between text-[#846F7F]">
                <span>Agreed Base Price:</span>
                <span>{formatNPR(basePrice)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Discount:</span>
                  <span>- {formatNPR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#3D084B] font-bold text-sm pt-1 border-t border-[#EBD8E1]">
                <span>Final Contracted Amount:</span>
                <span className="font-serif text-base">{formatNPR(finalTotalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="pt-4 border-t border-[#E8EBF0] flex items-center justify-end gap-3 sticky bottom-0 bg-white py-3.5 -mb-6 -mx-6 px-6 mt-6 shadow-card">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" variant="action" isLoading={submitting} className="cursor-pointer shadow-subtle">
              {editingBooking ? "Save Changes" : "Confirm & Schedule Booking"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Embedded Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={async (clientData) => {
          if (!studioUser) return;
          const created = await createClient(clientData, {
            uid: studioUser.uid,
            displayName: studioUser.displayName,
          });
          const cList = await getClients();
          setClients(cList);
          setSelectedClientId(created.id);
          return created;
        }}
      />
    </>
  );
}

