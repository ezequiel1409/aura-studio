"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, X, ArrowRight } from "lucide-react";
import { useCartStore } from "../../stores/cart.store";

export function CartToast() {
  const { toast, isOpen, dismissToast } = useCartStore();

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      dismissToast();
    }, 4500);

    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast || isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xl">
        {/* Foto o icono */}
        <div className="relative h-12 w-10 sm:h-14 sm:w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center">
          {toast.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={toast.photoUrl}
              alt={toast.title || toast.formattedCode}
              className="h-full w-full object-cover"
            />
          ) : (
            <ShoppingBag className="h-5 w-5 text-stone-400" aria-hidden="true" />
          )}
        </div>

        {/* Detalle del producto añadido */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-wider uppercase">
              ¡Añadido a tu bolsa!
            </span>
          </div>

          <p className="mt-0.5 truncate text-xs font-serif font-medium text-stone-900">
            {toast.title || `Prenda ${toast.formattedCode}`}
          </p>

          <p className="text-[11px] text-stone-500 font-sans truncate">
            {toast.colorName && toast.colorName !== "Único" ? `${toast.colorName} · ` : ""}
            Talle {toast.size} · <strong className="text-stone-700">{toast.quantity}u</strong>
          </p>
        </div>

        {/* Botón de acción hacia /carrito y cerrar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/carrito"
            onClick={dismissToast}
            prefetch={false}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            <span>Ver bolsa</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={dismissToast}
            aria-label="Cerrar notificación"
            className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors rounded-lg focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

