"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Payment, Booking } from "@/lib/types";
import { formatNPR, formatDate } from "@/lib/utils";
import { Printer, X, CheckCircle2, AlertCircle } from "lucide-react";

interface PrintableReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  booking?: Booking | null;
}

export function PrintableReceiptModal({
  isOpen,
  onClose,
  payment,
  booking,
}: PrintableReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const isReversed = payment.isReversed;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Printable Receipt Container */}
        <div
          ref={receiptRef}
          id="printable-receipt-area"
          className="bg-white border border-[#EBD8E1] rounded-3xl p-6 sm:p-8 shadow-studio print:border-none print:shadow-none print:p-0 relative overflow-hidden"
        >
          {/* Watermark for reversed payment */}
          {isReversed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="border-4 border-rose-500 text-rose-500 font-black text-4xl sm:text-6xl tracking-widest uppercase px-8 py-4 rotate-[-25deg] opacity-20 rounded-2xl">
                VOID / REVERSED
              </div>
            </div>
          )}

          {/* Top Brand Header */}
          <div className="flex items-start justify-between border-b border-[#EBD8E1] pb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#EBD8E1] bg-[#FAF2F7] shrink-0 relative shadow-subtle">
                <Image
                  src="/brand/logo.jpg"
                  alt="Newborn Photography Nepal"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#3D084B] tracking-tight leading-none">
                  Newborn Photography Nepal
                </h1>
                <p className="text-xs text-[#846F7F] font-medium mt-1">
                  Studio Portal • By Navin
                </p>
                <p className="text-[11px] text-[#846F7F] mt-0.5">
                  Kathmandu, Nepal • Official Payment Receipt
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF2F7] text-[#3D084B] border border-[#EBD8E1]">
                Official Receipt
              </span>
              <div className="font-mono text-xs sm:text-sm font-bold text-[#3D084B] mt-2">
                {payment.receiptNumber}
              </div>
              <div className="text-[11px] text-[#846F7F] mt-0.5">
                Date: {formatDate(payment.paymentDate)}
              </div>
            </div>
          </div>

          {/* Reversal Alert if applicable */}
          {isReversed && (
            <div className="my-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold">This receipt was officially reversed / voided.</span>
                {payment.reversalReason && (
                  <p className="mt-0.5 text-rose-700">Reason: {payment.reversalReason}</p>
                )}
                {payment.reversedAt && (
                  <p className="text-[10px] text-rose-500 mt-0.5">
                    Reversed on {formatDate(payment.reversedAt)} by {payment.reversedByName || "Studio Admin"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Client & Booking Summary Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-[#EBD8E1] text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#846F7F] block">
                Billed To
              </span>
              <span className="font-bold text-[#3D084B] text-sm mt-0.5 block">
                {payment.clientName}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#846F7F] block">
                Booking Reference
              </span>
              <span className="font-mono font-semibold text-[#332A34] mt-0.5 block">
                {payment.bookingNumber || "DIRECT"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#846F7F] block">
                Payment Channel
              </span>
              <span className="capitalize font-medium text-[#68456E] mt-0.5 block">
                {payment.paymentMethod.replace("_", " ")}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#846F7F] block">
                Transaction Ref
              </span>
              <span className="font-mono text-[#332A34] mt-0.5 block truncate">
                {payment.transactionReference || "Studio Direct"}
              </span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="py-5 border-b border-[#EBD8E1]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EBD8E1] text-[10px] font-bold uppercase tracking-wider text-[#846F7F]">
                  <th className="text-left py-2">Description</th>
                  <th className="text-center py-2">Payment Category</th>
                  <th className="text-right py-2">Amount Paid (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF2F7]">
                <tr>
                  <td className="py-3 text-[#332A34]">
                    <span className="font-bold text-[#3D084B] block">
                      {booking ? booking.packageName : "Photography Studio Service"}
                    </span>
                    <span className="text-[11px] text-[#846F7F] block mt-0.5">
                      {payment.notes || (payment.paymentType === "advance" ? "Booking Advance Deposit" : "Service Settlement")}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FAF2F7] text-[#3D084B] border border-[#EBD8E1]">
                      {payment.paymentType}
                    </span>
                  </td>
                  <td className="py-3 text-right font-serif font-bold text-base text-[#3D084B] tabular-nums">
                    {formatNPR(payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ledger Calculation Balances */}
          <div className="py-5 border-b border-[#EBD8E1] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
            <div className="space-y-1 text-[#846F7F] text-[11px]">
              <div>Recorded By: <span className="font-semibold text-[#3D084B]">{payment.recordedByName || "Studio Staff"}</span></div>
              <div>Issue Timestamp: <span className="font-mono">{payment.createdAt ? new Date(payment.createdAt).toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }) : formatDate(payment.paymentDate)}</span></div>
            </div>

            <div className="w-full sm:w-64 space-y-2 bg-[#FAF2F7]/60 p-4 rounded-2xl border border-[#EBD8E1]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#846F7F]">Previous Balance:</span>
                <span className="font-semibold text-[#332A34] tabular-nums">
                  {formatNPR(payment.previousBalance ?? (booking ? booking.totalAmount : payment.amount))}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#3D084B]">Amount Received:</span>
                <span className="font-serif font-bold text-base text-[#3D084B] tabular-nums">
                  {formatNPR(payment.amount)}
                </span>
              </div>
              <div className="border-t border-[#EBD8E1] pt-2 flex justify-between items-center text-xs">
                <span className="font-bold text-[#846F7F]">Remaining Due:</span>
                <span className={`font-serif font-bold text-sm tabular-nums ${payment.remainingBalanceAfter === 0 ? "text-emerald-700" : "text-amber-800"}`}>
                  {formatNPR(payment.remainingBalanceAfter ?? (booking ? booking.remainingBalance : 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Footer Notice & Signatures */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
            <div className="text-[11px] text-[#846F7F] max-w-sm space-y-1">
              <p className="font-medium text-[#3D084B]">Thank you for choosing Newborn Photography Nepal.</p>
              <p>This is a computer-generated official studio receipt valid across all banking and accounting records.</p>
            </div>

            <div className="text-center shrink-0 w-44">
              <div className="border-b border-[#3D084B]/40 pb-1 mb-1 font-serif italic text-sm text-[#3D084B]">
                Navin / Studio Admin
              </div>
              <span className="text-[10px] uppercase font-bold text-[#846F7F] tracking-wider block">
                Authorized Signature
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handlePrint}
            className="gap-2 shadow-studio"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Receipt</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}

