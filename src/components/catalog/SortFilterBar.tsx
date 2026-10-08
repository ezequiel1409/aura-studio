"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp } from "lucide-react";

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
    <div className="flex items-center justify-between border-y border-stone-200/70 py-2.5 text-xs text-stone-500">
      <div>
        <span className="font-medium text-stone-800">{total}</span>{" "}
        {total === 1 ? "pieza disponible" : "piezas"}
      </div>

      {/* Ordenamiento (BR-21, BR-22) */}
      <div className="flex items-center gap-1.5">
        <ArrowDownUp className="h-3.5 w-3.5 text-stone-400" />
        <label htmlFor="sort-select" className="sr-only">
          Ordenar por
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={handleSortChange}
          aria-label="Ordenar productos"
          className="rounded-md border-0 bg-transparent py-0.5 pl-1 pr-6 font-medium text-stone-800 focus:outline-none focus:ring-0 cursor-pointer"
        >
          <option value="newest">Recién llegados</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>
      </div>
    </div>
  );
}

