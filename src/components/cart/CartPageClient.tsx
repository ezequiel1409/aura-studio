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
  Building2,
  Copy,
  Check,
  MessageCircle,
  RotateCcw,
  Tag,
  X,
  Banknote,
  ExternalLink,
  QrCode,
  Wallet,
} from "lucide-react";
import { useCartStore } from "../../stores/cart.store";
import { formatPrice } from "../../lib/format/currency";
import { CartStepper, CheckoutStep } from "./CartStepper";
import { DeliveryMethod } from "../../domain/order/types";
import { PaymentMethod, PaymentPreferenceResult } from "../../domain/payment/types";
import {
  buildGoogleMapsSearchUrl,
  DAY_LABELS,
  DAY_ORDER,
  DEFAULT_STORE_LOCATION,
  DEFAULT_STORE_SCHEDULE,
  formatDayRanges,
  StoreLocationConfig,
  StoreScheduleConfig,
} from "../../lib/schedule/store-schedule";

interface CartPageClientProps {
  showroomAddress?: string | null;
  storeLocation?: StoreLocationConfig;
  storeSchedule?: StoreScheduleConfig;
  whatsappNumber?: string;
  brandName?: string;
  reservationHours?: number;
}

const SHIPPING_COSTS: Record<DeliveryMethod, number> = {
  PICKUP: 0,
  HOME_DELIVERY: 450000, // $4.500 ARS
  MOTORCYCLE: 350000,    // $3.500 ARS
};

