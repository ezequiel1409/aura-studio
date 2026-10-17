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
  Truck,
  Bike,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useCartStore } from "../../stores/cart.store";
import { formatPrice } from "../../lib/format/currency";
import { DeliveryMethod } from "../../domain/order/types";

interface CartDrawerProps {
  showroomAddress?: string | null;
  whatsappNumber?: string;
  brandName?: string;
}

export function CartDrawer({
  showroomAddress,
  brandName = "Aura Studio",
}: CartDrawerProps) {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    deliveryMethod,
    setDeliveryMethod,
    getTotalItemsCount,
    getSubtotalCents,
  } = useCartStore();

  const titleId = useId();

  // Formulario del comprador
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    code: number;
    whatsappUrl: string;
  } | null>(null);

  // Cerrar con Escape y bloquear scroll del body
  useEffect(() => {
    if (!isOpen) return;

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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validación básica del cliente
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage("Por favor ingresá tu nombre y apellido.");
      return;
    }

    const digits = customerPhone.replace(/\D/g, "");
    if (!digits || digits.length < 6) {
      setErrorMessage("Por favor ingresá un número de teléfono o WhatsApp válido.");
      return;
    }

    if ((deliveryMethod === "HOME_DELIVERY" || deliveryMethod === "MOTORCYCLE") && !deliveryAddress.trim()) {
      setErrorMessage("Por favor ingresá la dirección completa de entrega.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Tu bolsa está vacía.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryMethod,
          deliveryAddress: deliveryAddress.trim() || null,
          deliveryNotes: deliveryNotes.trim() || null,
          shippingCents: 0,
          items: items.map((i) => ({
            productId: i.productId,
            productCode: i.code,
            productTitle: i.title || `Producto ${i.formattedCode}`,
            colorName: i.colorName,
            size: i.size,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents || 0,
            photoUrl: i.photoUrl,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar el pedido");
      }

      // Éxito: guardar orden, limpiar carrito y abrir WhatsApp
      setOrderSuccess({
        code: data.order.code,
        whatsappUrl: data.whatsappUrl,
      });

      clearCart();

      // Abrir WhatsApp en nueva pestaña
      if (typeof window !== "undefined" && data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="flex items-center justify-between border-b border-[#e7e2da] px-6 py-4 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-stone-900" aria-hidden="true" />
            <h2 id={titleId} className="font-serif text-lg font-medium text-stone-900 tracking-wide">
              Bolsa de Compras
            </h2>
            {totalCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-stone-900 px-1.5 text-[11px] font-bold text-white">
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

        {/* Pantalla de Éxito tras enviar la orden */}
        {orderSuccess ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-serif text-2xl font-light text-stone-900">
              ¡Pedido #{orderSuccess.code.toString().padStart(3, "0")} Generado!
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
              Tu orden ha sido registrada. Se abrió una ventana con tu mensaje de WhatsApp para que confirmes los detalles con nosotros.
            </p>
            <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
              <a
                href={orderSuccess.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-sm hover:bg-[#20bd5a] transition-colors"
              >
                Abrir WhatsApp nuevamente
              </a>
              <button
                type="button"
                onClick={() => {
                  setOrderSuccess(null);
                  closeCart();
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#e7e2da] bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Seguir explorando
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Estado Vacío */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f2ece2] text-stone-400">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <p className="mt-4 font-serif text-xl font-light text-stone-800">
              Tu bolsa está vacía
            </p>
            <p className="mt-2 text-xs text-stone-500 max-w-xs">
              Explorá nuestro catálogo y sumá tus piezas preferidas para reservarlas o coordinar el envío.
            </p>
            <button
              type="button"
              onClick={closeCart}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
            >
              <span>Explorar catálogo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Contenido con Artículos y Formulario */
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Lista de productos */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e7e2da]">
                <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                  Artículos seleccionados ({totalCount})
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-medium text-stone-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Vaciar bolsa
                </button>
              </div>

              <ul className="divide-y divide-[#e7e2da]/70">
                {items.map((item) => (
                  <li key={item.key} className="py-3.5 flex gap-3.5 items-start">
                    {/* Foto o Placeholder */}
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-[#e7e2da] bg-[#f5f2eb]">
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

                    {/* Datos del producto */}
                    <div className="flex flex-1 flex-col justify-between self-stretch">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/p/${item.code.toString().padStart(3, "0")}`}
                            onClick={closeCart}
                            className="font-serif text-sm font-medium text-stone-900 hover:underline line-clamp-1"
                          >
                            {item.title || `Producto ${item.formattedCode}`}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            aria-label={`Eliminar ${item.title || item.formattedCode} de la bolsa`}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Variantes seleccionadas: Color y Talle */}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
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

                      {/* Selector de cantidad y precio */}
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-[#d8d2c7] bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            aria-label="Disminuir cantidad"
                            className="p-1.5 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
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
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="font-serif text-sm font-semibold text-stone-900">
                            {formatPrice(
                              item.unitPriceCents ? item.unitPriceCents * item.quantity : null,
                              item.currency
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Selector de Métodos de Entrega (BR-41) */}
            <div className="border-t border-[#e7e2da] p-4 sm:p-6 bg-white/50">
              <h3 className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase mb-3">
                Método de Entrega / Logística:
              </h3>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3" role="radiogroup">
                {/* 1. Retiro en Showroom */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={deliveryMethod === "PICKUP"}
                  onClick={() => setDeliveryMethod("PICKUP")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    deliveryMethod === "PICKUP"
                      ? "border-stone-900 bg-stone-900 text-white shadow-xs ring-2 ring-stone-900/10"
                      : "border-[#e7e2da] bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Store className="h-4 w-4" />
                    <span className="text-xs font-bold">Retiro</span>
                  </div>
                  <span className="mt-1 text-[10px] opacity-80">En el Showroom (Gratis)</span>
                </button>

                {/* 2. Envío a Domicilio */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={deliveryMethod === "HOME_DELIVERY"}
                  onClick={() => setDeliveryMethod("HOME_DELIVERY")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    deliveryMethod === "HOME_DELIVERY"
                      ? "border-stone-900 bg-stone-900 text-white shadow-xs ring-2 ring-stone-900/10"
                      : "border-[#e7e2da] bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4" />
                    <span className="text-xs font-bold">A Domicilio</span>
                  </div>
                  <span className="mt-1 text-[10px] opacity-80">Correo / Encomienda</span>
                </button>

                {/* 3. Motomensajería */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={deliveryMethod === "MOTORCYCLE"}
                  onClick={() => setDeliveryMethod("MOTORCYCLE")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    deliveryMethod === "MOTORCYCLE"
                      ? "border-stone-900 bg-stone-900 text-white shadow-xs ring-2 ring-stone-900/10"
                      : "border-[#e7e2da] bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Bike className="h-4 w-4" />
                    <span className="text-xs font-bold">Moto Express</span>
                  </div>
                  <span className="mt-1 text-[10px] opacity-80">Cadetería local</span>
                </button>
              </div>

              {/* Mensaje informativo de showroom si se elige retiro */}
              {deliveryMethod === "PICKUP" && showroomAddress && (
                <div className="mt-3 rounded-lg border border-[#e7e2da] bg-[#faf8f5] p-2.5 text-xs text-stone-600">
                  <p className="font-semibold text-stone-800">Punto de Retiro:</p>
                  <p className="mt-0.5">{showroomAddress}</p>
                </div>
              )}
            </div>

            {/* Formulario de Checkout */}
            <form onSubmit={handleCheckout} className="border-t border-[#e7e2da] p-4 sm:p-6 bg-white space-y-4">
              <h3 className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
                Tus Datos para el Pedido:
              </h3>

              <div>
                <label htmlFor="customer-name" className="block text-xs font-medium text-stone-700 mb-1">
                  Nombre y Apellido *
                </label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Sofía Rossi"
                  className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label htmlFor="customer-phone" className="block text-xs font-medium text-stone-700 mb-1">
                  Teléfono / WhatsApp de contacto *
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 11 2345-6789"
                  className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              {(deliveryMethod === "HOME_DELIVERY" || deliveryMethod === "MOTORCYCLE") && (
                <div>
                  <label htmlFor="delivery-address" className="block text-xs font-medium text-stone-700 mb-1">
                    Dirección completa de entrega *
                  </label>
                  <input
                    id="delivery-address"
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Calle, número, piso/depto, CP y localidad"
                    className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              )}

              <div>
                <label htmlFor="delivery-notes" className="block text-xs font-medium text-stone-700 mb-1">
                  Observaciones / Notas adicionales (opcional)
                </label>
                <textarea
                  id="delivery-notes"
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Ej: timbre 4B, horario de entrega de tarde..."
                  className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                />
              </div>

              {/* Mensaje de error si aplica */}
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Resumen financiero */}
              <div className="border-t border-[#e7e2da] pt-3.5 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal prendas:</span>
                  <span className="font-medium text-stone-900">{formatPrice(subtotalCents, "ARS")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Logística:</span>
                  <span className="font-medium text-stone-900">
                    {deliveryMethod === "PICKUP" ? "Gratis" : "A convenir con el showroom"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#e7e2da] pt-2 font-serif text-base font-semibold text-stone-900">
                  <span>Total estimado:</span>
                  <span>{formatPrice(subtotalCents, "ARS")}</span>
                </div>
              </div>

              {/* Botón de acción principal */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-all hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-stone-900"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generando pedido...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Pedido por WhatsApp</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </aside>
    </div>
  );
}
