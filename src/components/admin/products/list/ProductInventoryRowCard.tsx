"use client";

import Link from "next/link";
import {
  Check,
  CheckSquare,
  ChevronDown,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  History,
  MessageCircle,
  MoreVertical,
  Package,
  PackageCheck,
  Square,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { calculateTotalStock, LOW_STOCK_THRESHOLD } from "../../../../domain/product/rules";
import { Product, ProductStatus } from "../../../../domain/product/types";
import { formatPriceARS } from "../../../../lib/format/currency";

export function getStockBadgeInfo(totalStock: number) {
  if (totalStock <= 0) {
    return {
      label: "Sin stock (0 u.)",
      className: "bg-red-500/15 border-red-500/30 text-red-300",
    };
  }
  if (totalStock <= LOW_STOCK_THRESHOLD) {
    return {
      label: `Stock bajo: ${totalStock} u.`,
      className: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    };
  }
  return {
    label: `${totalStock} en stock`,
    className: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  };
}

export interface ProductInventoryRowCardProps {
  product: Product;
  categoryName?: string;
  density: "comfortable" | "compact";
  isSelected: boolean;
  isDetailsExpanded: boolean;
  isMenuOpen: boolean;
  isEditingPrice: boolean;
  inlinePriceInput: string;
  onToggleSelect: (productId: number) => void;
  onToggleDetails: (productId: number) => void;
  onToggleMenu: (productId: number) => void;
  onCloseMenu: () => void;
  onStartEditPrice: (product: Product) => void;
  onInlinePriceChange: (value: string) => void;
  onSaveInlinePrice: (productId: number, rawPrice: string) => void;
  onCancelEditPrice: () => void;
  onStatusChange: (productId: number, status: ProductStatus) => void;
  onOpenQuickStock: (product: Product) => void;
  onToggleFeatured: (productId: number) => void;
  onOpenHistory: (target: { id: number; code: number; title: string | null }) => void;
  onRequestDelete: (product: Product) => void;
}

const QUICK_STATUS_BUTTONS: ReadonlyArray<{
  status: ProductStatus;
  fullLabel: string;
  shortLabel: string;
  ariaPrefix: string;
  activeClass: string;
}> = [
  {
    status: "AVAILABLE",
    fullLabel: "Disponible",
    shortLabel: "Disp.",
    ariaPrefix: "Marcar disponible",
    activeClass: "bg-emerald-600 text-white shadow-xs focus-visible:ring-emerald-400",
  },
  {
    status: "RESERVED",
    fullLabel: "Reservado",
    shortLabel: "Res.",
    ariaPrefix: "Marcar reservada",
    activeClass: "bg-amber-500 text-stone-950 shadow-xs focus-visible:ring-amber-400",
  },
  {
    status: "SOLD_OUT",
    fullLabel: "Agotado",
    shortLabel: "Agot.",
    ariaPrefix: "Marcar agotada",
    activeClass: "bg-stone-600 text-white shadow-xs focus-visible:ring-stone-400",
  },
];

/**
 * Fila modular de producto en inventario admin con edición rápida de precio, estado, menú y detalle de variantes.
 */
export function ProductInventoryRowCard({
  product: p,
  categoryName,
  density,
  isSelected,
  isDetailsExpanded,
  isMenuOpen,
  isEditingPrice,
  inlinePriceInput,
  onToggleSelect,
  onToggleDetails,
  onToggleMenu,
  onCloseMenu,
  onStartEditPrice,
  onInlinePriceChange,
  onSaveInlinePrice,
  onCancelEditPrice,
  onStatusChange,
  onOpenQuickStock,
  onToggleFeatured,
  onOpenHistory,
  onRequestDelete,
}: ProductInventoryRowCardProps) {
  const codeFormatted = `#${String(p.code).padStart(3, "0")}`;
  const thumbUrl = p.photos?.[0]?.keyThumb;
  const totalStock = calculateTotalStock(p.colors);
  const stockBadge = getStockBadgeInfo(totalStock);

  return (
    <div
      className={`border rounded-xl transition-all ${
        isSelected
          ? "bg-amber-950/20 border-amber-500/60 shadow-sm"
          : "bg-zinc-900/75 border-zinc-800/90 hover:border-zinc-700/80"
      }`}
    >
      <div
        className={`${
          density === "compact" ? "p-2.5 sm:p-3" : "p-3 sm:p-3.5"
        } flex flex-col lg:flex-row lg:items-center justify-between gap-3`}
      >
        {/* Bloque 1: Checkbox + Foto + Datos principales y Stock */}
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => onToggleSelect(p.id)}
            className="min-w-[44px] min-h-[44px] -ml-1 inline-flex items-center justify-center shrink-0 rounded-xl text-zinc-500 hover:text-amber-200 hover:bg-zinc-800/70 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            aria-label={`${isSelected ? "Deseleccionar" : "Seleccionar"} producto ${codeFormatted}`}
          >
            {isSelected ? (
              <CheckSquare size={18} className="text-amber-300" aria-hidden="true" />
            ) : (
              <Square size={18} className="text-zinc-500" aria-hidden="true" />
            )}
          </button>

          <Link
            href={`/admin/productos/${p.code}/editar`}
            className={`relative block ${
              density === "compact" ? "w-11 h-13" : "w-12 h-14 sm:w-14 sm:h-16"
            } rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 group/thumb hover:border-amber-400/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400`}
            title={`Editar ficha ${codeFormatted}`}
          >
            {thumbUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={thumbUrl}
                alt={p.title || codeFormatted}
                className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <Package size={18} />
              </div>
            )}
            <span className="absolute bottom-0.5 left-0.5 right-0.5 text-center text-[9px] font-mono font-bold bg-zinc-950/90 text-amber-200 rounded">
              {codeFormatted}
            </span>
          </Link>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start sm:items-center gap-1.5 min-w-0">
              <Link
                href={`/admin/productos/${p.code}/editar`}
                className="text-sm font-bold text-zinc-100 hover:text-amber-300 transition-colors line-clamp-2 sm:truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                title={`Editar ${p.title || codeFormatted}`}
              >
                {p.title || "Producto sin título"}
              </Link>
              {p.isFeatured && (
                <span
                  className="shrink-0 p-0.5 text-amber-400 mt-0.5 sm:mt-0"
                  title="Producto destacado en portada"
                >
                  <Star size={13} className="fill-amber-400" aria-hidden="true" />
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
              {isEditingPrice ? (
                <span className="inline-flex items-center gap-1 bg-zinc-950 border border-amber-400/80 rounded-xl p-1">
                  <span className="text-zinc-400 font-mono text-xs pl-1">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={inlinePriceInput}
                    aria-label={`Precio de ${p.title || codeFormatted}`}
                    onChange={(e) => onInlinePriceChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onSaveInlinePrice(p.id, inlinePriceInput);
                      } else if (e.key === "Escape") {
                        onCancelEditPrice();
                      }
                    }}
                    autoFocus
                    className="w-24 min-h-[36px] px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onSaveInlinePrice(p.id, inlinePriceInput)}
                    aria-label="Guardar precio"
                    title="Guardar precio"
                    className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg bg-amber-300 text-zinc-950 hover:bg-amber-200 cursor-pointer"
                  >
                    <Check size={13} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEditPrice}
                    aria-label="Cancelar edición de precio"
                    title="Cancelar edición"
                    className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartEditPrice(p)}
                  className="font-mono font-bold text-amber-200 hover:underline inline-flex items-center gap-1 group/price cursor-pointer py-0.5"
                  title="Clic para editar precio rápidamente"
                >
                  <span>
                    {p.priceCents !== null
                      ? formatPriceARS(p.priceCents, p.currency)
                      : "Consultar precio"}
                  </span>
                  <Edit2
                    size={11}
                    className="opacity-60 sm:opacity-0 group-hover/price:opacity-100 text-amber-400 transition-opacity"
                    aria-hidden="true"
                  />
                </button>
              )}

              <span className="text-zinc-600" aria-hidden="true">
                •
              </span>
              <span className="text-zinc-400 truncate max-w-[140px]">
                {categoryName || "Sin clasificar"}
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold tabular-nums ${stockBadge.className}`}
              >
                {stockBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Bloque 2: Controles de estado, stock rápido y menú */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 pt-2.5 lg:pt-0 border-t border-zinc-800/70 lg:border-t-0 shrink-0">
          <div
            role="group"
            aria-label={`Estado de ${codeFormatted}`}
            className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px]"
          >
            {QUICK_STATUS_BUTTONS.map((btn) => {
              const active = p.status === btn.status;
              return (
                <button
                  key={btn.status}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${btn.ariaPrefix} ${codeFormatted}`}
                  onClick={() => onStatusChange(p.id, btn.status)}
                  className={`min-h-[38px] px-2.5 rounded-lg font-semibold transition-colors cursor-pointer focus-visible:ring-2 ${
                    active ? btn.activeClass : "text-zinc-400 hover:text-zinc-200 focus-visible:ring-amber-400"
                  }`}
                >
                  <span className="hidden sm:inline">{btn.fullLabel}</span>
                  <span className="sm:hidden">{btn.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 ml-auto lg:ml-0">
            <button
              type="button"
              onClick={() => onOpenQuickStock(p)}
              aria-label={`Ajustar stock de ${p.title || codeFormatted}`}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs font-bold text-zinc-200 hover:border-amber-400/70 hover:text-amber-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <PackageCheck size={15} className="text-amber-300" aria-hidden="true" />
              <span>Stock</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleDetails(p.id)}
              aria-expanded={isDetailsExpanded}
              aria-controls={`details-content-${p.id}`}
              aria-label={
                isDetailsExpanded
                  ? `Ocultar detalles de ${codeFormatted}`
                  : `Ver detalles y stock de ${codeFormatted}`
              }
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-zinc-400 hover:text-amber-200 hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              title={isDetailsExpanded ? "Ocultar detalles" : "Ver detalles"}
            >
              <ChevronDown
                size={17}
                className={`transition-transform duration-200 ${
                  isDetailsExpanded ? "rotate-180 text-amber-300" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => onToggleMenu(p.id)}
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
                aria-label={`Más opciones para ${codeFormatted}`}
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <MoreVertical size={17} aria-hidden="true" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={onCloseMenu}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    aria-label={`Acciones de ${codeFormatted}`}
                    className="absolute right-0 top-full mt-1 w-48 z-40 bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-2xl space-y-0.5"
                  >
                    <Link
                      href={`/admin/productos/${p.code}/editar`}
                      role="menuitem"
                      onClick={onCloseMenu}
                      className="flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                    >
                      <Edit2 size={14} className="text-zinc-400" aria-hidden="true" />
                      <span>Editar ficha completa</span>
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onCloseMenu();
                        onOpenQuickStock(p);
                      }}
                      className="w-full flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-amber-200 transition-colors text-left cursor-pointer"
                    >
                      <PackageCheck size={14} className="text-amber-300" aria-hidden="true" />
                      <span>Ajustar stock rápido</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onCloseMenu();
                        onToggleFeatured(p.id);
                      }}
                      className="w-full flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-amber-200 transition-colors text-left cursor-pointer"
                    >
                      <Star
                        size={14}
                        className={p.isFeatured ? "fill-amber-400 text-amber-400" : "text-zinc-400"}
                        aria-hidden="true"
                      />
                      <span>{p.isFeatured ? "Quitar destacado" : "Destacar en portada"}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onCloseMenu();
                        onOpenHistory({ id: p.id, code: p.code, title: p.title });
                      }}
                      className="w-full flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-amber-200 transition-colors text-left cursor-pointer"
                    >
                      <History size={14} className="text-zinc-400" aria-hidden="true" />
                      <span>Historial de cambios</span>
                    </button>

                    <a
                      href={`/p/${String(p.code).padStart(3, "0")}`}
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                      onClick={onCloseMenu}
                      className="flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                    >
                      <ExternalLink size={14} className="text-zinc-400" aria-hidden="true" />
                      <span>Ver en tienda</span>
                    </a>

                    <div className="border-t border-zinc-800 my-1" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onCloseMenu();
                        onRequestDelete(p);
                      }}
                      className="w-full flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg text-xs text-rose-300 hover:bg-rose-950/60 hover:text-rose-200 transition-colors text-left font-semibold cursor-pointer"
                    >
                      <Trash2 size={14} className="text-rose-400" aria-hidden="true" />
                      <span>Eliminar producto...</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detalles desplegables */}
      {isDetailsExpanded && (
        <div
          id={`details-content-${p.id}`}
          className="px-3 pb-3 sm:px-4 sm:pb-3.5 pt-2.5 border-t border-zinc-800/60 space-y-3 bg-zinc-950/35 rounded-b-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
              Stock actual por color y talle
            </span>
            <button
              type="button"
              onClick={() => onOpenQuickStock(p)}
              className="text-xs font-semibold text-amber-300 hover:underline cursor-pointer"
            >
              Editar unidades →
            </button>
          </div>

          {p.colors && p.colors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {p.colors.map((col) => (
                <div
                  key={col.id || col.name}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs flex items-center gap-1.5"
                >
                  <span className="font-semibold text-zinc-200">{col.name}:</span>
                  <span className="text-zinc-300 font-mono">
                    {col.sizes?.map((sz) => `${sz.size} (${sz.stock} u.)`).join(", ") ||
                      "Sin talles"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              Stock total sin variantes: {totalStock} unidades
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1.5 text-xs border-t border-zinc-800/50">
            <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
              <span className="flex items-center gap-1.5" title="Visitas totales a la ficha del producto">
                <Eye size={13} className="text-zinc-500" aria-hidden="true" />
                <span>{p.stats?.viewsCount ?? 0} vistas</span>
              </span>
              <span className="flex items-center gap-1.5" title="Consultas iniciadas por WhatsApp">
                <MessageCircle size={13} className="text-emerald-400/80" aria-hidden="true" />
                <span>{p.stats?.whatsappClicks ?? 0} consultas WhatsApp</span>
              </span>
            </div>

            {p.status === "SOLD_OUT" && (
              <button
                type="button"
                onClick={() => onRequestDelete(p)}
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Clock size={12} aria-hidden="true" />
                <span>Archivar pieza</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
