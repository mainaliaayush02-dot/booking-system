"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Booking,
  Client,
  PhotographyPackage,
  PackageCategory,
  BookingStatus,
  DeliverablesChecklist,
} from "@/lib/types";
import {
  getClients,
  getPackages,
  createBooking,
  updateBooking,
  detectBookingConflicts,
  getOrCreateClientByPhone,
  recordPaymentWithReceipt,
  getPaymentsForBooking,
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
  Gift,
  FileText,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/firebase-auth";
import { addDays, format, parseISO } from "date-fns";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  initialDate?: string;
  initialTime?: string;
  initialClientId?: string;
  editingBooking?: Booking | null;
}

const SESSION_TYPES: string[] = [
  "Newborn Photography",
  "Maternity Photography",
  "Baby Milestone",
  "Cake Smash",
  "Family Photography",
  "Other",
];

const SOURCE_OPTIONS: string[] = [
  "Ads",
  "Instagram",
  "Facebook",
  "Referral",
  "Walk-in",
  "Other",
];

type SlotPreset = "morning" | "afternoon" | "evening" | "custom";

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

  // ==========================================
  // SECTION 1 — CLIENT DETAILS
  // ==========================================
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientSource, setClientSource] = useState("Instagram");
  const [matchedClient, setMatchedClient] = useState<Client | null>(null);

  // ==========================================
  // SECTION 2 — SESSION DETAILS
  // ==========================================
  const [sessionType, setSessionType] = useState<string>("Newborn Photography");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [packageName, setPackageName] = useState("");
  const [babyDob, setBabyDob] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [slotPreset, setSlotPreset] = useState<SlotPreset>("morning");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");

  // ==========================================
  // SECTION 3 — DELIVERABLES
  // ==========================================
  const [deliveryDays, setDeliveryDays] = useState<number>(14);
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [deliverables, setDeliverables] = useState<DeliverablesChecklist>({
    rawPhotos50Plus: true,
    editedPhotos5: true,
    setup1: true,
    outfits2: true,
    familyPortrait: false,
    albumAndFrame: false,
  });
  const [albumIncluded, setAlbumIncluded] = useState(false);
  const [frameIncluded, setFrameIncluded] = useState(false);

  // ==========================================
  // SECTION 4 — PAYMENT
  // ==========================================
  const [totalAmount, setTotalAmount] = useState<number>(15999);
  const [paymentType, setPaymentType] = useState<"full" | "split">("split");
  const [fullPaid, setFullPaid] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(5000);
  const [depositPaid, setDepositPaid] = useState(false);
  const [remainingPaid, setRemainingPaid] = useState(false);

  // ==========================================
  // SECTION 5 — ADDITIONAL NOTES
  // ==========================================
  const [notes, setNotes] = useState("");

  // Conflict and Submission State
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
      } catch (err) {
        console.error("Error loading reference data:", err);
      } finally {
        setLoadingData(false);
      }
    }
    if (isOpen) {
      loadRefs();
    }
  }, [isOpen]);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (editingBooking) {
      // Section 1
      setClientName(editingBooking.clientName || "");
      setClientPhone(editingBooking.clientPhone || "");
      setClientEmail(editingBooking.clientEmail || "");
      setClientSource(editingBooking.clientSource || "Other");

      // Section 2
      setSessionType(editingBooking.category || "Newborn Photography");
      setSelectedPackageId(editingBooking.packageId || "");
      setPackageName(editingBooking.packageName || "");
      setBabyDob(editingBooking.babyDob || "");
      setAppointmentDate(editingBooking.appointmentDate || getTodayNepal());

      const st = editingBooking.startTime || "10:00";
      const et = editingBooking.endTime || "12:00";
      setStartTime(st);
      setEndTime(et);
      if (st === "10:00" && et === "12:00") {
        setSlotPreset("morning");
      } else if (st === "13:00" && et === "15:00") {
        setSlotPreset("afternoon");
      } else if (st === "16:00" && et === "18:00") {
        setSlotPreset("evening");
      } else {
        setSlotPreset("custom");
      }

      // Section 3
      setDeliveryDays(editingBooking.deliveryDays || 14);
      setDelivered(Boolean(editingBooking.delivered || editingBooking.status === "completed"));
      setDeliverables(
        editingBooking.deliverablesChecklist || {
          rawPhotos50Plus: true,
          editedPhotos5: true,
          setup1: true,
          outfits2: true,
          familyPortrait: false,
          albumAndFrame: false,
        }
      );
      setAlbumIncluded(Boolean(editingBooking.albumIncluded));
      setFrameIncluded(Boolean(editingBooking.frameIncluded));

      // Section 4
      const tAmt = Number(editingBooking.totalAmount) || editingBooking.packagePriceSnapshot || 15999;
      setTotalAmount(tAmt);
      const adv = Number(editingBooking.advancePaid) || 0;

      if (editingBooking.paymentType === "full") {
        setPaymentType("full");
        setFullPaid(adv >= tAmt);
        setDepositAmount(Math.min(5000, tAmt));
        setDepositPaid(false);
        setRemainingPaid(false);
      } else {
        setPaymentType("split");
        setDepositAmount(editingBooking.depositAmount || (adv > 0 ? adv : Math.min(5000, tAmt)));
        setDepositPaid(adv > 0);
        setRemainingPaid(adv >= tAmt && tAmt > 0);
        setFullPaid(adv >= tAmt);
      }

      // Section 5
      setNotes(editingBooking.notes || editingBooking.specialInstructions || "");

      // Conflict state
      setHasConflictOverride(Boolean(editingBooking.hasConflictOverride));
      setConflictOverrideReason(editingBooking.conflictOverrideReason || "");
      setError(null);
      setConflictWarning(null);
    } else {
      // New Booking defaults
      const today = getTodayNepal();
      setAppointmentDate(initialDate || today);

      if (initialClientId) {
        const c = clients.find((item) => item.id === initialClientId);
        if (c) {
          setClientName(c.fullName);
          setClientPhone(c.phone);
          setClientEmail(c.email || "");
          setClientSource(c.source || "Other");
          setBabyDob(c.babyDob || "");
          setMatchedClient(c);
        }
      } else {
        setClientName("");
        setClientPhone("");
        setClientEmail("");
        setClientSource("Instagram");
        setMatchedClient(null);
        setBabyDob("");
      }

      setSessionType("Newborn Photography");
      setSelectedPackageId("");
      setPackageName("");
      setSlotPreset("morning");
      setStartTime("10:00");
      setEndTime("12:00");

      setDeliveryDays(14);
      setIsCustomDays(false);
      setDelivered(false);
      setDeliverables({
        rawPhotos50Plus: true,
        editedPhotos5: true,
        setup1: true,
        outfits2: true,
        familyPortrait: false,
        albumAndFrame: false,
      });
      setAlbumIncluded(false);
      setFrameIncluded(false);

      setTotalAmount(15999);
      setPaymentType("split");
      setFullPaid(false);
      setDepositAmount(5000);
      setDepositPaid(false);
      setRemainingPaid(false);

      setNotes("");
      setHasConflictOverride(false);
      setConflictOverrideReason("");
      setError(null);
      setConflictWarning(null);
    }
  }, [isOpen, editingBooking, initialDate, initialClientId, clients]);

  // Client phone lookup to avoid duplicates
  const handlePhoneChange = (phoneVal: string) => {
    setClientPhone(phoneVal);
    const clean = phoneVal.trim();
    if (clean.length >= 7) {
      const found = clients.find((c) => c.phone.trim() === clean);
      if (found) {
        setMatchedClient(found);
        if (!clientName.trim()) setClientName(found.fullName);
        if (!clientEmail.trim() && found.email) setClientEmail(found.email);
        if (found.source) setClientSource(found.source);
        if (found.babyDob && !babyDob) setBabyDob(found.babyDob);
      } else {
        setMatchedClient(null);
      }
    } else {
      setMatchedClient(null);
    }
  };

  // Time slot preset selection
  const handleSlotPresetSelect = (preset: SlotPreset) => {
    setSlotPreset(preset);
    if (preset === "morning") {
      setStartTime("10:00");
      setEndTime("12:00");
    } else if (preset === "afternoon") {
      setStartTime("13:00");
      setEndTime("15:00");
    } else if (preset === "evening") {
      setStartTime("16:00");
      setEndTime("18:00");
    }
  };

  // Package selection populates package name and price
  const handlePackageSelect = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    if (!pkgId) {
      setPackageName("Custom Photography Session");
      return;
    }
    const selected = packages.find((p) => p.id === pkgId);
    if (selected) {
      setPackageName(selected.name);
      setSessionType(selected.category);
      setTotalAmount(selected.price);
      if (selected.depositAmount && selected.depositAmount > 0) {
        setDepositAmount(selected.depositAmount);
      } else {
        setDepositAmount(Math.min(5000, selected.price));
      }
    }
  };

  // Calculated remaining balance
  const remainingBalance = useMemo(() => {
    return Math.max(0, (Number(totalAmount) || 0) - (Number(depositAmount) || 0));
  }, [totalAmount, depositAmount]);

  // Validation: deposit cannot exceed total
  const isDepositOverTotal = useMemo(() => {
    return paymentType === "split" && (Number(depositAmount) || 0) > (Number(totalAmount) || 0);
  }, [paymentType, depositAmount, totalAmount]);

  // Calculated delivery date
  const calculatedDeliveryDate = useMemo(() => {
    if (!appointmentDate) return "";
    try {
      const parsed = parseISO(appointmentDate);
      const delivery = addDays(parsed, Number(deliveryDays) || 0);
      return format(delivery, "EEEE, dd MMMM yyyy");
    } catch {
      return "";
    }
  }, [appointmentDate, deliveryDays]);

  // Conflict check in real-time
  useEffect(() => {
    async function checkConflicts() {
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
            `Slot conflict: Overlaps with ${found[0].clientName} (${found[0].bookingNumber}, ${formatTime12h(
              found[0].startTime
            )} – ${formatTime12h(found[0].endTime)}).`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.error("Conflict check error:", err);
      }
    }
    if (isOpen) {
      checkConflicts();
    }
  }, [appointmentDate, startTime, endTime, isOpen, editingBooking]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      setError("Client Name is required.");
      return;
    }
    if (!clientPhone.trim()) {
      setError("Client Phone Number is required.");
      return;
    }
    if (!appointmentDate) {
      setError("Please select an appointment session date.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Please set a valid start and end time.");
      return;
    }
    if (isDepositOverTotal) {
      setError("Deposit amount cannot exceed the Total Amount.");
      return;
    }
    if (conflicts.length > 0 && !hasConflictOverride) {
      setError("Time slot conflict detected. Please adjust the time or request admin override.");
      return;
    }
    if (hasConflictOverride && !conflictOverrideReason.trim()) {
      setError("Please provide an administrator override reason for this conflicting slot.");
      return;
    }
    if (!studioUser) return;

    try {
      setError(null);
      setSubmitting(true);

      // 1. Create or update client in Firestore (prevents duplicates)
      const client = await getOrCreateClientByPhone(
        {
          fullName: clientName.trim(),
          phone: clientPhone.trim(),
          email: clientEmail.trim() || undefined,
          source: clientSource,
          babyDob: babyDob || undefined,
        },
        { uid: studioUser.uid, displayName: studioUser.displayName }
      );

      // Duration in minutes
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      let durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
      if (durationMinutes <= 0) durationMinutes = 120;

      const tAmt = Math.max(0, Number(totalAmount) || 0);
      const dAmt = paymentType === "split" ? Math.min(tAmt, Number(depositAmount) || 0) : tAmt;

      // Determine initial payment status and advance
      let targetAdvance = 0;
      if (paymentType === "full") {
        if (fullPaid) targetAdvance = tAmt;
      } else {
        if (depositPaid && remainingPaid) {
          targetAdvance = tAmt;
        } else if (depositPaid) {
          targetAdvance = dAmt;
        } else if (remainingPaid) {
          targetAdvance = tAmt - dAmt;
        }
      }

      const calculatedRemBalance = Math.max(0, tAmt - targetAdvance);
      const paymentStatus =
        targetAdvance >= tAmt && tAmt > 0
          ? "paid"
          : targetAdvance > 0
          ? "partially_paid"
          : "unpaid";

      const deliveryDeadlineIso = calculatedDeliveryDate
        ? format(addDays(parseISO(appointmentDate), Number(deliveryDays) || 0), "yyyy-MM-dd")
        : "";

      const bookingPayload = {
        clientId: client.id,
        clientName: client.fullName,
        clientPhone: client.phone,
        clientEmail: client.email || "",
        clientSource,
        babyDob,
        category: sessionType,
        packageId: selectedPackageId || "",
        packageName: packageName || `${sessionType} Session`,
        packagePriceSnapshot: tAmt,
        discountAmount: 0,
        totalAmount: tAmt,
        advancePaid: targetAdvance,
        remainingBalance: calculatedRemBalance,
        paymentStatus: paymentStatus as Booking["paymentStatus"],
        paymentType,
        depositAmount: dAmt,
        deliveryDays: Number(deliveryDays) || 14,
        deliveryDeadline: deliveryDeadlineIso,
        deliveryDate: deliveryDeadlineIso,
        delivered: Boolean(delivered),
        deliveredAt: delivered ? new Date().toISOString() : undefined,
        deliverablesChecklist: deliverables,
        albumIncluded: Boolean(albumIncluded),
        frameIncluded: Boolean(frameIncluded),
        appointmentDate,
        startTime,
        endTime,
        durationMinutes,
        status: (editingBooking?.status || "confirmed") as BookingStatus,
        location: editingBooking?.location || "studio",
        photographerName: editingBooking?.photographerName || "Navin",
        notes: notes.trim(),
        specialInstructions: notes.trim(),
        hasConflictOverride,
        conflictOverrideReason: hasConflictOverride ? conflictOverrideReason.trim() : "",
      };

      let savedBooking: Booking;

      if (editingBooking) {
        await updateBooking(editingBooking.id, bookingPayload, {
          uid: studioUser.uid,
          displayName: studioUser.displayName,
        });
        savedBooking = { ...editingBooking, ...bookingPayload, id: editingBooking.id };

        // Handle ledger payment if toggled on and not already recorded
        const existingPayments = await getPaymentsForBooking(editingBooking.id);
        const existingPaid = existingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        if (targetAdvance > existingPaid) {
          const diff = targetAdvance - existingPaid;
          await recordPaymentWithReceipt(
            {
              bookingId: savedBooking.id,
              bookingNumber: savedBooking.bookingNumber,
              clientId: client.id,
              clientName: client.fullName,
              amount: diff,
              paymentType: targetAdvance >= tAmt ? "full" : "advance",
              paymentMethod: "cash",
              paymentDate: appointmentDate || getTodayNepal(),
              notes: `Payment recorded via Booking Form update (${paymentType === "full" ? "Full payment" : "Deposit/Remaining"})`,
            },
            { uid: studioUser.uid, displayName: studioUser.displayName }
          );
        }
      } else {
        const created = await createBooking(bookingPayload, {
          uid: studioUser.uid,
          displayName: studioUser.displayName,
        });
        savedBooking = created;

        // Record initial payment ledger transaction if toggled on
        if (targetAdvance > 0) {
          await recordPaymentWithReceipt(
            {
              bookingId: created.id,
              bookingNumber: created.bookingNumber,
              clientId: client.id,
              clientName: client.fullName,
              amount: targetAdvance,
              paymentType: targetAdvance >= tAmt ? "full" : "advance",
              paymentMethod: "cash",
              paymentDate: appointmentDate || getTodayNepal(),
              notes: `Initial payment recorded on new booking creation (${paymentType === "full" ? "Full payment" : "Deposit"})`,
            },
            { uid: studioUser.uid, displayName: studioUser.displayName }
          );
        }
      }

      onSuccess(savedBooking);
      onClose();
    } catch (err: any) {
      console.error("Booking save error:", err);
      setError(err.message || "Failed to save booking. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBooking ? `Edit Booking ${editingBooking.bookingNumber}` : "New Photography Booking"}
      subtitle="Complete client details, session appointment, deliverables and payment"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-6 select-none text-[#252B38]">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 1 — CLIENT DETAILS */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E8EBF0] p-4 sm:p-5 rounded-2xl shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8EBF0] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FCEEEF] text-[#D9272E] font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-sans text-sm font-bold text-[#252B38] uppercase tracking-wider">
                Client Details
              </h3>
            </div>
            {matchedClient && (
              <span className="text-[10px] font-bold bg-[#E8F8EE] text-[#1E6838] px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3 text-[#1E6838]" />
                Existing client found
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client Name */}
            <div>
              <label className="block text-xs font-bold text-[#252B38] mb-1">
                Client Name <span className="text-[#D9272E]">*</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Pooja Sharma"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] placeholder-[#8993A4] font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-[#252B38] mb-1">
                Phone Number <span className="text-[#D9272E]">*</span>
              </label>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="e.g. 9801234567"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] placeholder-[#8993A4] font-mono font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-[#252B38] mb-1">
                Email Address <span className="text-[#8993A4] font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="e.g. pooja@example.com"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] placeholder-[#8993A4] font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
              />
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-bold text-[#252B38] mb-1">
                Source
              </label>
              <select
                value={clientSource}
                onChange={(e) => setClientSource(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E] cursor-pointer"
              >
                {SOURCE_OPTIONS.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2 — SESSION DETAILS */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E8EBF0] p-4 sm:p-5 rounded-2xl shadow-subtle space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E8EBF0] pb-2.5">
            <span className="w-6 h-6 rounded-full bg-[#FCEEEF] text-[#D9272E] font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="font-sans text-sm font-bold text-[#252B38] uppercase tracking-wider">
              Session Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Session Type */}
            <div>
              <label className="block text-xs font-bold text-[#252B38] mb-1">
                Session Type <span className="text-[#D9272E]">*</span>
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E] cursor-pointer"
              >
                {SESSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Package */}
            <div>
              <label className="block text-xs font-bold text-[#252B38] mb-1">
                Photography Package
              </label>
              <select
                value={selectedPackageId}
                onChange={(e) => handlePackageSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E] cursor-pointer"
              >
                <option value="">Custom Package / Quote</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatNPR(p.price)})
                  </option>
                ))}
              </select>
            </div>

            {/* Baby's Birthday */}
            <div>
              <label className="block text-xs font-bold text-[#252B38] mb-1">
                Baby's Birthday
              </label>
              <input
                type="date"
                value={babyDob}
                onChange={(e) => setBabyDob(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
              />
            </div>

            {/* Session Date */}
            <div>
              <label className="block text-xs font-bold text-[#252B38] mb-1">
                Session Date <span className="text-[#D9272E]">*</span>
              </label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
              />
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#252B38] mb-2">
              Time Slot
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Morning */}
              <button
                type="button"
                onClick={() => handleSlotPresetSelect("morning")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  slotPreset === "morning"
                    ? "bg-[#FCEEEF] border-[#D9272E] text-[#D9272E] shadow-sm"
                    : "bg-[#F8FAFC] border-[#E8EBF0] text-[#252B38] hover:bg-white"
                }`}
              >
                <span className="block font-sans font-bold text-xs">Morning</span>
                <span className="block text-[11px] opacity-80 mt-0.5">10:00 AM – 12:00 PM</span>
              </button>

              {/* Afternoon */}
              <button
                type="button"
                onClick={() => handleSlotPresetSelect("afternoon")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  slotPreset === "afternoon"
                    ? "bg-[#FCEEEF] border-[#D9272E] text-[#D9272E] shadow-sm"
                    : "bg-[#F8FAFC] border-[#E8EBF0] text-[#252B38] hover:bg-white"
                }`}
              >
                <span className="block font-sans font-bold text-xs">Afternoon</span>
                <span className="block text-[11px] opacity-80 mt-0.5">1:00 PM – 3:00 PM</span>
              </button>

              {/* Evening */}
              <button
                type="button"
                onClick={() => handleSlotPresetSelect("evening")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  slotPreset === "evening"
                    ? "bg-[#FCEEEF] border-[#D9272E] text-[#D9272E] shadow-sm"
                    : "bg-[#F8FAFC] border-[#E8EBF0] text-[#252B38] hover:bg-white"
                }`}
              >
                <span className="block font-sans font-bold text-xs">Evening</span>
                <span className="block text-[11px] opacity-80 mt-0.5">4:00 PM – 6:00 PM</span>
              </button>

              {/* Custom Time */}
              <button
                type="button"
                onClick={() => handleSlotPresetSelect("custom")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  slotPreset === "custom"
                    ? "bg-[#FCEEEF] border-[#D9272E] text-[#D9272E] shadow-sm"
                    : "bg-[#F8FAFC] border-[#E8EBF0] text-[#252B38] hover:bg-white"
                }`}
              >
                <span className="block font-sans font-bold text-xs">Custom Time</span>
                <span className="block text-[11px] opacity-80 mt-0.5">Set start & end</span>
              </button>
            </div>

            {/* Custom Time Inputs */}
            {slotPreset === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-[#F8FAFC] rounded-2xl border border-[#E8EBF0] animate-in fade-in duration-200">
                <div>
                  <label className="block text-[11px] font-bold text-[#8993A4] mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8EBF0] rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#8993A4] mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8EBF0] rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
                  />
                </div>
              </div>
            )}

            {/* Conflict Alert & Admin Override */}
            {conflictWarning && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <p className="font-semibold">{conflictWarning}</p>
                </div>
                {isAdmin && (
                  <div className="pt-2 border-t border-amber-200 flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasConflictOverride}
                        onChange={(e) => setHasConflictOverride(e.target.checked)}
                        className="rounded accent-[#D9272E]"
                      />
                      <span>Authorize Administrator Override for this slot conflict</span>
                    </label>
                    {hasConflictOverride && (
                      <input
                        type="text"
                        placeholder="State reason for overriding scheduling conflict..."
                        value={conflictOverrideReason}
                        onChange={(e) => setConflictOverrideReason(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3 — DELIVERABLES */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E8EBF0] p-4 sm:p-5 rounded-2xl shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8EBF0] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FCEEEF] text-[#D9272E] font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-sans text-sm font-bold text-[#252B38] uppercase tracking-wider">
                Deliverables
              </h3>
            </div>

            {/* Mark as Delivered Toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-[#F8FAFC] px-3 py-1.5 rounded-full border border-[#E8EBF0] hover:bg-[#FCEEEF]/40 transition-colors">
              <input
                type="checkbox"
                checked={delivered}
                onChange={(e) => setDelivered(e.target.checked)}
                className="rounded accent-[#D9272E] w-4 h-4"
              />
              <span className={`text-xs font-bold ${delivered ? "text-emerald-700" : "text-[#8993A4]"}`}>
                {delivered ? "✓ Marked as Delivered" : "Mark as Delivered"}
              </span>
            </label>
          </div>

          {/* Delivery Deadline Options */}
          <div>
            <label className="block text-xs font-bold text-[#252B38] mb-1.5">
              Delivery Deadline
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: "3 Days", days: 3 },
                { label: "1 Week", days: 7 },
                { label: "2 Weeks", days: 14 },
                { label: "1 Month", days: 30 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setDeliveryDays(opt.days);
                    setIsCustomDays(false);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    deliveryDays === opt.days && !isCustomDays
                      ? "bg-[#D9272E] text-white border-[#D9272E] shadow-sm"
                      : "bg-[#F8FAFC] border-[#E8EBF0] text-[#252B38] hover:bg-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsCustomDays(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isCustomDays
                    ? "bg-[#D9272E] text-white border-[#D9272E] shadow-sm"
                    : "bg-[#F8FAFC] border-[#E8EBF0] text-[#252B38] hover:bg-white"
                }`}
              >
                Custom Days
              </button>
            </div>

            {/* Custom number-of-days input */}
            {isCustomDays && (
              <div className="mt-2.5 flex items-center gap-2 max-w-xs animate-in fade-in duration-200">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-28 px-3 py-1.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
                />
                <span className="text-xs text-[#8993A4] font-medium">days after session</span>
              </div>
            )}

            {/* Automatically calculated delivery date */}
            {calculatedDeliveryDate && (
              <p className="text-xs text-[#8993A4] mt-2 font-medium">
                Estimated Delivery Date:{" "}
                <strong className="text-[#252B38] font-bold">{calculatedDeliveryDate}</strong>
              </p>
            )}
          </div>

          {/* Deliverables Checklist */}
          <div className="pt-2 border-t border-[#E8EBF0]">
            <label className="block text-xs font-bold text-[#252B38] mb-2.5">
              Deliverables Checklist
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { key: "rawPhotos50Plus", label: "50+ Raw Photos" },
                { key: "editedPhotos5", label: "5 Edited Pictures" },
                { key: "setup1", label: "1 Setup" },
                { key: "outfits2", label: "2 Outfits" },
                { key: "familyPortrait", label: "Family Portrait" },
                { key: "albumAndFrame", label: "Album & Frame" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 p-2.5 bg-[#F8FAFC] hover:bg-[#FCEEEF]/30 border border-[#E8EBF0] rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={Boolean((deliverables as any)[item.key])}
                    onChange={(e) =>
                      setDeliverables((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                    className="rounded accent-[#D9272E] w-4 h-4"
                  />
                  <span className="text-xs text-[#252B38] font-semibold">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Album & Frame Toggles */}
          <div className="pt-2 border-t border-[#E8EBF0] flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer bg-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E8EBF0] hover:bg-white transition-colors">
              <input
                type="checkbox"
                checked={albumIncluded}
                onChange={(e) => setAlbumIncluded(e.target.checked)}
                className="rounded accent-[#D9272E] w-4 h-4"
              />
              <span className="text-xs font-bold text-[#252B38]">Album Included</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer bg-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E8EBF0] hover:bg-white transition-colors">
              <input
                type="checkbox"
                checked={frameIncluded}
                onChange={(e) => setFrameIncluded(e.target.checked)}
                className="rounded accent-[#D9272E] w-4 h-4"
              />
              <span className="text-xs font-bold text-[#252B38]">Photo Frame Included</span>
            </label>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 4 — PAYMENT */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E8EBF0] p-4 sm:p-5 rounded-2xl shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8EBF0] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FCEEEF] text-[#D9272E] font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="font-sans text-sm font-bold text-[#252B38] uppercase tracking-wider">
                Payment
              </h3>
            </div>

            {/* Payment Type Segmented Switch */}
            <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E8EBF0]">
              <button
                type="button"
                onClick={() => setPaymentType("full")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paymentType === "full"
                    ? "bg-[#D9272E] text-white shadow-xs"
                    : "text-[#8993A4] hover:text-[#252B38]"
                }`}
              >
                Full
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("split")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paymentType === "split"
                    ? "bg-[#D9272E] text-white shadow-xs"
                    : "text-[#8993A4] hover:text-[#252B38]"
                }`}
              >
                Split
              </button>
            </div>
          </div>

          {/* Total Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#252B38]">
                Total Amount (NPR) <span className="text-[#D9272E]">*</span>
              </label>
              <span className="text-[11px] text-[#8993A4]">
                Package Price Auto-fill (Editable)
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8993A4]">
                NPR
              </span>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full pl-14 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-sm font-mono font-bold text-[#252B38] focus:outline-none focus:ring-1 focus:ring-[#D9272E]"
              />
            </div>
          </div>

          {/* Conditional Content: Full vs Split */}
          {paymentType === "full" ? (
            /* Full Payment View */
            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E8EBF0] flex items-center justify-between">
              <div>
                <p className="font-sans text-xs font-bold text-[#252B38]">
                  Full Settlement: {formatNPR(totalAmount)}
                </p>
                <p className="text-[11px] text-[#8993A4] mt-0.5">
                  Issue receipt and settle full amount immediately
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2 rounded-xl border border-[#E8EBF0] hover:bg-[#FCEEEF]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={fullPaid}
                  onChange={(e) => setFullPaid(e.target.checked)}
                  className="rounded accent-[#D9272E] w-4 h-4"
                />
                <span className={`text-xs font-bold ${fullPaid ? "text-[#D9272E]" : "text-[#8993A4]"}`}>
                  {fullPaid ? "✓ Full Payment Paid" : "Full Payment Paid"}
                </span>
              </label>
            </div>
          ) : (
            /* Split Payment View */
            <div className="space-y-3 p-4 bg-[#F8FAFC] rounded-2xl border border-[#E8EBF0]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Deposit Amount */}
                <div>
                  <label className="block text-xs font-bold text-[#252B38] mb-1">
                    Deposit Amount (NPR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8993A4]">
                      NPR
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={totalAmount}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className={`w-full pl-14 pr-3.5 py-2.5 bg-white border rounded-xl text-sm font-mono font-bold text-[#252B38] focus:outline-none focus:ring-1 ${
                        isDepositOverTotal ? "border-rose-400 focus:ring-rose-500" : "border-[#E8EBF0] focus:ring-[#D9272E]"
                      }`}
                    />
                  </div>
                  {isDepositOverTotal && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">
                      Deposit cannot exceed Total Amount ({formatNPR(totalAmount)})
                    </p>
                  )}
                </div>

                {/* Deposit Paid Toggle */}
                <div className="pt-2 sm:pt-5">
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2.5 rounded-xl border border-[#E8EBF0] hover:bg-[#FCEEEF]/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={depositPaid}
                      onChange={(e) => setDepositPaid(e.target.checked)}
                      className="rounded accent-[#D9272E] w-4 h-4"
                    />
                    <span className={`text-xs font-bold ${depositPaid ? "text-[#D9272E]" : "text-[#8993A4]"}`}>
                      {depositPaid ? "✓ Deposit Paid" : "Deposit Paid"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Remaining Balance Display & Toggle */}
              <div className="pt-3 border-t border-[#E8EBF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8993A4] block">
                    Remaining Balance (Auto-calculated)
                  </span>
                  <span className="font-sans text-base font-bold text-[#252B38] mt-0.5 block font-mono">
                    {formatNPR(remainingBalance)}
                  </span>
                  <span className="text-[10px] text-[#8993A4]">
                    Total ({formatNPR(totalAmount)}) − Deposit ({formatNPR(depositAmount)})
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2.5 rounded-xl border border-[#E8EBF0] hover:bg-[#FCEEEF]/30 transition-colors shrink-0">
                  <input
                    type="checkbox"
                    checked={remainingPaid}
                    onChange={(e) => setRemainingPaid(e.target.checked)}
                    className="rounded accent-[#D9272E] w-4 h-4"
                  />
                  <span className={`text-xs font-bold ${remainingPaid ? "text-emerald-700" : "text-[#8993A4]"}`}>
                    {remainingPaid ? "✓ Remaining Paid" : "Remaining Paid"}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 5 — ADDITIONAL NOTES */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E8EBF0] p-4 sm:p-5 rounded-2xl shadow-subtle space-y-3">
          <div className="flex items-center gap-2 border-b border-[#E8EBF0] pb-2.5">
            <span className="w-6 h-6 rounded-full bg-[#FCEEEF] text-[#D9272E] font-bold text-xs flex items-center justify-center">
              5
            </span>
            <h3 className="font-sans text-sm font-bold text-[#252B38] uppercase tracking-wider">
              Additional Notes
            </h3>
          </div>

          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests or details..."
            className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EBF0] rounded-xl text-xs text-[#252B38] placeholder-[#8993A4] font-medium focus:outline-none focus:ring-1 focus:ring-[#D9272E] resize-none"
          />
        </div>

        {/* ========================================================= */}
        {/* ACTIONS BAR */}
        {/* ========================================================= */}
        <div className="pt-4 border-t border-[#E8EBF0] flex items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xs py-3 -mb-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border-[#E8EBF0] text-[#252B38] hover:bg-[#F8FAFC] text-xs font-semibold cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={submitting || isDepositOverTotal}
            className="px-7 py-2.5 rounded-xl bg-[#D9272E] hover:bg-[#C21F25] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-subtle cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Saving Booking..." : editingBooking ? "Update Booking" : "Save Booking"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
