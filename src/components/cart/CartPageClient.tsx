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
  User,
  MapPin,
  Clock,
  CreditCard,
  MessageCircle,
  RotateCcw,
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

const SHIPPING_COSTS: Record<DeliveryMethod, number> = {
  PICKUP: 0,
  HOME_DELIVERY: 450000, // $4.500 ARS
  MOTORCYCLE: 350000,    // $3.500 ARS
};

export function CartPageClient({
  showroomAddress,
  brandName = "Aura Studio",
  whatsappNumber = "+5491100000000",
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

  // Estimador de CP en Paso 1
  const [postalCodeInput, setPostalCodeInput] = useState("");
  const [estimatedShippingNotice, setEstimatedShippingNotice] = useState<string | null>(null);

  // Datos del formulario de checkout (Paso 2)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedPaymentNote, setSelectedPaymentNote] = useState<string>("TRANSFER");

  // Términos y condiciones en Revisión (Paso 3)
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Sesión de cliente autenticado y direcciones guardadas
  const [customer, setCustomer] = useState<{ id: number; name: string; email: string; phone?: string | null } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: number; label: string; address: string; city?: string | null; isDefault: boolean }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmClearPrompt, setConfirmClearPrompt] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState<{
    code: number;
    whatsappUrl: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);

    // Intentar autocompletar si el cliente tiene sesión activa
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.customer) {
          setCustomer(data.customer);
          setCustomerName((prev) => (prev ? prev : data.customer.name));
          setCustomerEmail((prev) => (prev ? prev : data.customer.email));
          if (data.customer.phone) {
            setCustomerPhone((prev) => (prev ? prev : data.customer.phone));
          }

          // Cargar direcciones guardadas del cliente
          fetch("/api/customer/addresses")
            .then((r) => (r.ok ? r.json() : null))
            .then((addrData) => {
              if (addrData?.ok && Array.isArray(addrData.addresses)) {
                setSavedAddresses(addrData.addresses);
                const defaultAddr = addrData.addresses.find((a: { isDefault: boolean }) => a.isDefault);
                if (defaultAddr) {
                  setDeliveryAddress((prev) => (prev ? prev : defaultAddr.address));
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
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
  const shippingCents = deliveryMethod === "PICKUP" ? 0 : SHIPPING_COSTS[deliveryMethod];
  const finalTotalCents = subtotalCents + shippingCents;
  const cleanPhone = whatsappNumber.replace(/\D/g, "");

  const handleEstimateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCodeInput.trim()) return;
    setEstimatedShippingNotice(
      `CP ${postalCodeInput.trim()}: Envío a domicilio por correo aprox. $4.500 (3-5 días) · Retiro en showroom GRATIS hoy.`
    );
  };

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

    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setErrorMessage("Por favor ingresá un correo electrónico válido para recibir el recibo del pedido.");
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
    if (!acceptTerms) {
      setErrorMessage("Debés aceptar las condiciones de reserva y política de cambios para continuar.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || customer?.email || null,
          customerId: customer?.id || null,
          deliveryMethod,
          deliveryAddress: deliveryAddress.trim() || null,
          deliveryNotes: deliveryNotes.trim() ? `${deliveryNotes.trim()} [Medio: ${selectedPaymentNote}]` : `[Medio: ${selectedPaymentNote}]`,
          shippingCents,
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
      setErrorMessage(err instanceof Error ? err.message : "Ocurrió un error inesperado al registrar el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
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
        <div className="rounded-2xl border border-[#e7e2da] bg-white p-8 sm:p-12 text-center shadow-xs max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-serif text-2xl sm:text-3xl font-light text-stone-900">
            ¡Pedido #{orderSuccess.code.toString().padStart(3, "0")} Registrado!
          </h1>
          <p className="mx-auto mt-3 max-w-md text-xs sm:text-sm leading-relaxed text-stone-600">
            Tu reserva ha sido registrada en nuestro sistema. Abrimos una conversación directa en WhatsApp para coordinar el pago (transferencia, Mercado Pago o efectivo al retirar) y confirmar los detalles de entrega.
          </p>

          <div className="mt-4 rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3.5 text-xs text-stone-700 max-w-md mx-auto text-left space-y-1.5">
            <div className="flex items-center gap-2 text-stone-900 font-semibold">
              <Clock className="h-4 w-4 text-[#926a3c]" />
              <span>¿Qué pasa ahora?</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Te respondemos en menos de 2 horas en horario de showroom para confirmar el apartado de tus prendas y pasarte los datos de pago.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={orderSuccess.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-sm hover:bg-[#20bd5a] transition-colors cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Abrir WhatsApp</span>
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
        /* Estado Vacío de la Bolsa */
        <div className="rounded-2xl border border-[#e7e2da] bg-white p-8 sm:p-16 text-center shadow-xs max-w-xl mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f2eb] text-[#926a3c]">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-serif text-2xl font-light text-stone-900 sm:text-3xl">
            Tu bolsa está vacía
          </h1>
          <p className="mx-auto mt-3 max-w-md text-xs sm:text-sm leading-relaxed text-stone-500">
            Aún no has agregado ninguna prenda a tu bolsa. Recorré el catálogo para descubrir nuestras piezas exclusivas de showroom.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-stone-900 px-7 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900 shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Explorar piezas</span>
            </Link>
          </div>
        </div>
      ) : (
        /* CONTENIDO DE LOS PASOS */
        <div>
          {/* PASO 1: TU BOLSA */}
          {currentStep === "cart" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Columna Izquierda: Lista de Piezas (8 cols) */}
              <div className="lg:col-span-8 rounded-2xl border border-[#e7e2da] bg-white p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-[#e7e2da]">
                  <div className="flex items-center gap-2">
                    <h1 className="font-serif text-xl sm:text-2xl font-light text-stone-900">
                      Tu bolsa
                    </h1>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#f2ece2] px-2 text-xs font-semibold text-stone-800">
                      {totalCount}
                    </span>
                  </div>

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

                {/* Aviso de Reserva */}
                <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900">
                  <Clock className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Reserva de pieza única:</strong> Tu selección queda apartada por 30 minutos mientras confirmamos la entrega.
                  </span>
                </div>

                {/* Lista de Prendas */}
                <ul className="divide-y divide-[#e7e2da]/70 mt-3" role="list">
                  {items.map((item) => (
                    <li key={item.key} className="py-5 flex gap-4 sm:gap-6 items-start">
                      {/* Foto con proporción 4:5 */}
                      <div className="h-24 w-20 sm:h-28 sm:w-22 shrink-0 overflow-hidden rounded-xl border border-[#e7e2da] bg-[#f5f2eb]">
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

                      {/* Detalles de la Pieza */}
                      <div className="flex flex-1 flex-col justify-between self-stretch">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[11px] font-mono font-medium text-stone-400">
                                SKU: {item.formattedCode}
                              </span>
                              <Link
                                href={`/p/${item.code.toString().padStart(3, "0")}`}
                                className="block font-serif text-base sm:text-lg font-semibold text-stone-900 hover:text-stone-700 hover:underline"
                              >
                                {item.title || `Producto ${item.formattedCode}`}
                              </Link>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.key)}
                              aria-label={`Eliminar ${item.title || item.formattedCode} de la bolsa`}
                              title="Eliminar prenda de la bolsa"
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

                        {/* Cantidad y Precios (sin duplicaciones innecesarias) */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          {item.maxStock > 1 ? (
                            <div className="flex items-center rounded-xl border border-[#d8d2c7] bg-[#faf8f5]">
                              <button
                                type="button"
                                disabled={item.quantity <= 1}
                                onClick={() => updateQuantity(item.key, item.quantity - 1)}
                                aria-label="Disminuir cantidad"
                                className="p-2 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
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
                                className={`p-2 transition-colors cursor-pointer ${
                                  item.quantity >= item.maxStock
                                    ? "text-stone-300 cursor-not-allowed"
                                    : "text-stone-600 hover:text-stone-900"
                                }`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-stone-500 bg-[#faf8f5] border border-[#e7e2da] px-2.5 py-1 rounded-lg">
                              Pieza única (1u)
                            </span>
                          )}

                          <div className="text-right">
                            {item.quantity > 1 && (
                              <span className="text-[11px] text-stone-500 block">
                                {item.quantity} × {formatPrice(item.unitPriceCents, item.currency)}
                              </span>
                            )}
                            <span className="font-serif text-lg sm:text-xl font-bold text-stone-900">
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

                {/* Calculador de envío por CP en Paso 1 */}
                <div className="mt-6 pt-5 border-t border-[#e7e2da]">
                  <form onSubmit={handleEstimateShipping} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <label htmlFor="shipping-cp" className="text-xs font-medium text-stone-700 whitespace-nowrap">
                      Calcular envío:
                    </label>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        id="shipping-cp"
                        type="text"
                        value={postalCodeInput}
                        onChange={(e) => setPostalCodeInput(e.target.value)}
                        placeholder="Código Postal (ej: 1425)"
                        className="rounded-xl border border-[#d8d2c7] bg-[#faf8f5] px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-none w-36"
                      />
                      <button
                        type="submit"
                        className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 cursor-pointer"
                      >
                        Calcular
                      </button>
                    </div>
                  </form>
                  {estimatedShippingNotice && (
                    <p className="mt-2 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      {estimatedShippingNotice}
                    </p>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Tarjeta de Resumen (4 cols) */}
              <div className="lg:col-span-4 rounded-2xl border border-[#e7e2da] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <h2 className="font-serif text-lg font-medium text-stone-900 border-b border-[#e7e2da] pb-3">
                  Resumen de la orden
                </h2>

                <div className="space-y-2.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-stone-900">{formatPrice(subtotalCents, "ARS")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="font-medium text-stone-500">Se calcula en el siguiente paso</span>
                  </div>

                  <div className="border-t border-[#e7e2da] pt-3.5 flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900 text-sm">Total:</span>
                    <span className="font-serif text-3xl font-bold text-stone-900 tracking-tight">
                      {formatPrice(subtotalCents, "ARS")}
                    </span>
                  </div>
                </div>

                {/* Botón destacado: Continuar con la reserva */}
                <button
                  type="button"
                  onClick={handleProceedToShipping}
                  className="w-full flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-stone-900 px-6 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-all hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer active:scale-98"
                >
                  <span>Continuar con la reserva</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {/* Medios de Pago Aceptados */}
                <div className="border-t border-[#e7e2da] pt-4 space-y-2">
                  <span className="block text-[10px] font-semibold tracking-wider uppercase text-stone-500">
                    Medios de pago coordinados:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-stone-600">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 border border-stone-200">Transferencia</span>
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 border border-stone-200">Mercado Pago</span>
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 border border-stone-200">Efectivo en Showroom</span>
                  </div>
                </div>

                <div className="border-t border-[#e7e2da] pt-3 space-y-2 text-[11px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#926a3c] shrink-0" />
                    <span>Reserva en stock físico garantizado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-[#926a3c] shrink-0" />
                    <span>Retiro gratuito en Showroom Palermo</span>
                  </div>
                </div>

                {/* ¿Dudas? WhatsApp */}
                <div className="pt-2 text-center">
                  <a
                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      "¡Hola! Tengo una duda antes de finalizar mi reserva en la tienda online."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-emerald-700 font-medium"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>¿Dudas? Escribinos por WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: ENTREGA Y DATOS (Con Resumen Persistente) */}
          {currentStep === "shipping" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Formulario de Datos (8 cols) */}
              <div className="lg:col-span-8 rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-2xs">
                <div className="mb-6 flex items-center justify-between border-b border-[#e7e2da] pb-4">
                  <div>
                    <h1 className="font-serif text-2xl font-light text-stone-900">
                      Entrega y tus datos
                    </h1>
                    <p className="text-xs text-stone-500 mt-1">
                      Elegí cómo querés recibir tu pieza e ingresá tus datos de contacto.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("cart")}
                    className="text-xs font-medium text-stone-600 hover:text-stone-950 transition-colors cursor-pointer"
                  >
                    ← Modificar bolsa
                  </button>
                </div>

                <form onSubmit={handleProceedToPayment} className="space-y-6">
                  {/* Modalidad de Entrega con Precio y Plazo Claros */}
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
                          <span className="text-xs font-bold">Retiro Showroom</span>
                        </div>
                        <span className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Gratis · Hoy
                        </span>
                        <span className="text-[11px] opacity-75">Palermo Soho</span>
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
                        <span className="mt-1 text-xs font-semibold">
                          $4.500 · 3 a 5 días
                        </span>
                        <span className="text-[11px] opacity-75">Correo nacional</span>
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
                        <span className="mt-1 text-xs font-semibold">
                          $3.500 · En el día
                        </span>
                        <span className="text-[11px] opacity-75">CABA / AMBA</span>
                      </button>
                    </div>

                    {deliveryMethod === "PICKUP" && (
                      <div className="mt-3 rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3.5 text-xs text-stone-700">
                        <p className="font-semibold text-stone-900">Dirección del Showroom:</p>
                        <p className="mt-0.5">{showroomAddress || "Gorriti 4800, Palermo Soho, Ciudad Autónoma de Buenos Aires"}</p>
                        <p className="text-[11px] text-stone-500 mt-1">Horario: Mar a Sáb de 14:00 a 19:30 hs previa coordinación.</p>
                      </div>
                    )}
                  </div>

                  {/* Datos del Comprador */}
                  <div className="space-y-4 border-t border-[#e7e2da] pt-5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
                        Tus Datos de Contacto
                      </h2>
                      {customer && (
                        <span className="text-[11px] text-stone-500">
                          Conectado como <strong className="text-stone-800">{customer.name}</strong>
                        </span>
                      )}
                    </div>

                    {!customer && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3 text-xs text-stone-600">
                        <span>¿Ya tenés una cuenta en {brandName}?</span>
                        <Link
                          href="/cuenta/ingresar?redirect=/carrito"
                          className="font-semibold text-stone-900 hover:text-stone-700 underline underline-offset-2"
                        >
                          Iniciá sesión para autocompletar
                        </Link>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="checkout-name" className="block text-xs font-semibold text-stone-700 mb-1">
                          Nombre y Apellido *
                        </label>
                        <input
                          id="checkout-name"
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ej: Clara Benítez"
                          className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                      </div>

                      <div>
                        <label htmlFor="checkout-phone" className="block text-xs font-semibold text-stone-700 mb-1">
                          Teléfono / WhatsApp *
                        </label>
                        <input
                          id="checkout-phone"
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Ej: 11 4444-5555"
                          className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="checkout-email" className="block text-xs font-semibold text-stone-700 mb-1">
                        Correo Electrónico (para recibo y seguimiento) *
                      </label>
                      <input
                        id="checkout-email"
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="tuemail@ejemplo.com"
                        className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>

                    {(deliveryMethod === "HOME_DELIVERY" || deliveryMethod === "MOTORCYCLE") && (
                      <div className="space-y-3">
                        {savedAddresses.length > 0 && (
                          <div>
                            <span className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                              Direcciones guardadas:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {savedAddresses.map((addr) => (
                                <button
                                  key={addr.id}
                                  type="button"
                                  onClick={() => setDeliveryAddress(addr.address)}
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                                    deliveryAddress === addr.address
                                      ? "border-stone-900 bg-stone-900 text-white font-medium shadow-2xs"
                                      : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400"
                                  }`}
                                >
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{addr.label}: {addr.address}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label htmlFor="checkout-address" className="block text-xs font-semibold text-stone-700 mb-1">
                              Dirección de entrega *
                            </label>
                            <input
                              id="checkout-address"
                              type="text"
                              required
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              placeholder="Calle, número, piso y depto"
                              className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                            />
                          </div>
                          <div>
                            <label htmlFor="checkout-cp" className="block text-xs font-semibold text-stone-700 mb-1">
                              Código Postal
                            </label>
                            <input
                              id="checkout-cp"
                              type="text"
                              value={postalCode}
                              onChange={(e) => setPostalCode(e.target.value)}
                              placeholder="Ej: 1425"
                              className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="checkout-notes" className="block text-xs font-medium text-stone-700 mb-1">
                        Notas para el repartidor o consulta especial (opcional)
                      </label>
                      <textarea
                        id="checkout-notes"
                        rows={2}
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Ej: timbre negro, dejar en conserjería..."
                        className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                      />
                    </div>
                  </div>

                  {/* Método de Pago Preferido */}
                  <div className="border-t border-[#e7e2da] pt-5">
                    <label className="block font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase mb-2">
                      ¿Cómo preferís abonar? (Se coordina por WhatsApp)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${selectedPaymentNote === "TRANSFER" ? "border-stone-900 bg-stone-900 text-white font-medium" : "border-stone-200 bg-stone-50 text-stone-700"}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="TRANSFER"
                          checked={selectedPaymentNote === "TRANSFER"}
                          onChange={() => setSelectedPaymentNote("TRANSFER")}
                          className="sr-only"
                        />
                        <span>Transferencia (CBU/Alias)</span>
                      </label>

                      <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${selectedPaymentNote === "MERCADO_PAGO" ? "border-stone-900 bg-stone-900 text-white font-medium" : "border-stone-200 bg-stone-50 text-stone-700"}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="MERCADO_PAGO"
                          checked={selectedPaymentNote === "MERCADO_PAGO"}
                          onChange={() => setSelectedPaymentNote("MERCADO_PAGO")}
                          className="sr-only"
                        />
                        <span>Mercado Pago</span>
                      </label>

                      <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${selectedPaymentNote === "CASH" ? "border-stone-900 bg-stone-900 text-white font-medium" : "border-stone-200 bg-stone-50 text-stone-700"}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CASH"
                          checked={selectedPaymentNote === "CASH"}
                          onChange={() => setSelectedPaymentNote("CASH")}
                          className="sr-only"
                        />
                        <span>Efectivo en Showroom</span>
                      </label>
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
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Volver a la bolsa</span>
                    </button>

                    <button
                      type="submit"
                      className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      <span>Revisar y Confirmar</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Columna Derecha: Resumen de Pedido SIEMPRE VISIBLE (4 cols) */}
              <div className="lg:col-span-4 rounded-2xl border border-[#e7e2da] bg-white p-5 sm:p-6 shadow-2xs space-y-4 lg:sticky lg:top-24">
                <h2 className="font-serif text-lg font-medium text-stone-900 border-b border-[#e7e2da] pb-3">
                  Resumen de tu pedido
                </h2>

                <ul className="divide-y divide-[#e7e2da]/70 text-xs">
                  {items.map((i) => (
                    <li key={i.key} className="py-2.5 flex justify-between gap-2">
                      <div>
                        <span className="font-semibold text-stone-800 line-clamp-1">{i.title || i.formattedCode}</span>
                        <span className="text-[11px] text-stone-500">{i.colorName} · Talle {i.size} × {i.quantity}</span>
                      </div>
                      <span className="font-serif font-medium text-stone-900 whitespace-nowrap">
                        {formatPrice(i.unitPriceCents ? i.unitPriceCents * i.quantity : null, i.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-[#e7e2da] pt-3 space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-stone-900">{formatPrice(subtotalCents, "ARS")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="font-medium text-stone-900">
                      {shippingCents === 0 ? "Gratis" : formatPrice(shippingCents, "ARS")}
                    </span>
                  </div>
                  <div className="border-t border-[#e7e2da] pt-3 flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900 text-sm">Total:</span>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                      {formatPrice(finalTotalCents, "ARS")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: REVISIÓN Y CONFIRMACIÓN POR WHATSAPP */}
          {currentStep === "payment" && (
            <div className="max-w-2xl mx-auto rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="border-b border-[#e7e2da] pb-4">
                <h1 className="font-serif text-2xl font-light text-stone-900">
                  Revisión final de tu pedido
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  Verificá que todos los datos sean correctos antes de enviar tu orden al showroom por WhatsApp.
                </p>
              </div>

              {/* Bloque Comprador con botón Editar */}
              <div className="rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
                    Comprador & Contacto
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("shipping")}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-950 underline cursor-pointer"
                  >
                    Editar
                  </button>
                </div>
                <p className="text-stone-800">
                  {customerName} · {customerPhone} · {customerEmail}
                </p>
              </div>

              {/* Bloque Entrega con botón Editar */}
              <div className="rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
                    Método de Entrega
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("shipping")}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-950 underline cursor-pointer"
                  >
                    Editar
                  </button>
                </div>
                <p className="text-stone-800 font-medium">
                  {deliveryMethod === "HOME_DELIVERY"
                    ? `Envío a domicilio ($4.500) — ${deliveryAddress}`
                    : deliveryMethod === "MOTORCYCLE"
                    ? `Moto Express ($3.500) — ${deliveryAddress}`
                    : `Retiro gratuito en Showroom (${showroomAddress || "Palermo Soho"})`}
                </p>
                {deliveryNotes && (
                  <p className="text-[11px] text-stone-500">Indicaciones: {deliveryNotes}</p>
                )}
              </div>

              {/* Detalle de prendas con código #00X */}
              <div className="border-t border-[#e7e2da] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
                    Piezas ({totalCount} unidades)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("cart")}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-950 underline cursor-pointer"
                  >
                    Editar bolsa
                  </button>
                </div>

                <ul className="divide-y divide-[#e7e2da]/70 text-xs">
                  {items.map((i) => (
                    <li key={i.key} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-stone-900">
                          {i.formattedCode} · {i.title}
                        </span>
                        <span className="text-stone-500 block text-[11px]">
                          {i.colorName} · Talle {i.size} · Cantidad: {i.quantity}
                        </span>
                      </div>
                      <span className="font-serif font-semibold text-stone-900 text-sm">
                        {formatPrice(i.unitPriceCents ? i.unitPriceCents * i.quantity : null, i.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total final */}
              <div className="border-t border-[#e7e2da] pt-4 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal piezas:</span>
                  <span>{formatPrice(subtotalCents, "ARS")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo de envío:</span>
                  <span>{shippingCents === 0 ? "Gratis" : formatPrice(shippingCents, "ARS")}</span>
                </div>
                <div className="border-t border-[#e7e2da] pt-3 flex justify-between items-baseline text-stone-900">
                  <span className="font-serif text-lg font-medium">Total:</span>
                  <span className="font-serif text-3xl font-semibold">
                    {formatPrice(finalTotalCents, "ARS")}
                  </span>
                </div>
              </div>

              {/* Checkbox de Términos y Condiciones */}
              <div className="border-t border-[#e7e2da] pt-4">
                <label className="flex items-start gap-2.5 text-xs text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 accent-stone-900"
                  />
                  <span>
                    Acepto los términos de compra, política de reserva de piezas únicas por 30 minutos y condiciones de cambio (15 días con etiqueta).
                  </span>
                </label>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Botón de Envío */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e7e2da] pt-5">
                <button
                  type="button"
                  onClick={() => setCurrentStep("shipping")}
                  className="w-full sm:w-auto inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Editar datos</span>
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
                      <MessageCircle className="h-4 w-4 text-[#25D366]" />
                      <span>Enviar pedido por WhatsApp</span>
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