export function CartPageClient({
  showroomAddress,
  storeLocation = DEFAULT_STORE_LOCATION,
  storeSchedule = DEFAULT_STORE_SCHEDULE,
  brandName = "Aura Studio",
  whatsappNumber = "+5491100000000",
  reservationHours = 48,
}: CartPageClientProps) {
  const resHours = reservationHours || 48;
  const reservationText =
    resHours === 1
      ? "1 hora"
      : resHours < 1
      ? `${Math.round(resHours * 60)} minutos`
      : `${resHours} horas`;

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
  const [customerDni, setCustomerDni] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("TRANSFER");
  const [paymentMethods, setPaymentMethods] = useState<Array<{
    method: PaymentMethod;
    name: string;
    description: string;
    enabled: boolean;
    discountPercent?: number;
    badge?: string;
  }>>([
    {
      method: "TRANSFER",
      name: "Transferencia Bancaria",
      description: "Aboná por CBU/CVU o Alias con 10% de descuento automático.",
      enabled: true,
      discountPercent: 10,
      badge: "10% OFF",
    },
    {
      method: "MERCADOPAGO",
      name: "Mercado Pago",
      description: "Tarjetas de crédito, débito, dinero en cuenta o cuotas.",
      enabled: true,
      badge: "Inmediato",
    },
    {
      method: "CASH",
      name: "Efectivo",
      description: "Aboná en efectivo al retirar en showroom o recibir tu paquete.",
      enabled: true,
    },
    {
      method: "WHATSAPP",
      name: "Coordinar por WhatsApp",
      description: "Asistencia directa con el showroom para coordinar tu pago.",
      enabled: true,
    },
  ]);
  const [bankDetails, setBankDetails] = useState<{
    bankName?: string | null;
    accountHolder?: string | null;
    cbu?: string | null;
    alias?: string | null;
    cuit?: string | null;
    discountPercent: number;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Términos y condiciones en Revisión (Paso 3)
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Sesión de cliente autenticado y direcciones guardadas
  const [customer, setCustomer] = useState<{ id: number; name: string; email: string; phone?: string | null; dni?: string | null } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: number; label: string; address: string; city?: string | null; isDefault: boolean }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmClearPrompt, setConfirmClearPrompt] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState<{
    code: number;
    whatsappUrl: string;
    paymentPreference?: PaymentPreferenceResult;
    paymentMethod: PaymentMethod;
  } | null>(null);

  // Cupón de descuento aplicado
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type?: string;
    value?: number;
    discountCents: number;
    freeShipping?: boolean;
    message: string;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Asegurar que al iniciar en Paso 1 no queden métodos arrastrados de sesiones previas
    setDeliveryMethod("PICKUP");

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
          if (data.customer.dni) {
            setCustomerDni((prev) => (prev ? prev : data.customer.dni));
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

    // Cargar métodos de pago activos configurados para el comercio (BR-47)
    fetch("/api/payments/methods")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.methods && Array.isArray(data.methods) && data.methods.length > 0) {
          setPaymentMethods(data.methods);
          if (data.bankDetails) {
            setBankDetails(data.bankDetails);
          }
        }
      })
      .catch(() => {});
  }, [setDeliveryMethod]);

  if (!mounted) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  const totalCount = getTotalItemsCount();
  const subtotalCents = getSubtotalCents();
  const baseShippingCents = deliveryMethod === "PICKUP" ? 0 : SHIPPING_COSTS[deliveryMethod];
  const shippingCents = appliedCoupon?.freeShipping ? 0 : baseShippingCents;
  const discountCents = appliedCoupon ? appliedCoupon.discountCents : 0;

  // Bonificación por método de pago (ej: 10% OFF en transferencia, aplicable en Paso 3)
  const activeMethod = paymentMethods.find((m) => m.method === selectedPaymentMethod);
  const transferDiscountPercent =
    selectedPaymentMethod === "TRANSFER"
      ? (activeMethod?.discountPercent ?? bankDetails?.discountPercent ?? 10)
      : 0;
  const paymentDiscountCents =
    transferDiscountPercent > 0
      ? Math.round((Math.max(0, subtotalCents - discountCents) * transferDiscountPercent) / 100)
      : 0;

  const step1TotalCents = Math.max(0, subtotalCents - discountCents);
  const step2TotalCents = Math.max(0, subtotalCents - discountCents + shippingCents);
  const finalTotalCents = Math.max(0, subtotalCents - discountCents - paymentDiscountCents + shippingCents);

  const cleanPhone = whatsappNumber.replace(/\D/g, "");

  // Al volver al Paso 1 (Bolsa), reiniciar las selecciones de entrega y pago de pasos posteriores
  const handleReturnToCartStep = () => {
    setDeliveryMethod("PICKUP");
    setSelectedPaymentMethod("TRANSFER");
    setPostalCode("");
    setDeliveryNotes("");
    setPostalCodeInput("");
    setEstimatedShippingNotice(null);
    setErrorMessage(null);
    setCurrentStep("cart");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError(null);
    setIsValidatingCoupon(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim(),
          email: customerEmail.trim() || customer?.email || undefined,
          phone: customerPhone.trim() || customer?.phone || undefined,
          subtotalCents,
          shippingCents: baseShippingCents,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCouponError(data.error || "Cupón no válido.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data.result);
        setCouponError(null);
      }
    } catch {
      setCouponError("No se pudo validar el cupón en este momento.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const handleEstimateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCodeInput.trim()) return;
    setEstimatedShippingNotice(
      `CP ${postalCodeInput.trim()}: Envío a domicilio por correo aprox. $4.500 (3-5 días) · Retiro en showroom GRATIS hoy.`
    );
  };

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
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

    const dniDigits = customerDni.replace(/\D/g, "");
    if (!dniDigits || dniDigits.length < 6) {
      setErrorMessage("Por favor ingresá un número de DNI válido (mínimo 6 dígitos).");
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
      const idempotencyKey = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          idempotencyKey,
          customerName: customerName.trim(),
          customerDni: customerDni.replace(/\D/g, "") || customer?.dni || "",
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || customer?.email || null,
          customerId: customer?.id || null,
          deliveryMethod,
          deliveryAddress: deliveryAddress.trim() || null,
          deliveryNotes: deliveryNotes.trim() ? `${deliveryNotes.trim()}` : null,
          shippingCents,
          discountCents,
          paymentMethod: selectedPaymentMethod,
          paymentDiscountCents,
          couponCode: appliedCoupon?.code || null,
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

      const confirmedPaymentMethod = selectedPaymentMethod;

      setOrderSuccess({
        code: data.order.code,
        whatsappUrl: data.whatsappUrl,
        paymentPreference: data.paymentPreference,
        paymentMethod: confirmedPaymentMethod,
      });

      // Limpiar bolsa y reiniciar métodos elegidos para próximas compras
      clearCart();
      setSelectedPaymentMethod("TRANSFER");
      setAppliedCoupon(null);
      setCouponInput("");
      setDeliveryNotes("");
      setPostalCode("");
      setPostalCodeInput("");
      setEstimatedShippingNotice(null);

      // Si es Mercado Pago, redirigir a la preferencia de cobro
      if (confirmedPaymentMethod === "MERCADOPAGO" && data.paymentPreference?.paymentUrl) {
        window.location.href = data.paymentPreference.paymentUrl;
        return;
      }

      // Si es WhatsApp, abrir chat directamente
      if (confirmedPaymentMethod === "WHATSAPP" && typeof window !== "undefined" && data.whatsappUrl) {
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
          if (step === "cart") handleReturnToCartStep();
          if (step === "shipping" && items.length > 0) {
            setSelectedPaymentMethod("TRANSFER");
            setCurrentStep("shipping");
          }
        }}
      />

      {/* Pantalla de Éxito al finalizar el pedido */}
      {orderSuccess ? (
        <div className="rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-10 text-center shadow-xs max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-serif text-2xl sm:text-3xl font-light text-stone-900">
            ¡Pedido #{orderSuccess.code.toString().padStart(3, "0")} Registrado!
          </h1>

          {/* TRANSFERENCIA BANCARIA */}
          {orderSuccess.paymentMethod === "TRANSFER" ? (
            <div className="mt-5 space-y-4 text-left">
              <p className="text-xs sm:text-sm text-stone-600 text-center">
                Para confirmar la reserva de tus prendas con el <strong>10% OFF</strong>, realizá la transferencia con los siguientes datos:
              </p>

              <div className="rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-4 text-xs space-y-2.5 text-stone-800">
                <div className="flex items-center justify-between border-b border-[#e7e2da] pb-2 font-semibold text-stone-900">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-[#926a3c]" />
                    Datos de la Cuenta Bancaria
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Transferencia
                  </span>
                </div>

                {bankDetails?.bankName && (
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Banco:</span>
                    <span className="font-medium text-stone-900">{bankDetails.bankName}</span>
                  </div>
                )}

                {bankDetails?.accountHolder && (
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Titular:</span>
                    <span className="font-medium text-stone-900">{bankDetails.accountHolder}</span>
                  </div>
                )}

                {bankDetails?.cuit && (
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">CUIT:</span>
                    <span className="font-mono text-stone-900">{bankDetails.cuit}</span>
                  </div>
                )}

                {bankDetails?.alias && (
                  <div className="flex items-center justify-between py-1.5 border-t border-[#e7e2da]/60">
                    <span className="text-stone-500">Alias:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">{bankDetails.alias}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankDetails.alias || "", "alias")}
                        className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-stone-700 border border-stone-200 hover:bg-stone-50 cursor-pointer"
                      >
                        {copiedField === "alias" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {bankDetails?.cbu && (
                  <div className="flex items-center justify-between py-1.5 border-t border-[#e7e2da]/60">
                    <span className="text-stone-500">CBU / CVU:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-stone-900">{bankDetails.cbu}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankDetails.cbu || "", "cbu")}
                        className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-stone-700 border border-stone-200 hover:bg-stone-50 cursor-pointer"
                      >
                        {copiedField === "cbu" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between py-1.5 border-t border-[#e7e2da]/60">
                  <span className="text-stone-500">Referencia / Concepto:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900">
                      ORD-{orderSuccess.code.toString().padStart(3, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(`ORD-${orderSuccess.code.toString().padStart(3, "0")}`, "ref")
                      }
                      className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-medium text-stone-700 border border-stone-200 hover:bg-stone-50 cursor-pointer"
                    >
                      {copiedField === "ref" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  Paso importante para finalizar
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Una vez transferido, tocá el botón verde abajo para enviarnos el comprobante por WhatsApp. Tus prendas quedarán reservadas inmediatamente.
                </p>
              </div>
            </div>
          ) : orderSuccess.paymentMethod === "MERCADOPAGO" ? (
            /* MERCADO PAGO */
            <div className="mt-5 space-y-4 text-center">
              <p className="text-xs sm:text-sm text-stone-600">
                Tu orden fue registrada. Podés completar el pago de forma segura a través de Mercado Pago con tarjetas de crédito, débito o dinero en cuenta.
              </p>
              {orderSuccess.paymentPreference?.paymentUrl && (
                <div className="pt-2">
                  <a
                    href={orderSuccess.paymentPreference.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-xs font-bold text-white uppercase tracking-wider shadow-sm hover:bg-sky-600 transition-colors"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Pagar con Mercado Pago ahora</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : orderSuccess.paymentMethod === "CASH" ? (
            /* EFECTIVO */
            <div className="mt-5 space-y-3 text-left">
              <p className="text-xs sm:text-sm text-stone-600 text-center">
                Abonarás en efectivo al retirar en nuestro showroom o al momento de recibir el paquete en tu domicilio.
              </p>
              <div className="rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3.5 text-xs text-stone-700 space-y-1.5">
                <div className="flex items-center gap-2 text-stone-900 font-semibold">
                  <Clock className="h-4 w-4 text-[#926a3c]" />
                  <span>Reserva por 30 minutos</span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Apartamos tus prendas en showroom. Coordinamos los detalles por WhatsApp para preparar tu entrega.
                </p>
              </div>
            </div>
          ) : (
            /* WHATSAPP POR DEFECTO */
            <div className="mt-5 space-y-3">
              <p className="mx-auto max-w-md text-xs sm:text-sm leading-relaxed text-stone-600">
                Tu reserva ha sido registrada en nuestro sistema. Abrimos una conversación directa en WhatsApp para coordinar el pago y confirmar los detalles de entrega.
              </p>
              <div className="rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3.5 text-xs text-stone-700 max-w-md mx-auto text-left space-y-1.5">
                <div className="flex items-center gap-2 text-stone-900 font-semibold">
                  <Clock className="h-4 w-4 text-[#926a3c]" />
                  <span>¿Qué pasa ahora?</span>
                </div>
                <p className="text-[11px] text-stone-600">
                  Te respondemos en menos de 2 horas en horario de showroom para confirmar el apartado de tus prendas y pasarte los datos de pago.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={orderSuccess.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-sm hover:bg-[#20bd5a] transition-colors cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>
                {orderSuccess.paymentMethod === "TRANSFER"
                  ? "Enviar Comprobante por WhatsApp"
                  : "Abrir WhatsApp"}
              </span>
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

                  {appliedCoupon && discountCents > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Cupón ({appliedCoupon.code}):
                      </span>
                      <span className="font-mono font-bold">-{formatPrice(discountCents, "ARS")}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="font-medium text-stone-500">Se calcula en el siguiente paso</span>
                  </div>

                  <div className="border-t border-[#e7e2da] pt-3.5 flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900 text-sm">Total:</span>
                    <span className="font-serif text-3xl font-bold text-stone-900 tracking-tight font-lining-nums">
                      {formatPrice(step1TotalCents, "ARS")}
                    </span>
                  </div>
                </div>

                {/* Input de Cupón de Descuento */}
                <div className="border-t border-[#e7e2da] pt-3">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="font-mono font-bold">{appliedCoupon.code}</span>
                        <span className="text-[11px] text-emerald-700 truncate">({appliedCoupon.message})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        title="Quitar cupón"
                        className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                        ¿Tenés un cupón de descuento?
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponError(null);
                          }}
                          placeholder="Ingresa tu código de descuento"
                          className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-base sm:text-xs font-mono font-bold uppercase text-stone-900 placeholder-stone-400 focus-visible:outline-2 focus-visible:outline-stone-900"
                        />
                        <button
                          type="submit"
                          disabled={isValidatingCoupon || !couponInput.trim()}
                          className="rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aplicar"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                      )}
                    </form>
                  )}
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
                    onClick={handleReturnToCartStep}
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
                      <div className="mt-3 rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3.5 text-xs text-stone-700 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-stone-900">Dirección de Retiro:</p>
                            <p className="mt-0.5">
                              {showroomAddress ||
                                [
                                  storeLocation.streetAddress,
                                  storeLocation.locality,
                                  storeLocation.province,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                            </p>
                          </div>
                          <a
                            href={buildGoogleMapsSearchUrl(storeLocation)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-800 hover:bg-stone-50"
                          >
                            <MapPin className="h-3.5 w-3.5 text-[#926a3c]" />
                            <span>Cómo llegar</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        </div>

                        <div className="border-t border-[#e7e2da] pt-2">
                          <p className="font-semibold text-stone-900 mb-1">
                            Horarios de retiro en el local:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                            {DAY_ORDER.map((dayKey) => {
                              const sourceList = storeSchedule.separatePickupHours
                                ? storeSchedule.pickupHours
                                : storeSchedule.openingHours;
                              const dayItem = sourceList.find((d) => d.day === dayKey);
                              return (
                                <div key={dayKey} className="flex justify-between">
                                  <span className="text-stone-500">{DAY_LABELS[dayKey]}:</span>
                                  <span className="font-medium text-stone-800">
                                    {dayItem ? formatDayRanges(dayItem) : "Cerrado"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {storeSchedule.note && (
                            <p className="text-[11px] text-stone-500 mt-1.5 italic">
                              {storeSchedule.note}
                            </p>
                          )}
                        </div>
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
                        <label htmlFor="checkout-dni" className="block text-xs font-semibold text-stone-700 mb-1">
                          DNI del titular *
                        </label>
                        <input
                          id="checkout-dni"
                          type="text"
                          inputMode="numeric"
                          required
                          value={customerDni}
                          onChange={(e) => setCustomerDni(e.target.value)}
                          placeholder="Ej: 40123456"
                          className="w-full rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      <div>
                        <label htmlFor="checkout-email" className="block text-xs font-semibold text-stone-700 mb-1">
                          Correo Electrónico (recibo y seguimiento) *
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

                  {errorMessage && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-[#e7e2da] pt-5">
                    <button
                      type="button"
                      onClick={handleReturnToCartStep}
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
                  {appliedCoupon && discountCents > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Cupón ({appliedCoupon.code}):
                      </span>
                      <span className="font-mono font-bold">-{formatPrice(discountCents, "ARS")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="font-medium text-stone-900">
                      {shippingCents === 0 ? "Gratis" : formatPrice(shippingCents, "ARS")}
                    </span>
                  </div>
                  <div className="border-t border-[#e7e2da] pt-3 flex justify-between items-baseline">
                    <span className="font-semibold text-stone-900 text-sm">Total:</span>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                      {formatPrice(step2TotalCents, "ARS")}
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
                    onClick={() => {
                      setSelectedPaymentMethod("TRANSFER");
                      setCurrentStep("shipping");
                    }}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-950 underline cursor-pointer"
                  >
                    Editar
                  </button>
                </div>
                <p className="text-stone-800">
                  {customerName} · DNI {customerDni} · {customerPhone} · {customerEmail}
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
                    onClick={() => {
                      setSelectedPaymentMethod("TRANSFER");
                      setCurrentStep("shipping");
                    }}
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
                    disabled={isSubmitting}
                    onClick={handleReturnToCartStep}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-950 underline cursor-pointer disabled:opacity-50"
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

              {/* Selector de Método de Pago (BR-47) */}
              <div className="border-t border-[#e7e2da] pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
                    Método de Pago
                  </span>
                  {transferDiscountPercent > 0 && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {transferDiscountPercent}% OFF con Transferencia
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {paymentMethods
                    .filter((m) => m.enabled)
                    .map((m) => {
                      const isSelected = selectedPaymentMethod === m.method;
                      return (
                        <label
                          key={m.method}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs transition-all ${
                            isSubmitting
                              ? "opacity-60 pointer-events-none cursor-not-allowed"
                              : "cursor-pointer"
                          } ${
                            isSelected
                              ? "border-stone-900 bg-stone-50/70 shadow-2xs ring-1 ring-stone-900"
                              : "border-[#e7e2da] hover:border-stone-300 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={m.method}
                            checked={isSelected}
                            disabled={isSubmitting}
                            onChange={() => setSelectedPaymentMethod(m.method)}
                            className="mt-0.5 accent-stone-900"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 font-medium text-stone-900">
                              {m.method === "TRANSFER" && <Building2 className="h-4 w-4 text-[#926a3c] shrink-0" />}
                              {m.method === "MERCADOPAGO" && <CreditCard className="h-4 w-4 text-sky-600 shrink-0" />}
                              {m.method === "PAYWAY" && <CreditCard className="h-4 w-4 text-indigo-600 shrink-0" />}
                              {m.method === "GETNET" && <CreditCard className="h-4 w-4 text-rose-600 shrink-0" />}
                              {m.method === "MODO" && <QrCode className="h-4 w-4 text-teal-600 shrink-0" />}
                              {m.method === "GOOGLEPAY" && <Wallet className="h-4 w-4 text-amber-500 shrink-0" />}
                              {m.method === "CASH" && <Banknote className="h-4 w-4 text-emerald-600 shrink-0" />}
                              {m.method === "WHATSAPP" && <MessageCircle className="h-4 w-4 text-[#25D366] shrink-0" />}
                              <span className="truncate">{m.name}</span>
                              {m.badge && (
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                                    m.method === "TRANSFER"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-sky-100 text-sky-800"
                                  }`}
                                >
                                  {m.badge}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-stone-500 leading-normal">
                              {m.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Total final */}
              <div className="border-t border-[#e7e2da] pt-4 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal piezas:</span>
                  <span>{formatPrice(subtotalCents, "ARS")}</span>
                </div>
                {appliedCoupon && discountCents > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Descuento cupón ({appliedCoupon.code}):
                    </span>
                    <span className="font-mono font-bold">-{formatPrice(discountCents, "ARS")}</span>
                  </div>
                )}
                {selectedPaymentMethod === "TRANSFER" && paymentDiscountCents > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Descuento Transferencia ({transferDiscountPercent}% OFF):
                    </span>
                    <span className="font-mono font-bold">-{formatPrice(paymentDiscountCents, "ARS")}</span>
                  </div>
                )}
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
                    disabled={isSubmitting}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 accent-stone-900 disabled:opacity-50"
                  />
                  <span>
                    Acepto los{" "}
                    <Link
                      href="/terminos"
                      target="_blank"
                      className="underline font-semibold text-stone-900 hover:text-stone-700"
                    >
                      términos de compra
                    </Link>
                    , política de reserva de piezas por {reservationText} y condiciones de cambio (15 días con etiqueta).
                  </span>
                </label>
              </div>

              {/* Aviso dinámico de procesamiento en tiempo real */}
              {isSubmitting && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-950 animate-pulse"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-950">
                      Procesando tu pedido de forma segura...
                    </p>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      Estamos reservando el stock de tus prendas y conectando con el servicio de cobro. Por favor no cierres ni recargues esta ventana.
                    </p>
                  </div>
                </div>
              )}

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
                  disabled={isSubmitting}
                  onClick={() => {
                    setSelectedPaymentMethod("TRANSFER");
                    setCurrentStep("shipping");
                  }}
                  className="w-full sm:w-auto inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer disabled:opacity-50"
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
                  ) : selectedPaymentMethod === "MERCADOPAGO" ? (
                    <>
                      <CreditCard className="h-4 w-4 text-sky-400" />
                      <span>Continuar a Mercado Pago</span>
                    </>
                  ) : selectedPaymentMethod === "PAYWAY" ? (
                    <>
                      <CreditCard className="h-4 w-4 text-indigo-400" />
                      <span>Continuar a Payway (Cuota Simple)</span>
                    </>
                  ) : selectedPaymentMethod === "GETNET" ? (
                    <>
                      <CreditCard className="h-4 w-4 text-rose-400" />
                      <span>Continuar a Getnet (Santander)</span>
                    </>
                  ) : selectedPaymentMethod === "MODO" ? (
                    <>
                      <QrCode className="h-4 w-4 text-teal-400" />
                      <span>Pagar con MODO / App Bancaria</span>
                    </>
                  ) : selectedPaymentMethod === "GOOGLEPAY" ? (
                    <>
                      <Wallet className="h-4 w-4 text-amber-400" />
                      <span>Pagar con Google Pay</span>
                    </>
                  ) : selectedPaymentMethod === "TRANSFER" ? (
                    <>
                      <Building2 className="h-4 w-4 text-[#d4af37]" />
                      <span>Confirmar y ver CBU para transferir</span>
                    </>
                  ) : selectedPaymentMethod === "CASH" ? (
                    <>
                      <Banknote className="h-4 w-4 text-emerald-400" />
                      <span>Confirmar pedido (Efectivo)</span>
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
