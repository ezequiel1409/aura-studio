"use client";

import React from "react";
import { RefreshCw, Search, X } from "lucide-react";

export interface AdminSearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onClearSearch?: () => void;
}

/**
 * Barra reutilizable de búsqueda + filtros + actualización para listados del panel admin.
 */
export function AdminSearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  searchAriaLabel = "Buscar en el listado",
  filters,
  actions,
  onRefresh,
  isRefreshing = false,
  onClearSearch,
}: AdminSearchFilterBarProps) {
  const handleClear = () => {
    if (onClearSearch) {
      onClearSearch();
    } else {
      onSearchChange("");
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3">
      <div className="relative flex-1 min-w-0">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-10 pr-9 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {(filters || onRefresh || actions) && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {filters}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Actualizar listado"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin text-amber-400" : ""} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
