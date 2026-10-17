"use client";

import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";

interface InventorySummaryLineProps {
  available: number;
  reserved: number;
  soldOut: number;
}

export function InventorySummaryLine({
  available,
  reserved,
  soldOut,
}: InventorySummaryLineProps) {
  const total = available + reserved + soldOut;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
      <div className="flex items-center gap-3">
        <span className="p-2 rounded-xl bg-zinc-800 text-amber-300 shrink-0">
          <Boxes size={16} aria-hidden="true" />
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-zinc-400">Inventario:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {available} disponibles
          </span>
          <span className="text-zinc-600">·</span>
          <span className="inline-flex items-center gap-1 font-bold text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {reserved} reservadas
          </span>
          <span className="text-zinc-600">·</span>
          <span className="inline-flex items-center gap-1 font-bold text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            {soldOut} agotadas
          </span>
          <span className="text-zinc-600">({total} en total)</span>
        </div>
      </div>

      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 font-bold text-amber-300 hover:text-amber-200 transition-colors self-end sm:self-auto shrink-0"
      >
        <span>Ver catálogo completo</span>
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}

