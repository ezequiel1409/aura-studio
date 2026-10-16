"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Trash2, X, ShoppingBag } from "lucide-react";
import { Product } from "../../domain/product/types";
import { formatPrice } from "../../lib/format/currency";

interface ConfirmDeleteProductModalProps {
  product: Product | null;
  onClose: () => void;
  onDeleted: (productId: number) => void;
}

export function ConfirmDeleteProductModal({
  product,
  onClose,
  onDeleted,
}: ConfirmDeleteProductModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, onClose]);

  if (!product) return null;

  const codeFormatted = `#${String(product.code).padStart(3, "0")}`;
  const firstPhoto = product.photos?.[0]?.keyThumb || product.photos?.[0]?.keyFull || null;

  const totalStock =
    product.colors?.reduce(
      (acc, c) => acc + c.sizes.reduce((sAcc, s) => sAcc + s.stock, 0),
      0
    ) ?? 0;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        onDeleted(product.id);
        onClose();
      } else {
        setError(data.error || "No se pudo eliminar el producto.");
        setIsDeleting(false);
      }
    } catch {
      setError("Error de conexión al intentar eliminar el producto.");
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera de advertencia */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-400">
              <AlertTriangle size={20} aria-hidden="true" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 block">
                Acción Destructiva
              </span>
              <h2
                id="confirm-delete-title"
                className="text-base sm:text-lg font-bold text-zinc-100"
              >
                ¿Deseas confirmar borrar el producto?
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cancelar y cerrar modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Ficha Resumen del Producto a Eliminar */}
        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Estás a punto de remover este producto entero del catálogo y showroom. Esta operación no se puede deshacer.
          </p>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5 flex items-center gap-3.5">
            {firstPhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={firstPhoto}
                alt={product.title || `Prenda ${codeFormatted}`}
                className="h-16 w-16 rounded-lg object-cover border border-zinc-800 shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                <ShoppingBag size={24} aria-hidden="true" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-800/60 px-1.5 py-0.5 rounded-md">
                  {codeFormatted}
                </span>
                <span className="text-[11px] text-zinc-500">
                  Stock: {totalStock} u.
                </span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-100 truncate mt-1">
                {product.title || "Prenda sin título"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {product.priceCents
                  ? formatPrice(product.priceCents, product.currency)
                  : "Sin precio asignado"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 text-[11px] text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Nota de auditoría:</strong> Su código correlativo no será reutilizado para preservar la integridad del histórico y los pedidos asociados.
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs"
            >
              {error}
            </div>
          )}
        </div>

        {/* Acciones de Confirmación (Step de decisión) */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                <span>Borrando producto...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} aria-hidden="true" />
                <span>Sí, borrar producto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

