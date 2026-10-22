"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Store,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useCartStore } from "../../stores/cart.store";
import { formatPrice } from "../../lib/format/currency";
import { PaymentProcessorIcon } from "./PaymentProcessorIcon";

interface CartDrawerProps {
  showroomAddress?: string | null;
  whatsappNumber?: string;
  brandName?: string;
  ordersPaused?: boolean;
  ordersPausedNotice?: string | null;
}

export function CartDrawer({
  showroomAddress,
  ordersPaused = false,
  ordersPausedNotice,
}: CartDrawerProps) {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    syncStock,
    removeItem,
    clearCart,
    getTotalItemsCount,
    getSubtotalCents,
  } = useCartStore();

  const titleId = useId();
  const [confirmClearPrompt, setConfirmClearPrompt] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Array<{
    method: string;
    name: string;
    badge?: string;
  }>>([]);

  const hasOutOfStockItems = items.some((i) => i.maxStock <= 0);

  // Validar stock de las prendas al abrir el drawer
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    fetch("/api/catalog/validate-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          key: i.key,
          productId: i.productId,
          colorName: i.colorName,
          size: i.size,
          requestedQuantity: i.quantity,
        })),
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items && Array.isArray(data.items)) {
          const map: Record<string, number> = {};
          for (const it of data.items) {
            map[it.key] = it.remainingStock ?? (it.available ? 1 : 0);
          }
          syncStock(map);
        }
      })
      .catch(() => {});
  }, [isOpen, syncStock]);

  // Consultar métodos de pago activos configurados en el backoffice
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/payments/methods")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.methods && Array.isArray(data.methods)) {
          setPaymentMethods(data.methods.filter((m: { enabled?: boolean }) => m.enabled !== false));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Cerrar con Escape y bloquear scroll del body
  useEffect(() => {
    if (!isOpen) {
      setConfirmClearPrompt(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const totalCount = getTotalItemsCount();
  const subtotalCents = getSubtotalCents();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      {/* Fondo clicable para cerrar */}
      <div
        className="fixed inset-0"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Panel lateral / Drawer */}
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-[#faf8f5] shadow-2xl border-l border-[#e7e2da] z-10 animate-in slide-in-from-right duration-300">
        {/* Cabecera del Drawer */}
        <div className="flex items-center justify-between border-b border-[#e7e2da] px-6 py-4 bg-white/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-stone-900" aria-hidden="true" />
            <h2 id={titleId} className="font-serif text-lg font-medium text-stone-900 tracking-wide">
              Tu bolsa
            </h2>
            {totalCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#f2ece2] px-2 text-xs font-semibold text-stone-800">
                {totalCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar bolsa de compras"
            className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          /* Estado Vacío */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f2eb] text-[#926a3c]">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <p className="mt-4 font-serif text-xl font-light text-stone-900">
              Tu bolsa está vacía
            </p>
            <p className="mt-2 text-xs text-stone-500 max-w-xs leading-relaxed">
              Aún no has agregado ninguna prenda a tu bolsa. Recorré el catálogo para descubrir nuestras piezas exclusivas de showroom.
            </p>
            <button
              type="button"
              onClick={closeCart}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
            >
              <span>Explorar piezas</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Vista única de "Tu bolsa" (Paso 1 de /carrito, sin pasos extra dentro del drawer) */
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Subcabecera con Vaciar bolsa */}
              <div className="flex items-center justify-between pb-2 border-b border-[#e7e2da]">
                <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                  Artículos seleccionados ({totalCount})
                </span>

                {confirmClearPrompt ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-500">¿Vaciar bolsa?</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearCart();
                        setConfirmClearPrompt(false);
                      }}
                      className="font-bold text-rose-700 hover:underline cursor-pointer"
                    >
                      Sí, vaciar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearPrompt(false)}
                      className="text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearPrompt(true)}
                    className="text-xs font-medium text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Vaciar bolsa
                  </button>
                )}
              </div>

              {/* Lista de Prendas */}
              <ul className="divide-y divide-[#e7e2da]/70" role="list">
                {items.map((item) => {
                  const isItemOutOfStock = item.maxStock <= 0;
                  return (
                    <li key={item.key} className="py-4 flex gap-3.5 items-start">
                      {/* Foto con proporción 4:5 */}
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-[#e7e2da] bg-[#f5f2eb]">
                        {item.photoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.photoUrl}
                            alt={item.title || "Prenda"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Detalles de la Pieza */}
                      <div className="flex flex-1 flex-col justify-between self-stretch">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-medium text-stone-400 block">
                                  SKU: {item.formattedCode}
                                </span>
                                {isItemOutOfStock && (
                                  <span className="inline-flex items-center rounded-md bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                    Sin stock
                                  </span>
                                )}
                              </div>
                              <Link
                                href={`/p/${item.code.toString().padStart(3, "0")}`}
                                onClick={closeCart}
                                className="font-serif text-sm sm:text-base font-semibold text-stone-900 hover:text-stone-700 hover:underline line-clamp-1"
                              >
                                {item.title || `Producto ${item.formattedCode}`}
                              </Link>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.key)}
                              aria-label={`Eliminar ${item.title || item.formattedCode} de la bolsa`}
                              title="Eliminar prenda de la bolsa"
                              className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer rounded-lg hover:bg-stone-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Variantes seleccionadas: Talle y Color */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
                            <span className="rounded-md border border-[#e7e2da] bg-white px-2 py-0.5 font-medium">
                              Talle: <strong>{item.size}</strong>
                            </span>
                            {item.colorName && item.colorName.toLowerCase() !== "único" && (
                              <span className="flex items-center gap-1 rounded-md border border-[#e7e2da] bg-white px-2 py-0.5 font-medium">
                                {item.hexCode && (
                                  <span
                                    className="h-2.5 w-2.5 rounded-full border border-black/20"
                                    style={{ backgroundColor: item.hexCode }}
                                  />
                                )}
                                <span>{item.colorName}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cantidad y Precio */}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          {isItemOutOfStock ? (
                            <span className="font-mono text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                              Agotado
                            </span>
                          ) : item.maxStock > 1 ? (
                            <div className="flex items-center rounded-xl border border-[#d8d2c7] bg-white">
                              <button
                                type="button"
                                disabled={item.quantity <= 1}
                                onClick={() => updateQuantity(item.key, item.quantity - 1)}
                                aria-label="Disminuir cantidad"
                                className="p-1.5 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center font-mono text-xs font-bold text-stone-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={item.quantity >= item.maxStock}
                                onClick={() => updateQuantity(item.key, item.quantity + 1)}
                                aria-label="Aumentar cantidad"
                                className={`p-1.5 transition-colors cursor-pointer ${
                                  item.quantity >= item.maxStock
                                    ? "text-stone-300 cursor-not-allowed"
                                    : "text-stone-600 hover:text-stone-900"
                                }`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-stone-500 bg-white border border-[#e7e2da] px-2.5 py-1 rounded-lg">
                              Pieza única (1u)
                            </span>
                          )}

                          <div className="text-right">
                            {item.quantity > 1 && !isItemOutOfStock && (
                              <span className="text-[11px] text-stone-500 block">
                                {item.quantity} × {formatPrice(item.unitPriceCents, item.currency)}
                              </span>
                            )}
                            <span className={`font-serif text-base font-bold ${isItemOutOfStock ? "text-stone-400 line-through" : "text-stone-900"}`}>
                              {formatPrice(
                                item.unitPriceCents ? item.unitPriceCents * item.quantity : null,
                                item.currency
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Footer fijo con Resumen de la orden y redirección a /carrito */}
            <div className="border-t border-[#e7e2da] bg-white p-5 sm:p-6 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-stone-900">{formatPrice(subtotalCents, "ARS")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío y descuentos:</span>
                  <span className="font-medium text-stone-500">Se calculan en la bolsa</span>
                </div>
                <div className="border-t border-[#e7e2da] pt-3 flex justify-between items-baseline">
                  <span className="font-semibold text-stone-900 text-sm">Total estimado:</span>
                  <span className="font-serif text-2xl font-bold text-stone-900 tracking-tight font-lining-nums">
                    {formatPrice(subtotalCents, "ARS")}
                  </span>
                </div>
              </div>

              {/* Medios de Pago Aceptados Dinámicos (BR-47) */}
              {paymentMethods.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
                  {paymentMethods.map((m) => (
                    <span
                      key={m.method}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 border text-[11px] font-medium ${
                        m.method === "TRANSFER"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-stone-100 text-stone-700 border-stone-200"
                      }`}
                    >
                      <PaymentProcessorIcon method={m.method} className="h-3 w-3" />
                      <span>{m.name}</span>
                      {m.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          {m.badge}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Botones de Acción */}
              <div className="space-y-2 pt-1">
                {hasOutOfStockItems && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-950">Prendas sin stock en tu bolsa</p>
                      <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                        Hay piezas agotadas en tu bolsa. Por favor eliminalas para poder continuar con la compra.
                      </p>
                    </div>
                  </div>
                )}

                {ordersPaused ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <p className="font-semibold text-amber-950">Ventas online pausadas</p>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      {ordersPausedNotice || "Estamos en balance de inventario. Las compras se reanudarán en breve."}
                    </p>
                  </div>
                ) : hasOutOfStockItems ? (
                  <button
                    type="button"
                    disabled={true}
                    className="w-full flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-stone-200 text-stone-500 border border-stone-300 px-6 py-3 text-xs font-bold tracking-wider uppercase cursor-not-allowed shadow-none"
                  >
                    <span>Prendas sin stock en la bolsa</span>
                  </button>
                ) : (
                  <Link
                    href="/carrito"
                    onClick={closeCart}
                    prefetch={true}
                    className="w-full flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-stone-900 px-6 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-all hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900"
                  >
                    <span>Ir a mi bolsa y continuar</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={closeCart}
                  className="w-full flex min-h-[40px] items-center justify-center rounded-xl border border-[#e7e2da] bg-[#faf8f5] px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Seguir explorando
                </button>
              </div>

              {/* Sellos de confianza */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#926a3c] shrink-0" />
                  Stock físico garantizado
                </span>
                <span className="flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-[#926a3c] shrink-0" />
                  {showroomAddress ? "Retiro gratis en Showroom" : "Retiro en Showroom"}
                </span>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
