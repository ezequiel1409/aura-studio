"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

export interface StockStepperFieldProps {
  value: number;
  onChange: (nextValue: number) => void;
  itemLabel: string;
  min?: number;
  max?: number;
  lowStockThreshold?: number;
  disabled?: boolean;
  id?: string;
}

/**
 * Control numérico de inventario seguro en mobile (sin overflow horizontal en 320px+)
 * con botones de incremento/decremento de mínimo 44×44px y campo numérico directo.
 */
export function StockStepperField({
  value,
  onChange,
  itemLabel,
  min = 0,
  max = 9999,
  lowStockThreshold = 3,
  disabled = false,
  id,
}: StockStepperFieldProps) {
  const safeValue = Number.isFinite(value) ? Math.max(min, Math.min(max, Math.trunc(value))) : min;
  const isOut = safeValue <= 0;
  const isLow = safeValue > 0 && safeValue <= lowStockThreshold;

  const borderToneClass = isOut
    ? "border-red-500/40"
    : isLow
      ? "border-amber-500/40"
      : "border-zinc-700";

  const valueToneClass = isOut
    ? "text-red-400"
    : isLow
      ? "text-amber-300"
      : "text-emerald-400";

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.trim();
    if (raw === "") {
      onChange(min);
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    onChange(Math.max(min, Math.min(max, parsed)));
  };

  return (
    <div
      className={`flex items-center w-full max-w-full min-w-0 rounded-xl border bg-zinc-950 overflow-hidden transition-colors focus-within:border-amber-500/70 ${borderToneClass}`}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, safeValue - 1))}
        disabled={disabled || safeValue <= min}
        aria-label={`Restar 1 unidad de stock (${itemLabel})`}
        className="shrink-0 min-w-[44px] min-h-[44px] inline-flex items-center justify-center border-r border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
      >
        <Minus className="w-4 h-4" />
      </button>

      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={safeValue}
        disabled={disabled}
        onChange={handleInputChange}
        aria-label={`Cantidad en stock (${itemLabel})`}
        className={`min-w-0 w-full flex-1 min-h-[44px] bg-transparent px-2 text-center text-sm font-mono font-bold tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${valueToneClass}`}
      />

      <button
        type="button"
        onClick={() => onChange(Math.min(max, safeValue + 1))}
        disabled={disabled || safeValue >= max}
        aria-label={`Sumar 1 unidad de stock (${itemLabel})`}
        className="shrink-0 min-w-[44px] min-h-[44px] inline-flex items-center justify-center border-l border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 active:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
