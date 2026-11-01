"use client";

import React from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex flex-col items-center text-center p-2">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${
            variant === "danger"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : variant === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-[#FAF2F7] border-[#EBD8E1] text-[#3D084B]"
          }`}
        >
          {variant === "danger" || variant === "warning" ? (
            <AlertTriangle className="w-6 h-6" />
          ) : (
            <Info className="w-6 h-6" />
          )}
        </div>

        <h3 className="font-serif text-lg font-bold text-[#3D084B]">{title}</h3>
        <p className="text-xs text-[#846F7F] mt-2 leading-relaxed max-w-sm">{description}</p>

        <div className="mt-6 flex items-center justify-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

