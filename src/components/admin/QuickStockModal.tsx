"use client";

import React, { useMemo, useState } from "react";
import { Loader2, PackageCheck } from "lucide-react";
import { Product } from "../../domain/product/types";
import { formatProductCode } from "../../domain/product/rules";
import { ModalDialog } from "./ui/ModalDialog";
import { StockStepperField } from "./ui/StockStepperField";

interface VariantGroupDraft {
  colorName: string;
  hexCode?: string | null;
  sizes: Array<{ size: string; stock: number }>;
}

export interface QuickStockModalProps {
  product: Product | null;
  onClose: () => void;
  onSaved: (updatedProduct: Product) => void;
}

const LOW_STOCK_THRESHOLD = 3;

function buildInitialGroups(product: Product): VariantGroupDraft[] {
  if (product.colors && product.colors.length > 0) {
    return product.colors.map((color) => ({
      colorName: color.name,
      hexCode: color.hexCode,
      sizes:
        color.sizes && color.sizes.length > 0
          ? color.sizes.map((s) => ({
              size: s.size,
              stock: Math.max(0, Number(s.stock) || 0),
            }))
          : [{ size: product.size?.trim() || "ÚNICO", stock: 0 }],
    }));
  }

  return [
    {
      colorName: "Único",
      hexCode: null,
      sizes: [{ size: product.size?.trim() || "ÚNICO", stock: 0 }],
    },
  ];
}

interface QuickStockModalContentProps {
  product: Product;
  onClose: () => void;
  onSaved: (updatedProduct: Product) => void;
}

function QuickStockModalContent({
  product,
  onClose,
  onSaved,
}: QuickStockModalContentProps) {
  const [groups, setGroups] = useState<VariantGroupDraft[]>(() =>
    buildInitialGroups(product)
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const draftTotalStock = useMemo(
    () =>
      groups.reduce(
        (sum, group) =>
          sum + group.sizes.reduce((sSum, s) => sSum + (s.stock || 0), 0),
        0
      ),
    [groups]
  );

  const handleVariantStockChange = (
    colorIndex: number,
    sizeIndex: number,
    nextStock: number
  ) => {
    setGroups((prev) =>
      prev.map((group, gIdx) => {
        if (gIdx !== colorIndex) return group;
        return {
          ...group,
          sizes: group.sizes.map((s, sIdx) =>
            sIdx === sizeIndex
              ? { ...s, stock: Math.max(0, Math.trunc(nextStock)) }
              : s
          ),
        };
      })
    );
  };

  const handleSave = async () => {
    if (saving) return;

    const updates = groups.flatMap((group) =>
      group.sizes.map((s) => ({
        colorName: group.colorName,
        size: s.size,
        stock: Math.max(0, Math.trunc(s.stock)),
      }))
    );

    setSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/products/${product.id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.product) {
        setErrorMessage(data.error || "No se pudo actualizar el stock.");
        return;
      }
      onSaved(data.product as Product);
      onClose();
    } catch {
      setErrorMessage("Error de conexión al guardar el stock.");
    } finally {
      setSaving(false);
    }
  };

  const stockBadgeLabel =
    draftTotalStock <= 0
      ? "Sin stock (0 u.)"
      : draftTotalStock <= LOW_STOCK_THRESHOLD
        ? `Stock bajo: ${draftTotalStock} u.`
        : `${draftTotalStock} en stock`;

  const stockBadgeTone =
    draftTotalStock <= 0
      ? "bg-red-500/15 text-red-300 border-red-500/30"
      : draftTotalStock <= LOW_STOCK_THRESHOLD
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";

  return (
    <ModalDialog
      isOpen
      onClose={onClose}
      title={`Stock rápido · ${formatProductCode(product.code)}`}
      subtitle={product.title || product.rawText || undefined}
      size="md"
      closeDisabled={saving}
      closeOnBackdrop={!saving}
      closeOnEscape={!saving}
      headerIcon={
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center">
          <PackageCheck className="w-4 h-4" />
        </div>
      }
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[11px] text-zinc-400">
            {draftTotalStock <= 0
              ? "Al guardar en 0 u., la prenda pasará automáticamente a Agotada."
              : "Stock actualizado al instante en tienda y listado."}
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? "Guardando..." : "Guardar stock"}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
          <span className="text-xs font-medium text-zinc-300">Stock total proyectado</span>
          <span
            aria-live="polite"
            className={`px-2.5 py-1 rounded-full border text-xs font-bold tabular-nums ${stockBadgeTone}`}
          >
            {stockBadgeLabel}
          </span>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-medium text-red-300"
          >
            {errorMessage}
          </div>
        )}

        <div className="space-y-3">
          {groups.map((group, colorIndex) => (
            <div
              key={`${group.colorName}-${colorIndex}`}
              className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                {group.hexCode && (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: group.hexCode }}
                    aria-hidden="true"
                  />
                )}
                <span className="text-xs font-bold text-zinc-200 truncate">
                  {group.colorName}
                </span>
              </div>

              <div className="space-y-2">
                {group.sizes.map((s, sizeIndex) => (
                  <div
                    key={`${s.size}-${sizeIndex}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0 pt-2 border-t border-zinc-800/70 first:pt-0 first:border-t-0"
                  >
                    <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
                      <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-zinc-200 uppercase">
                        Talle {s.size}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {s.stock <= 0
                          ? "Sin stock"
                          : s.stock <= LOW_STOCK_THRESHOLD
                            ? "Stock bajo"
                            : "Disponible"}
                      </span>
                    </div>

                    <div className="w-full sm:w-44 min-w-0">
                      <StockStepperField
                        value={s.stock}
                        onChange={(nextVal) =>
                          handleVariantStockChange(colorIndex, sizeIndex, nextVal)
                        }
                        itemLabel={`${group.colorName} talle ${s.size}`}
                        lowStockThreshold={LOW_STOCK_THRESHOLD}
                        disabled={saving}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalDialog>
  );
}

/**
 * Editor rápido de inventario por variante en diálogo modal.
 * Utiliza terminología clara ("en stock", "Stock bajo", "Sin stock") y es 100% seguro en 320px+.
 */
export function QuickStockModal({ product, onClose, onSaved }: QuickStockModalProps) {
  if (!product) return null;

  return (
    <QuickStockModalContent
      key={product.id}
      product={product}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
