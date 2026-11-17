"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export type AdminButtonVariant = "primary" | "secondary" | "danger";
export type AdminButtonSize = "sm" | "md";

export interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  icon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<AdminButtonVariant, string> = {
  primary: "admin-btn-primary shadow-sm",
  secondary: "admin-btn-secondary",
  danger:
    "bg-rose-950/70 hover:bg-rose-900 border border-rose-700/80 text-rose-100 font-semibold",
};

const SIZE_CLASSES: Record<AdminButtonSize, string> = {
  sm: "min-h-[36px] px-3.5 py-2 text-xs rounded-xl",
  md: "min-h-[44px] px-5 py-2.5 text-xs rounded-xl",
};

/**
 * Botón unificado para acciones primarias, secundarias y destructivas del Backoffice.
 * Usa las variables semánticas `--admin-cta-*` para mantener identidad visual idéntica
 * entre pantallas en ambos temas (claro y oscuro).
 */
export function AdminButton({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  icon,
  children,
  disabled,
  type = "button",
  className = "",
  ...rest
}: AdminButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`.trim()}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 size={15} className="animate-spin shrink-0" aria-hidden="true" />
          <span>{loadingLabel ?? children}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0 flex items-center">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
