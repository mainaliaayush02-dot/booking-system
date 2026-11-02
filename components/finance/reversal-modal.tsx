"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Payment, StudioExpense } from "@/lib/types";
import { reversePaymentWithAudit, reverseExpenseWithAudit } from "@/lib/firestore";
import { useAuth } from "@/lib/firebase-auth";
import { formatNPR } from "@/lib/utils";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface ReversalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetPayment?: Payment | null;
  targetExpense?: StudioExpense | null;
}

export function ReversalModal({
  isOpen,
  onClose,
  onSuccess,
  targetPayment,
  targetExpense,
}: ReversalModalProps) {
  const { studioUser } = useAuth();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!targetPayment && !targetExpense) return null;

  const isPayment = Boolean(targetPayment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioUser) return;
    if (!reason.trim()) {
      setError("A detailed reversal reason is mandatory for financial audit integrity.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (isPayment && targetPayment) {
        await reversePaymentWithAudit(
          targetPayment.id,
          reason.trim(),
          { uid: studioUser.uid, displayName: studioUser.displayName }
        );
      } else if (targetExpense) {
        await reverseExpenseWithAudit(
          targetExpense.id,
          reason.trim(),
          { uid: studioUser.uid, displayName: studioUser.displayName }
        );
      }

      setReason("");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Reversal error:", err);
      setError(err?.message || "Failed to process reversal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPayment ? "Reverse Payment Receipt" : "Reverse Studio Expense"}
      subtitle="Financial audit reversal: Records are permanently preserved with an audited void status."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Audit Warning</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            {isPayment ? (
              <>
                You are about to void receipt <strong>{targetPayment?.receiptNumber}</strong> (
                {formatNPR(targetPayment?.amount)}) for <strong>{targetPayment?.clientName}</strong>.
                The client's booking advance will be reduced, and the remaining balance will be restored.
              </>
            ) : (
              <>
                You are about to void expense <strong>"{targetExpense?.title}"</strong> (
                {formatNPR(targetExpense?.amount)}). This expense will no longer count against net cash profit.
              </>
            )}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#3D084B] mb-1">
            Mandatory Reversal Reason *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Deposit refunded per studio cancellation policy / Duplicate transaction entry..."
            className="w-full px-3.5 py-2.5 bg-[#FAF2F7]/60 border border-[#EBD8E1] rounded-2xl text-xs text-[#332A34] focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="pt-3 border-t border-[#EBD8E1] flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isSubmitting}
            className="bg-rose-700 hover:bg-rose-800 text-white"
          >
            Confirm Reversal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
