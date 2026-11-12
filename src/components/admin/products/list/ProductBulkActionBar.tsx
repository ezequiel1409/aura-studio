"use client";

import { FolderInput, RefreshCw, Star, Trash2, X } from "lucide-react";
import { Category } from "../../../../domain/category/types";
import { ProductStatus } from "../../../../domain/product/types";

export interface ProductBulkActionBarProps {
  selectedCount: number;
  leafCategories: Category[];
  isBulkProcessing: boolean;
  bulkStatusOpen: boolean;
  bulkCategoryOpen: boolean;
  onToggleStatusOpen: () => void;
  onToggleCategoryOpen: () => void;
  onBulkStatus: (status: ProductStatus) => void;
  onBulkMoveCategory: (categoryId: number) => void;
  onBulkFeatured: (isFeatured: boolean) => void;
  onRequestBulkDelete: () => void;
  onClearSelection: () => void;
}

const BULK_STATUS_OPTIONS: ReadonlyArray<{
  status: ProductStatus;
  label: string;
  textClass: string;
}> = [
  { status: "AVAILABLE", label: "Disponible", textClass: "text-emerald-300" },
  { status: "RESERVED", label: "Reservada", textClass: "text-amber-300" },
  { status: "SOLD_OUT", label: "Agotada", textClass: "text-zinc-400" },
];

/**
 * Barra flotante inferior para acciones en lote sobre productos seleccionados.
 */
export function ProductBulkActionBar({
  selectedCount,
  leafCategories,
  isBulkProcessing,
  bulkStatusOpen,
  bulkCategoryOpen,
  onToggleStatusOpen,
  onToggleCategoryOpen,
  onBulkStatus,
  onBulkMoveCategory,
  onBulkFeatured,
  onRequestBulkDelete,
  onClearSelection,
}: ProductBulkActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <aside
      aria-label="Barra de acciones en lote para productos seleccionados"
      className="fixed bottom-4 inset-x-4 lg:left-[264px] lg:right-6 max-w-2xl mx-auto z-40 bg-zinc-950/95 border border-amber-400/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 text-xs"
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-300 text-zinc-950 font-bold text-xs"
          aria-hidden="true"
        >
          {selectedCount}
        </span>
        <span className="font-semibold text-zinc-200">
          {selectedCount === 1
            ? "1 producto seleccionado"
            : `${selectedCount} productos seleccionados`}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="relative">
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={bulkStatusOpen}
            aria-label="Cambiar estado de productos seleccionados en lote"
            onClick={onToggleStatusOpen}
            disabled={isBulkProcessing}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <RefreshCw size={13} aria-hidden="true" />
            <span>Estado</span>
          </button>

          {bulkStatusOpen && (
            <div
              role="menu"
              aria-label="Opciones de estado para lote"
              className="absolute bottom-full mb-2 left-0 w-36 bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-xl space-y-1"
            >
              {BULK_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.status}
                  type="button"
                  role="menuitem"
                  onClick={() => onBulkStatus(opt.status)}
                  className={`w-full min-h-[38px] text-left px-2.5 py-1.5 rounded-lg ${opt.textClass} hover:bg-zinc-800 transition-colors text-xs font-semibold cursor-pointer`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={bulkCategoryOpen}
            aria-label="Mover productos seleccionados a otra categoría en lote"
            onClick={onToggleCategoryOpen}
            disabled={isBulkProcessing}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <FolderInput size={13} aria-hidden="true" />
            <span>Mover</span>
          </button>

          {bulkCategoryOpen && (
            <div
              role="menu"
              aria-label="Opciones de categoría para lote"
              className="absolute bottom-full mb-2 left-0 w-48 max-h-56 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-xl space-y-1"
            >
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500">
                Mover a:
              </div>
              {leafCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="menuitem"
                  onClick={() => onBulkMoveCategory(c.id)}
                  className="w-full min-h-[38px] text-left px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 transition-colors text-xs truncate cursor-pointer"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onBulkFeatured(true)}
          disabled={isBulkProcessing}
          aria-label={`Destacar ${selectedCount} producto(s) seleccionado(s) en lote`}
          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-200 font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        >
          <Star size={13} className="fill-amber-300" aria-hidden="true" />
          <span>Destacar</span>
        </button>

        <button
          type="button"
          onClick={onRequestBulkDelete}
          disabled={isBulkProcessing}
          aria-label={`Eliminar ${selectedCount} producto(s) seleccionado(s) en lote`}
          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-rose-950/70 text-rose-300 border border-rose-800/80 hover:bg-rose-900 transition-colors font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
        >
          <Trash2 size={13} aria-hidden="true" />
          <span>Eliminar</span>
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          aria-label="Cancelar y deseleccionar todos los productos"
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          title="Cancelar selección"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
