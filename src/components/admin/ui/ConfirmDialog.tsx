"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { ModalDialog } from "./ModalDialog";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

const CONFIRM_VARIANT_CLASSES = {
  danger: "bg-red-600 hover:bg-red-500 text-white",
  warning: "bg-amber-600 hover:bg-amber-500 text-zinc-950",
  primary: "bg-emerald-600 hover:bg-emerald-500 text-white",
} as const;

const ICON_VARIANT_CLASSES = {
  danger: "bg-red-500/15 border-red-500/30 text-red-400",
  warning: "bg-amber-500/15 border-amber-500/30 text-amber-400",
  primary: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
} as const;

/**
 * Diálogo modal accesible para confirmaciones destructivas o críticas en reemplazo de window.confirm.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      role="alertdialog"
      closeDisabled={isLoading}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      headerIcon={
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${ICON_VARIANT_CLASSES[variant]}`}
        >
          <AlertTriangle className="w-4 h-4" />
        </div>
      }
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isLoading}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${CONFIRM_VARIANT_CLASSES[variant]}`}
          >
            {isLoading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{message}</p>
    </ModalDialog>
  );
}
