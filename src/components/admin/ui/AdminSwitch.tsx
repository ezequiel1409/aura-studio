"use client";

import { useId } from "react";

export interface AdminSwitchProps {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  size?: "sm" | "md";
}

/**
 * Interruptor accesible (`role="switch"`) con teclado y lectores de pantalla
 * para configuraciones booleanas del backoffice.
 */
export function AdminSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  ariaLabel,
  size = "md",
}: AdminSwitchProps) {
  const autoId = useId();
  const switchId = id || autoId;

  const trackDimensions = size === "sm" ? "w-9 h-5" : "w-11 h-6";
  const thumbDimensions = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const thumbTranslate =
    size === "sm"
      ? checked
        ? "translate-x-4"
        : "translate-x-0.5"
      : checked
        ? "translate-x-5"
        : "translate-x-1";

  return (
    <div className="flex items-center justify-between gap-3">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label
              htmlFor={switchId}
              className="block text-xs font-medium text-zinc-200 cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label || "Alternar opción"}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center rounded-full shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-50 disabled:cursor-not-allowed ${trackDimensions} ${
          checked ? "bg-amber-400" : "bg-zinc-700"
        }`}
      >
        <span
          className={`inline-block rounded-full bg-zinc-950 shadow transition-transform ${thumbDimensions} ${thumbTranslate}`}
        />
      </button>
    </div>
  );
}
