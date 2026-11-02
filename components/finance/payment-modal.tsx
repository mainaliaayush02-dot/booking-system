"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Payment, PaymentMethod, PaymentType, Booking } from "@/lib/types";
import { recordPaymentWithReceipt, getBookings } from "@/lib/firestore";
import { validatePaymentAmount, calculateRemainingBalance } from "@/lib/finance-calculations";
import { useAuth } from "@/lib/firebase-auth";
import { getTodayNepal, formatNPR } from "@/lib/utils";
import { CreditCard, DollarSign, Receipt, AlertCircle, Info, CheckCircle2 } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPayment?: Payment) => void;
  initialBooking?: Booking | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  initialBooking,
}: PaymentModalProps) {
  const { studioUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [paymentType, setPaymentType] = useState<PaymentType>("advance");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("esewa");
  const [paymentDate, setPaymentDate] = useState(getTodayNepal());
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getBookings().then((bList) => {
        const nonCancelled = bList.filter((b) => b.status !== "cancelled");
        setBookings(nonCancelled);
        if (initialBooking) {
          const match = nonCancelled.find((b) => b.id === initialBooking.id) || initialBooking;
          setSelectedBookingId(match.id);
          setSelectedBooking(match);
          setClientName(match.clientName);
          setClientId(match.clientId);
          setBookingNumber(match.bookingNumber);
          setAmount(match.remainingBalance > 0 ? match.remainingBalance : match.totalAmount);
          setPaymentType(match.advancePaid > 0 ? "remaining" : "advance");
        }
      });
      setPaymentDate(getTodayNepal());
      setError(null);
    }
  }, [isOpen, initialBooking]);

  const handleBookingChange = (bId: string) => {
    setSelectedBookingId(bId);
    const b = bookings.find((item) => item.id === bId) || null;
    setSelectedBooking(b);
    if (b) {
      setClientName(b.clientName);
      setClientId(b.clientId);
      setBookingNumber(b.bookingNumber);
      if (b.remainingBalance > 0) {
        setAmount(b.remainingBalance);
        setPaymentType(b.advancePaid > 0 ? "remaining" : "advance");
      } else {
        setAmount(b.totalAmount);
        setPaymentType("full");
      }
    } else {
      setSelectedBookingId("");
      setSelectedBooking(null);
      setClientName("");
      setClientId("");
      setBookingNumber("");
      setAmount("");
      setPaymentType("advance");
    }
  };

  // Live overpayment validation check
  const numAmount = Number(amount) || 0;
  const isOverpaying =
    selectedBooking &&
    numAmount > 0 &&
    numAmount > selectedBooking.remainingBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioUser) return;
    if (!clientName.trim()) {
      setError("Please select a booking or enter a client name.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (selectedBooking) {
      const validation = validatePaymentAmount(
        selectedBooking.totalAmount,
        selectedBooking.advancePaid,
        Number(amount)
      );
      if (!validation.valid) {
        setError(validation.error || "Payment exceeds remaining balance.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const created = await recordPaymentWithReceipt(
        {
          bookingId: selectedBookingId || "general",
          bookingNumber: bookingNumber || "MANUAL",
          clientId: clientId || "general",
          clientName: clientName.trim(),
          amount: Number(amount),
          paymentType,
          paymentMethod,
          paymentDate,
          transactionReference: transactionRef.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        {
          uid: studioUser.uid,
          displayName: studioUser.displayName,
        }
      );

      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error("Error creating payment:", err);
      setError(err?.message || "Failed to record payment receipt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment Receipt"
      subtitle="Issue official studio receipt (REC-YYYY-XXXX) and update booking ledger in NPR."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Booking Selection */}
        <div>
          <label className="block text-xs font-bold text-[#3D084B] mb-1">
            Linked Photography Booking
          </label>
          <select
            value={selectedBookingId}
            onChange={(e) => handleBookingChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
          >
            <option value="">Manual / Unlinked Client Payment</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bookingNumber} • {b.clientName} ({b.packageName}) — Due: NPR {b.remainingBalance}
              </option>
            ))}
          </select>
        </div>

        {/* Live Booking Balance Information Box */}
        {selectedBooking && (
          <div className="bg-[#FAF2F7] border border-[#EBD8E1] rounded-2xl p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#846F7F]">
              <span>Package & Agreed Price:</span>
              <span className="font-semibold text-[#3D084B]">
                {selectedBooking.packageName} ({formatNPR(selectedBooking.totalAmount)})
              </span>
            </div>
            <div className="flex justify-between text-[#846F7F]">
              <span>Already Paid Advance:</span>
              <span className="font-semibold text-emerald-800">
                {formatNPR(selectedBooking.advancePaid)}
              </span>
            </div>
            <div className="flex justify-between text-[#846F7F] border-t border-[#EBD8E1] pt-1 font-bold">
              <span className="text-[#3D084B]">Remaining Balance Due:</span>
              <span className="text-amber-900 font-serif text-sm">
                {formatNPR(selectedBooking.remainingBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Client Name (if not auto-filled) */}
        <div>
          <label className="block text-xs font-bold text-[#3D084B] mb-1">
            Client Name *
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Suman & Priya Shrestha"
            className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
          />
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#3D084B] mb-1">
              Amount Received (NPR) *
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
                placeholder="5000"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-[#FAF2F7]/60 border rounded-2xl text-xs text-[#332A34] font-semibold focus:outline-none focus:ring-1 ${
                  isOverpaying
                    ? "border-rose-400 focus:ring-rose-500 bg-rose-50/50"
                    : "border-[#EBD8E1] focus:ring-[#3D084B]"
                }`}
              />
            </div>
            {isOverpaying && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                Amount exceeds remaining balance of NPR {selectedBooking?.remainingBalance}.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3D084B] mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
            />
          </div>
        </div>

        {/* Payment Type & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#3D084B] mb-1">
              Payment Category
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
            >
              <option value="advance">Advance / Booking Deposit</option>
              <option value="remaining">Remaining Balance Settlement</option>
              <option value="full">Full Upfront Payment</option>
              <option value="additional">Additional Prints / Deliverables</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3D084B] mb-1">
              Payment Channel
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
            >
              <option value="esewa">eSewa Mobile Wallet</option>
              <option value="khalti">Khalti Digital Wallet</option>
              <option value="bank_transfer">Direct Bank Transfer / Fonepay</option>
              <option value="cash">Studio Cash Collection</option>
              <option value="other">POS Card / Other</option>
            </select>
          </div>
        </div>

        {/* Transaction Reference */}
        <div>
          <label className="block text-xs font-bold text-[#3D084B] mb-1">
            Transaction Reference / Wallet Trx ID
          </label>
          <input
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. eSewa 9982471 / Fonepay Ref"
            className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-[#3D084B] mb-1">
            Notes / Receipt Remarks
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional receipt notes, customer remarks, or adjustments..."
            className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-[#3D084B]"
          />
        </div>

        <div className="pt-3 border-t border-[#EBD8E1] flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={Boolean(isOverpaying)}
          >
            Generate Receipt & Record
          </Button>
        </div>
      </form>
    </Modal>
  );
}
