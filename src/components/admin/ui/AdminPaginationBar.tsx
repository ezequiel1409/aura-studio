"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface AdminPaginationBarProps {
  page: number;
  totalPages: number;
  totalItems: number;
  itemLabel?: string;
  ariaLabel?: string;
  onPageChange: (nextPage: number) => void;
  disabled?: boolean;
}

/**
 * Pie de paginación uniforme para tablas y grillas del backoffice.
 */
export function AdminPaginationBar({
  page,
  totalPages,
  totalItems,
  itemLabel = "registros",
  ariaLabel = "Paginación de resultados",
  onPageChange,
  disabled = false,
}: AdminPaginationBarProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const canGoPrev = page > 1 && !disabled;
  const canGoNext = page < safeTotalPages && !disabled;

  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400"
    >
      <span>
        Página <strong className="text-zinc-200">{page}</strong> de{" "}
        <strong className="text-zinc-200">{safeTotalPages}</strong> ·{" "}
        <strong className="text-zinc-200">{totalItems}</strong> {itemLabel}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
          className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
          <span>Anterior</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Siguiente</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
}
