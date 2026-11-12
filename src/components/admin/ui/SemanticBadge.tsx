"use client";

import React from "react";

export type SemanticBadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "amber";

export interface SemanticBadgeProps {
  variant?: SemanticBadgeVariant;
  size?: "xs" | "sm";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const BADGE_VARIANT_CLASSES: Record<SemanticBadgeVariant, string> = {
  neutral: "bg-zinc-800/80 text-zinc-300 border-zinc-700/80",
  success: "bg-emerald-950/60 text-emerald-300 border-emerald-700/60",
  warning: "bg-amber-950/60 text-amber-300 border-amber-700/60",
  danger: "bg-rose-950/60 text-rose-300 border-rose-700/60",
  info: "bg-sky-950/60 text-sky-300 border-sky-700/60",
  amber: "bg-amber-400/15 text-amber-300 border-amber-400/30",
};

const BADGE_SIZE_CLASSES = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-1 text-[11px]",
} as const;

/**
 * Etiqueta semántica consistente para estados, contadores y categorías del backoffice.
 */
export function SemanticBadge({
  variant = "neutral",
  size = "xs",
  icon,
  children,
  className = "",
}: SemanticBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap ${BADGE_VARIANT_CLASSES[variant]} ${BADGE_SIZE_CLASSES[size]} ${className}`.trim()}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}
