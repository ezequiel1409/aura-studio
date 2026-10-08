"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

interface SortFilterBarProps {
  total: number;
  currentSort?: string;
}

export function SortFilterBar({ total, currentSort = "newest" }: SortFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "newest") {
      params.delete("orden");
    } else {
      params.set("orden", newSort);
    }
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div
      aria-label="Opciones de listado"
      className="flex flex-wrap items-center justify-between gap-3 border-y border-[#e7e2da] py-3 text-xs text-stone-600"
    >
      {/* Conteo de piezas */}
      <div className="flex items-center gap-1.5" aria-live="polite">
        <span className="font-mono text-xs font-semibold text-stone-900">{total}</span>
        <span className="text-stone-500 font-light">
          {total === 1 ? "pieza encontrada" : "piezas en catálogo"}
        </span>
      </div>

      {/* Selector de orden accesible (BR-21, BR-22) */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5 text-stone-500" />
        <label htmlFor="sort-select" className="text-stone-500 font-medium">
          Ordenar:
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={handleSortChange}
          aria-label="Ordenar piezas del catálogo"
          className="min-h-[38px] rounded-lg border border-[#d8d2c7] bg-white px-3 py-1.5 font-medium text-stone-800 shadow-xs transition-colors hover:border-stone-400 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
        >
          <option value="newest">Recién llegados</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>
      </div>
    </div>
  );
}
