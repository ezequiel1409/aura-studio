"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  Bike,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useCartStore } from "../../stores/cart.store";
import { formatPrice } from "../../lib/format/currency";
import { CartStepper, CheckoutStep } from "./CartStepper";
import { DeliveryMethod } from "../../domain/order/types";

interface CartPageClientProps {
  showroomAddress?: string | null;
  whatsappNumber?: string;
  brandName?: string;
}

export function CartPageClient({
  showroomAddress,
  brandName = "Aura Studio",
}: CartPageClientProps) {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    deliveryMethod,
    setDeliveryMethod,
    getTotalItemsCount,
    getSubtotalCents,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");

  // Datos del formulario de checkout
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  const totalCount = getTotalItemsCount();
  const subtotalCents = getSubtotalCents();

  // Validaciones antes de avanzar del Paso 1 al Paso 2
  const handleProceedToShipping = () => {
    if (items.length === 0) return;
    setErrorMessage(null);
    setCurrentStep("shipping");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Validaciones antes de avanzar del Paso 2 al Paso 3
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage("Por favor ingresá tu nombre y apellido para el pedido.");
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

    setCurrentStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Confirmar y procesar la orden en Paso 3
  const handleConfirmOrder = async () => {
    setErrorMessage(null);
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
            productTitle: i.title || `Producto #${i.formattedCode}`,
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
        throw new Error(data.error || "Error al procesar la orden.");
      }

      setOrderSuccess({
        code: data.order.code,
        whatsappUrl: data.whatsappUrl,
      });

      clearCart();

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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Barra de progreso de compra por pasos (Stepper) */}
      <CartStepper
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step === "cart") setCurrentStep("cart");
          if (step === "shipping" && items.length > 0) setCurrentStep("shipping");
        }}
      />

      {/* Pantalla de Éxito al finalizar el pedido */}
      {orderSuccess ? (
        <div className="rounded-2xl border border-[#e7e2da] bg-white p-8 sm:p-12 text-center shadow-xs max-w-xl mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-serif text-2xl sm:text-3xl font-light text-stone-900">
            ¡Pedido #{orderSuccess.code.toString().padStart(3, "0")} Registrado!
          </h1>
          <p className="mx-auto mt-3 max-w-md text-xs sm:text-sm leading-relaxed text-stone-600">
            Tu orden ha sido generada exitosamente. Se ha abierto una conversación en WhatsApp para coordinar el pago y la entrega directamente con {brandName}.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={orderSuccess.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-sm hover:bg-[#20bd5a] transition-colors"
            >
              Reabrir WhatsApp
            </a>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#e7e2da] bg-white px-6 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      ) : items.length === 0 ? (
        /* Estado Vacío de la página aislada */
        <div className="rounded-2xl border border-[#e7e2da] bg-white p-8 sm:p-16 text-center shadow-xs max-w-xl mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f2ece2] text-stone-400">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-serif text-2xl font-light text-stone-900 sm:text-3xl">
            Tu bolsa de compras está vacía
          </h1>
          <p className="mx-auto mt-3 max-w-md text-xs sm:text-sm leading-relaxed text-stone-500">
            Aún no has agregado ninguna prenda a tu pedido. Te invitamos a recorrer nuestro catálogo para descubrir nuestras piezas exclusivas.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-stone-900 px-7 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Explorar catálogo completo</span>
            </Link>
          </div>
        </div>
      ) : (
        /* CONTENIDO DE LOS PASOS */
        <div>
          {/* PASO 1: REVISIÓN DE ARTÍCULOS Y RESUMEN */}
          {currentStep === "cart" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Columna Izquierda: Lista de Artículos (8 cols) */}
              <div className="lg:col-span-8 rounded-2xl border border-[#e7e2da] bg-white p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-[#e7e2da]">
                  <div className="flex items-center gap-2">
                    <h1 className="font-serif text-xl sm:text-2xl font-light text-stone-900">
                      Artículos seleccionados
                    </h1>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#f2ece2] px-2 text-xs font-semibold text-stone-800">
                      {totalCount}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-medium text-stone-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Vaciar carrito
                  </button>
                </div>

                {/* Lista de Prendas */}
                <ul className="divide-y divide-[#e7e2da]/70 mt-2" role="list">
                  {items.map((item) => (
                    <li key={item.key} className="py-5 flex gap-4 sm:gap-6 items-start">
                      {/* Foto */}
                      <div className="h-24 w-20 sm:h-28 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-[#e7e2da] bg-[#f5f2eb]">
                        {item.photoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.photoUrl}
                            alt={item.title || "Prenda"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Detalles y Modificador de Cantidad */}
                      <div className="flex flex-1 flex-col justify-between self-stretch">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[11px] font-mono font-medium text-stone-400">
                                SKU: #{item.formattedCode}
                              </span>
                              <Link
                                href={`/p/${item.code.toString().padStart(3, "0")}`}
                                className="block font-serif text-base sm:text-lg font-medium text-stone-900 hover:underline"
                              >
                                {item.title || `Producto #${item.formattedCode}`}
                              </Link>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.key)}
                              aria-label={`Eliminar ${item.title || item.formattedCode} del carrito`}
                              className="text-stone-400 hover:text-rose-600 transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-stone-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Variantes seleccionadas */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                            <span className="rounded-md border border-[#e7e2da] bg-[#faf8f5] px-2.5 py-0.5 font-medium">
                              Talle: <strong>{item.size}</strong>
                            </span>
                            {item.colorName && item.colorName.toLowerCase() !== "único" && (
                              <span className="flex items-center gap-1.5 rounded-md border border-[#e7e2da] bg-[#faf8f5] px-2.5 py-0.5 font-medium">
                                {item.hexCode && (
                                  <span
                                    className="h-3 w-3 rounded-full border border-black/20"
                                    style={{ backgroundColor: item.hexCode }}
                                  />
                                )}
                                <span>{item.colorName}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cantidad y Precios */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center rounded-xl border border-[#d8d2c7] bg-[#faf8f5]">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.key, item.quantity - 1)}
                              aria-label="Disminuir cantidad"
                              className="p-2 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-9 text-center font-mono text-xs font-bold text-stone-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={item.quantity >= item.maxStock}
                              onClick={() => updateQuantity(item.key, item.quantity + 1)}
                              aria-label="Aumentar cantidad"
                              className={`p-2 transition-colors cursor-pointer ${
                                item.quantity >= item.maxStock
                                  ? "text-stone-300 cursor-not-allowed"
                                  : "text-stone-600 hover:text-stone-900"
                              }`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-stone-500 block">
                              Unitario: {formatPrice(item.unitPriceCents, item.currency)}
                            </span>
                            <span className="font-serif text-base sm:text-lg font-semibold text-stone-900">
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

                <div className="mt-6 pt-4 border-t border-[#e7e2da] flex items-center justify-between">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Continuar explorando el catálogo</span>
                  </Link>
                </div>
              </div>

              {/* Columna Derecha: Tarjeta de Resumen & Continuar (4 cols) */}
              <div className="lg:col-span-4 rounded-2xl border border-[#e7e2da] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <h2 className="font-serif text-lg font-medium text-stone-900 border-b border-[#e7e2da] pb-3">
                  Resumen de la orden
                </h2>

                <div className="space-y-2.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Prendas seleccionadas ({totalCount}u):</span>
                    <span className="font-medium text-stone-900">{formatPrice(subtotalCents, "ARS")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Logística estimada:</span>
                    <span className="font-medium text-stone-500">Paso siguiente</span>
                  </div>

                  <div className="border-t border-[#e7e2da] pt-3.5 flex justify-between items-baseline">
                    <span className="font-medium text-stone-800 text-sm">Total del pedido:</span>
                    <span className="font-serif text-2xl font-semibold text-stone-900">
                      {formatPrice(subtotalCents, "ARS")}
                    </span>
                  </div>
                </div>

                {/* Botón destacado: Continuar al proceso de pago */}
                <button
                  type="button"
                  onClick={handleProceedToShipping}
                  className="w-full flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-stone-900 px-6 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-all hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer scale-100 active:scale-98"
                >
                  <span>Continuar al proceso de pago</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="border-t border-[#e7e2da] pt-4 space-y-2 text-[11px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#926a3c] shrink-0" />
                    <span>Reserva directa en stock físico garantizado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-[#926a3c] shrink-0" />
                    <span>Opción de retiro gratuito en el Showroom</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: ENVÍO Y DATOS DE LOGÍSTICA */}
          {currentStep === "shipping" && (
            <div className="max-w-2xl mx-auto rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-2xs">
              <div className="mb-6 flex items-center justify-between border-b border-[#e7e2da] pb-4">
                <div>
                  <h1 className="font-serif text-2xl font-light text-stone-900">
                    Opciones de entrega y tus datos
                  </h1>
                  <p className="text-xs text-stone-500 mt-1">
                    Elegí cómo recibir tu pedido e ingresá tus datos de contacto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep("cart")}
                  className="text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
                >
                  ← Modificar prendas
                </button>
              </div>

              <form onSubmit={handleProceedToPayment} className="space-y-6">
                {/* Modalidad de Entrega */}
                <div>
                  <label className="block font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase mb-3">
                    Método de Entrega:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("PICKUP")}
                      className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                        deliveryMethod === "PICKUP"
                          ? "border-stone-900 bg-stone-900 text-white shadow-xs ring-2 ring-stone-900/10"
                          : "border-[#e7e2da] bg-white text-stone-700 hover:border-stone-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Store className="h-4 w-4" />
                        <span className="text-xs font-bold">Retiro</span>
                      </div>
                      <span className="mt-1 text-[11px] opacity-80">En el Showroom (Gratis)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("HOME_DELIVERY")}
                      className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                        deliveryMethod === "HOME_DELIVERY"
                          ? "border-stone-900 bg-stone-900 text-white shadow-xs ring-2 ring-stone-900/10"
                          : "border-[#e7e2da] bg-white text-stone-700 hover:border-stone-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4" />
                        <span className="text-xs font-bold">A Domicilio</span>
                      </div>
                      <span className="mt-1 text-[11px] opacity-80">Correo / Encomienda</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("MOTORCYCLE")}
                      className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                        deliveryMethod === "MOTORCYCLE"
                          ? "border-stone-900 bg-stone-900 text-white shadow-xs ring-2 ring-stone-900/10"
                          : "border-[#e7e2da] bg-white text-stone-700 hover:border-stone-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Bike className="h-4 w-4" />
                        <span className="text-xs font-bold">Moto Express</span>
                      </div>
                      <span className="mt-1 text-[11px] opacity-80">Cadetería local</span>
                    </button>
                  </div>

                  {deliveryMethod === "PICKUP" && showroomAddress && (
                    <div className="mt-3 rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3 text-xs text-stone-700">
                      <p className="font-semibold text-stone-900">Dirección del Showroom:</p>
                      <p className="mt-0.5">{showroomAddress}</p>
                    </div>
                  )}
                </div>

                {/* Datos del comprador */}
                <div className="space-y-4 border-t border-[#e7e2da] pt-5">
                  <h2 className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
                    Datos del Comprador
                  </h2>

                  <div>
                    <label htmlFor="checkout-name" className="block text-xs font-medium text-stone-700 mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej: Clara Benítez"
                      className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-phone" className="block text-xs font-medium text-stone-700 mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej: 11 4444-5555"
                      className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  {(deliveryMethod === "HOME_DELIVERY" || deliveryMethod === "MOTORCYCLE") && (
                    <div>
                      <label htmlFor="checkout-address" className="block text-xs font-medium text-stone-700 mb-1">
                        Dirección completa de entrega *
                      </label>
                      <input
                        id="checkout-address"
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Calle, altura, piso/depto, CP y localidad"
                        className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="checkout-notes" className="block text-xs font-medium text-stone-700 mb-1">
                      Notas o indicaciones para el repartidor (opcional)
                    </label>
                    <textarea
                      id="checkout-notes"
                      rows={2}
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Ej: timbre blanco, dejar en recepción..."
                      className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-[#e7e2da] pt-5">
                  <button
                    type="button"
                    onClick={() => setCurrentStep("cart")}
                    className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver a la bolsa</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <span>Revisar y Confirmar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PASO 3: CONFIRMACIÓN Y PAGO POR WHATSAPP */}
          {currentStep === "payment" && (
            <div className="max-w-2xl mx-auto rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="border-b border-[#e7e2da] pb-4">
                <h1 className="font-serif text-2xl font-light text-stone-900">
                  Confirmación de tu pedido
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  Revisá el resumen final antes de generar tu orden y coordinar el pago.
                </p>
              </div>

              {/* Resumen de Comprador y Envío */}
              <div className="rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-4 space-y-2 text-xs text-stone-700">
                <div>
                  <span className="font-semibold text-stone-900">Comprador: </span>
                  <span>{customerName} · {customerPhone}</span>
                </div>
                <div>
                  <span className="font-semibold text-stone-900">Método de Entrega: </span>
                  <span>
                    {deliveryMethod === "HOME_DELIVERY"
                      ? `Envío a domicilio (${deliveryAddress})`
                      : deliveryMethod === "MOTORCYCLE"
                      ? `Motomensajería express (${deliveryAddress})`
                      : `Retiro en el Showroom (${showroomAddress || "Dirección del negocio"})`}
                  </span>
                </div>
                {deliveryNotes && (
                  <div>
                    <span className="font-semibold text-stone-900">Notas: </span>
                    <span>{deliveryNotes}</span>
                  </div>
                )}
              </div>

              {/* Detalle de prendas */}
              <div className="border-t border-[#e7e2da] pt-4">
                <h2 className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase mb-3">
                  Prendas ({totalCount} unidades)
                </h2>

                <ul className="divide-y divide-[#e7e2da]/70 text-xs">
                  {items.map((i) => (
                    <li key={i.key} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-medium text-stone-900">
                          #{i.formattedCode} {i.title}
                        </span>
                        <span className="text-stone-500 block text-[11px]">
                          {i.colorName} · Talle {i.size} · Cantidad: {i.quantity}
                        </span>
                      </div>
                      <span className="font-serif font-semibold text-stone-900">
                        {formatPrice(i.unitPriceCents ? i.unitPriceCents * i.quantity : null, i.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total final */}
              <div className="border-t border-[#e7e2da] pt-4 flex justify-between items-baseline text-stone-900">
                <span className="font-serif text-lg font-medium">Total a abonar:</span>
                <span className="font-serif text-3xl font-semibold">
                  {formatPrice(subtotalCents, "ARS")}
                </span>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Botón de Confirmación */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e7e2da] pt-5">
                <button
                  type="button"
                  onClick={() => setCurrentStep("shipping")}
                  className="w-full sm:w-auto inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Editar datos de envío</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmOrder}
                  className="w-full sm:w-auto inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-stone-900 px-7 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-sm hover:bg-stone-800 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Registrando orden...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar Pedido por WhatsApp</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
