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
  Info,
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
  FileText,
  Upload,
} from "lucide-react";
import { useCartStore } from "../../stores/cart.store";
import { formatPrice } from "../../lib/format/currency";
import { CartStepper, CheckoutStep } from "./CartStepper";
import { PaymentProcessorIcon } from "./PaymentProcessorIcon";
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
  ordersPaused?: boolean;
  ordersPausedNotice?: string | null;
  initialPaymentMethods?: Array<{
    method: PaymentMethod;
    name: string;
    description: string;
    enabled: boolean;
    discountPercent?: number;
    badge?: string;
  }>;
  initialBankDetails?: {
    bankName?: string | null;
    accountHolder?: string | null;
    cbu?: string | null;
    alias?: string | null;
    cuit?: string | null;
    discountPercent?: number;
  } | null;
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
  ordersPaused = false,
  ordersPausedNotice,
  initialPaymentMethods,
  initialBankDetails,
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
    syncStock,
    removeItem,
    clearCart,
    deliveryMethod,
    setDeliveryMethod,
    getTotalItemsCount,
    getSubtotalCents,
  } = useCartStore();

  const hasOutOfStockItems = items.some((i) => i.maxStock <= 0);

  // Validar stock de las prendas en el carrito al cargar la página
  useEffect(() => {
    if (items.length === 0) return;
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
  }, [syncStock]);

  const isPickupEnabled = storeLocation.pickupEnabled !== false;
  const isHomeDeliveryEnabled = Boolean(storeLocation.homeDeliveryEnabled);
  const isMotorcycleDeliveryEnabled = Boolean(storeLocation.motorcycleDeliveryEnabled);

  const activeHomeZones = (storeLocation.homeDeliveryZones || []).filter((z) => z.enabled);
  const activeMotoZones = (storeLocation.motorcycleZones || []).filter((z) => z.enabled);

  const [selectedHomeZoneId, setSelectedHomeZoneId] = useState<string>(() => {
    return activeHomeZones[0]?.id || "";
  });
  const [selectedMotoZoneId, setSelectedMotoZoneId] = useState<string>(() => {
    return activeMotoZones[0]?.id || "";
  });

  const homeDeliveryCost = storeLocation.homeDeliveryCostCents ?? 450000;
  const motorcycleDeliveryCost = storeLocation.motorcycleDeliveryCostCents ?? 350000;

  const effectiveShippingCosts: Record<DeliveryMethod, number> = {
    PICKUP: 0,
    HOME_DELIVERY: homeDeliveryCost,
    MOTORCYCLE: motorcycleDeliveryCost,
  };

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
  const defaultInitialMethod = (initialPaymentMethods && initialPaymentMethods.length > 0)
    ? initialPaymentMethods[0].method
    : "TRANSFER";
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(defaultInitialMethod);
  const [transferReceiptFile, setTransferReceiptFile] = useState<File | null>(null);
  const [transferReceiptBase64, setTransferReceiptBase64] = useState<string | null>(null);
  const [receiptFileError, setReceiptFileError] = useState<string | null>(null);
  const [orderSuccessReceiptFile, setOrderSuccessReceiptFile] = useState<File | null>(null);
  const [isUploadingOrderSuccessReceipt, setIsUploadingOrderSuccessReceipt] = useState(false);
  const [orderSuccessReceiptError, setOrderSuccessReceiptError] = useState<string | null>(null);
  const [orderSuccessReceiptSuccess, setOrderSuccessReceiptSuccess] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<Array<{
    method: PaymentMethod;
    name: string;
    description: string;
    enabled: boolean;
    discountPercent?: number;
    badge?: string;
  }>>(initialPaymentMethods ?? []);
  const enabledPaymentMethods = paymentMethods.filter((m) => m.enabled !== false);
  const effectivePaymentMethod: PaymentMethod = enabledPaymentMethods.some((m) => m.method === selectedPaymentMethod)
    ? selectedPaymentMethod
    : (enabledPaymentMethods[0]?.method || selectedPaymentMethod || "TRANSFER");
  const [bankDetails, setBankDetails] = useState<{
    bankName?: string | null;
    accountHolder?: string | null;
    cbu?: string | null;
    alias?: string | null;
    cuit?: string | null;
    discountPercent?: number;
  } | null>(initialBankDetails ?? null);
  const [cashNotes, setCashNotes] = useState<string | null>(null);
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
    transferReceiptUrl?: string | null;
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
    // Asegurar que al iniciar el método seleccionado sea uno de los habilitados por el comercio
    if (isPickupEnabled) {
      setDeliveryMethod("PICKUP");
    } else if (isHomeDeliveryEnabled) {
      setDeliveryMethod("HOME_DELIVERY");
    } else if (isMotorcycleDeliveryEnabled) {
      setDeliveryMethod("MOTORCYCLE");
    }

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
          if (data.cashNotes) {
            setCashNotes(data.cashNotes);
          }
          const valid = data.methods.filter((m: { enabled?: boolean }) => m.enabled !== false);
          if (valid.length > 0 && !valid.some((m: { method: PaymentMethod }) => m.method === selectedPaymentMethod)) {
            setSelectedPaymentMethod(valid[0].method);
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

  const currentHomeZone = activeHomeZones.find((z) => z.id === selectedHomeZoneId) || activeHomeZones[0];
  const currentMotoZone = activeMotoZones.find((z) => z.id === selectedMotoZoneId) || activeMotoZones[0];

  const homeFreeThreshold = storeLocation.homeDeliveryFreeThresholdCents ?? storeLocation.freeShippingFromCents ?? null;
  const isHomeFreeShipping = Boolean(homeFreeThreshold && subtotalCents >= homeFreeThreshold);

  const effectiveHomeDeliveryCost = isHomeFreeShipping
    ? 0
    : currentHomeZone
    ? currentHomeZone.costCents
    : homeDeliveryCost;

  const effectiveMotoCost = currentMotoZone
    ? currentMotoZone.costCents
    : motorcycleDeliveryCost;

  let baseShippingCents = 0;
  if (deliveryMethod === "PICKUP") {
    baseShippingCents = 0;
  } else if (deliveryMethod === "HOME_DELIVERY") {
    baseShippingCents = effectiveHomeDeliveryCost;
  } else if (deliveryMethod === "MOTORCYCLE") {
    baseShippingCents = effectiveMotoCost;
  }
  const shippingCents = appliedCoupon?.freeShipping ? 0 : baseShippingCents;
  const discountCents = appliedCoupon ? appliedCoupon.discountCents : 0;

  // Bonificación por método de pago (ej: 10% OFF en transferencia, aplicable en Paso 3)
  const activeMethod = paymentMethods.find((m) => m.method === effectivePaymentMethod);
  const transferDiscountPercent =
    effectivePaymentMethod === "TRANSFER"
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

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceiptFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setReceiptFileError("Solo se admiten comprobantes en formato PDF.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setReceiptFileError("El comprobante supera el tamaño máximo permitido de 10 MB.");
      e.target.value = "";
      return;
    }

    setTransferReceiptFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setTransferReceiptBase64(reader.result as string);
    };
    reader.onerror = () => {
      setReceiptFileError("Error al procesar el archivo PDF.");
    };
    reader.readAsDataURL(file);
  };

  const handleOrderSuccessReceiptUpload = async () => {
    if (!orderSuccessReceiptFile || !orderSuccess) return;
    setIsUploadingOrderSuccessReceipt(true);
    setOrderSuccessReceiptError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Error al leer el archivo PDF"));
      });
      reader.readAsDataURL(orderSuccessReceiptFile);
      const base64 = await base64Promise;

      const res = await fetch(`/api/orders/${orderSuccess.code}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptBase64: base64 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al subir el comprobante");
      }

      setOrderSuccessReceiptSuccess(true);
      setOrderSuccess((prev) => (prev ? { ...prev, transferReceiptUrl: data.order?.transferReceiptUrl || base64 } : null));
    } catch (err) {
      setOrderSuccessReceiptError(err instanceof Error ? err.message : "Error al subir el comprobante");
    } finally {
      setIsUploadingOrderSuccessReceipt(false);
    }
  };

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
    const parts: string[] = [];
    if (isHomeDeliveryEnabled) {
      if (isHomeFreeShipping) {
        parts.push(`Envío a domicilio por correo GRATIS (${currentHomeZone?.estimatedDelivery || storeLocation.homeDeliveryEstimatedDays || "3-5 días"})`);
      } else {
        const minCost = activeHomeZones.length > 0
          ? Math.min(...activeHomeZones.map((z) => z.costCents))
          : homeDeliveryCost;
        parts.push(`Envío a domicilio aprox. ${formatPrice(minCost, "ARS")} (${currentHomeZone?.estimatedDelivery || storeLocation.homeDeliveryEstimatedDays || "3-5 días"})`);
      }
    }
    if (isMotorcycleDeliveryEnabled) {
      const minMotoCost = activeMotoZones.length > 0
        ? Math.min(...activeMotoZones.map((z) => z.costCents))
        : motorcycleDeliveryCost;
      parts.push(`Moto Express aprox. ${formatPrice(minMotoCost, "ARS")} (${currentMotoZone?.estimatedDelivery || storeLocation.motorcycleDeliveryEstimatedDays || "En el día"})`);
    }
    if (isPickupEnabled) {
      parts.push("Retiro en local GRATIS hoy");
    }
    setEstimatedShippingNotice(`CP ${postalCodeInput.trim()}: ${parts.join(" · ")}`);
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
    if (items.length === 0 || ordersPaused) return;
    if (hasOutOfStockItems) {
      setErrorMessage("Hay prendas sin stock en tu bolsa. Por favor eliminalas para poder continuar.");
      return;
    }
    setErrorMessage(null);
    setCurrentStep("shipping");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Validaciones antes de avanzar del Paso 2 al Paso 3
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (hasOutOfStockItems) {
      setErrorMessage("Hay prendas sin stock en tu bolsa. Por favor volvé al paso 1 y eliminalas.");
      return;
    }

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
    if (hasOutOfStockItems) {
      setErrorMessage("Hay prendas sin stock en tu bolsa. Por favor volvé al paso 1 y eliminalas.");
      return;
    }

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
          deliveryNotes: (() => {
            const selectedZone =
              deliveryMethod === "HOME_DELIVERY"
                ? currentHomeZone?.name
                : deliveryMethod === "MOTORCYCLE"
                ? currentMotoZone?.name
                : null
            const parts = [
              selectedZone ? `Zona: ${selectedZone}` : null,
              postalCode.trim() ? `CP: ${postalCode.trim()}` : null,
              deliveryNotes.trim() || null,
            ].filter(Boolean);
            return parts.length > 0 ? parts.join(" | ") : null
          })(),
          shippingCents,
          discountCents,
          paymentMethod: effectivePaymentMethod,
          paymentDiscountCents,
          couponCode: appliedCoupon?.code || null,
          transferReceiptUrl: transferReceiptBase64 || null,
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

      const confirmedPaymentMethod = effectivePaymentMethod;

      setOrderSuccess({
        code: data.order.code,
        whatsappUrl: data.whatsappUrl,
        paymentPreference: data.paymentPreference,
        paymentMethod: confirmedPaymentMethod,
        transferReceiptUrl: data.order?.transferReceiptUrl || transferReceiptBase64 || null,
      });

      // Limpiar bolsa y reiniciar métodos elegidos para próximas compras
      clearCart();
      setSelectedPaymentMethod(enabledPaymentMethods[0]?.method || "TRANSFER");
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
              {/* Plazo de Reserva: 24 Horas */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Clock className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>Plazo de Reserva: 24 Horas</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Tus prendas quedan reservadas por <strong>24 horas</strong>. Si no se registra la transferencia en ese plazo, la orden se cancela automáticamente y las prendas vuelven al stock disponible.
                </p>
              </div>

              {/* Estado de Comprobante o Uploader Post-Orden */}
              {orderSuccess.transferReceiptUrl || orderSuccessReceiptSuccess ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Comprobante PDF adjuntado correctamente (en revisión por el showroom).</span>
                  </div>
                  <a
                    href={`/api/orders/${orderSuccess.code}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0"
                  >
                    Ver PDF
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-[#e7e2da] bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-[#926a3c]" />
                        Subir Comprobante de Transferencia
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Solo formato <strong>PDF</strong> (máx. 10 MB). También podés subirlo más tarde desde{" "}
                        <Link prefetch={false} href="/cuenta" className="text-stone-900 font-semibold underline">Mis Pedidos</Link>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      id="success-receipt-pdf"
                      accept="application/pdf,.pdf"
                      disabled={isUploadingOrderSuccessReceipt}
                      onChange={(e) => {
                        setOrderSuccessReceiptError(null);
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                          setOrderSuccessReceiptError("Solo se admiten comprobantes en formato PDF.");
                          e.target.value = "";
                          return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                          setOrderSuccessReceiptError("El archivo supera el límite de 10 MB.");
                          e.target.value = "";
                          return;
                        }
                        setOrderSuccessReceiptFile(file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="success-receipt-pdf"
                      className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5 text-stone-500" />
                      <span>{orderSuccessReceiptFile ? "Cambiar archivo" : "Elegir archivo PDF"}</span>
                    </label>

                    {orderSuccessReceiptFile && (
                      <button
                        type="button"
                        disabled={isUploadingOrderSuccessReceipt}
                        onClick={handleOrderSuccessReceiptUpload}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingOrderSuccessReceipt ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Subiendo PDF...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" />
                            <span>Guardar Comprobante</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {orderSuccessReceiptFile && (
                    <p className="text-[11px] text-stone-500">
                      Archivo: <span className="font-medium text-stone-800">{orderSuccessReceiptFile.name}</span> ({(orderSuccessReceiptFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </p>
                  )}

                  {orderSuccessReceiptError && (
                    <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {orderSuccessReceiptError}
                    </p>
                  )}
                </div>
              )}

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
                  <span>Reserva de prendas</span>
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
            <Link prefetch={false}
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
            <Link prefetch={false}
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

                {/* Lista de Prendas */}
                <ul className="divide-y divide-[#e7e2da]/70 mt-3" role="list">
                  {items.map((item) => {
                    const isItemOutOfStock = item.maxStock <= 0;
                    return (
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
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-mono font-medium text-stone-400">
                                    SKU: {item.formattedCode}
                                  </span>
                                  {isItemOutOfStock && (
                                    <span className="inline-flex items-center rounded-md bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                      Sin stock
                                    </span>
                                  )}
                                </div>
                                <Link prefetch={false}
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
                            {isItemOutOfStock ? (
                              <span className="font-mono text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                                Sin stock disponible
                              </span>
                            ) : item.maxStock > 1 ? (
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
                              {item.quantity > 1 && !isItemOutOfStock && (
                                <span className="text-[11px] text-stone-500 block">
                                  {item.quantity} × {formatPrice(item.unitPriceCents, item.currency)}
                                </span>
                              )}
                              <span className={`font-serif text-lg sm:text-xl font-bold ${isItemOutOfStock ? "text-stone-400 line-through" : "text-stone-900"}`}>
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

                {/* Calculador de envío por CP en Paso 1 (Solo si hay envíos a domicilio o moto habilitados) */}
                {(isHomeDeliveryEnabled || isMotorcycleDeliveryEnabled) && (
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
                )}
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

                  {isHomeDeliveryEnabled || isMotorcycleDeliveryEnabled ? (
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span className="font-medium text-stone-500">
                        {isHomeFreeShipping ? "Gratis" : "Se calcula en el siguiente paso"}
                      </span>
                    </div>
                  ) : isPickupEnabled ? (
                    <div className="flex justify-between">
                      <span>Entrega:</span>
                      <span className="font-semibold text-emerald-700">Retiro en local gratis</span>
                    </div>
                  ) : null}

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

                {hasOutOfStockItems && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-950">Prendas sin stock en tu bolsa</p>
                      <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                        Una o más piezas de tu bolsa ya no tienen unidades disponibles. Por favor eliminalas para poder continuar con tu compra.
                      </p>
                    </div>
                  </div>
                )}

                {/* Botón destacado: Continuar con la reserva */}
                <button
                  type="button"
                  disabled={ordersPaused || hasOutOfStockItems}
                  onClick={handleProceedToShipping}
                  className={`w-full flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-xs font-bold tracking-wider uppercase shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-stone-900 ${
                    ordersPaused || hasOutOfStockItems
                      ? "bg-stone-200 text-stone-500 cursor-not-allowed border border-stone-300"
                      : "bg-stone-900 text-white hover:bg-stone-800 cursor-pointer active:scale-98"
                  }`}
                >
                  <span>
                    {ordersPaused
                      ? "Ventas pausadas momentáneamente"
                      : hasOutOfStockItems
                      ? "Prendas sin stock en la bolsa"
                      : "Continuar con la reserva"}
                  </span>
                  {!ordersPaused && !hasOutOfStockItems && <ArrowRight className="h-4 w-4" />}
                </button>

                {/* Medios de Pago Aceptados Dinámicos (BR-47) */}
                {enabledPaymentMethods.length > 0 && (
                  <div className="border-t border-[#e7e2da] pt-4 space-y-2">
                    <span className="block text-[10px] font-semibold tracking-wider uppercase text-stone-500">
                      Medios de pago coordinados:
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-stone-700">
                      {enabledPaymentMethods.map((m) => (
                        <span
                          key={m.method}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100/90 px-2.5 py-1 border border-stone-200/80 font-medium text-stone-800"
                        >
                          <PaymentProcessorIcon method={m.method} className="h-3.5 w-3.5" />
                          <span>{m.name}</span>
                          {m.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                                m.method === "TRANSFER"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-sky-100 text-sky-800"
                              }`}
                            >
                              {m.badge}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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

                    <div className={`grid gap-3 ${
                      (Number(isPickupEnabled) + Number(isHomeDeliveryEnabled) + Number(isMotorcycleDeliveryEnabled)) === 1
                        ? "grid-cols-1"
                        : (Number(isPickupEnabled) + Number(isHomeDeliveryEnabled) + Number(isMotorcycleDeliveryEnabled)) === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1 sm:grid-cols-3"
                    }`}>
                      {isPickupEnabled && (
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
                          <span className="text-[11px] opacity-75">
                            {storeLocation.locality || "Palermo Soho"}
                          </span>
                        </button>
                      )}

                      {isHomeDeliveryEnabled && (
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
                            {isHomeFreeShipping
                              ? "Gratis"
                              : formatPrice(effectiveHomeDeliveryCost, "ARS")}{" "}
                            · {currentHomeZone?.estimatedDelivery || storeLocation.homeDeliveryEstimatedDays || "3 a 5 días"}
                          </span>
                          <span className="text-[11px] opacity-75">Correo nacional</span>
                        </button>
                      )}

                      {isMotorcycleDeliveryEnabled && (
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
                            {formatPrice(effectiveMotoCost, "ARS")} ·{" "}
                            {currentMotoZone?.estimatedDelivery || storeLocation.motorcycleDeliveryEstimatedDays || "En el día"}
                          </span>
                          <span className="text-[11px] opacity-75">CABA / AMBA</span>
                        </button>
                      )}
                    </div>

                    {deliveryMethod === "PICKUP" && (
                      <div className="mt-3 rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3.5 text-xs text-stone-700 space-y-2">
                        {storeLocation.pickupAddressVisibility === "COORDINATE_WHATSAPP" ? (
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                              <MessageCircle className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-stone-900">
                                Dirección a coordinar por WhatsApp
                              </p>
                              <p className="text-[11px] text-stone-600 leading-relaxed">
                                Nuestro showroom opera con atención personalizada y cita previa{storeLocation.locality ? ` en ${storeLocation.locality}` : ""}. Te enviaremos la ubicación exacta y coordinaremos el horario por WhatsApp una vez confirmado tu pedido.
                              </p>
                            </div>
                          </div>
                        ) : (
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
                        )}

                        <div className="border-t border-[#e7e2da] pt-2">
                          <p className="font-semibold text-stone-900 mb-1">
                            {storeLocation.pickupAddressVisibility === "COORDINATE_WHATSAPP"
                              ? "Horarios de referencia para visitas:"
                              : "Horarios de retiro en el local:"}
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

                    {/* Selector de Zona para Envío a Domicilio */}
                    {deliveryMethod === "HOME_DELIVERY" && (
                      <div className="mt-3 rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3.5 text-xs text-stone-700 space-y-3">
                        {isHomeFreeShipping ? (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>
                              ¡Tu compra supera {formatPrice(homeFreeThreshold!, "ARS")} y tiene <strong>ENVÍO GRATIS</strong> a domicilio!
                            </span>
                          </div>
                        ) : homeFreeThreshold ? (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                            <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>
                              Agregá {formatPrice(homeFreeThreshold - subtotalCents, "ARS")} más para tener <strong>Envío Gratis</strong> a domicilio.
                            </span>
                          </div>
                        ) : null}

                        {activeHomeZones.length > 0 && (
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-semibold text-stone-800 uppercase tracking-wider">
                              Seleccioná tu región / zona de entrega:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {activeHomeZones.map((zone) => {
                                const isSelected = currentHomeZone?.id === zone.id;
                                return (
                                  <label
                                    key={zone.id}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-stone-900 bg-white shadow-2xs ring-1 ring-stone-900"
                                        : "border-[#e7e2da] bg-white/70 hover:bg-white text-stone-600"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <input
                                        type="radio"
                                        name="homeDeliveryZone"
                                        value={zone.id}
                                        checked={isSelected}
                                        onChange={() => setSelectedHomeZoneId(zone.id)}
                                        className="accent-stone-900"
                                      />
                                      <div className="truncate">
                                        <span className="font-semibold text-stone-900 block truncate">{zone.name}</span>
                                        {zone.estimatedDelivery && (
                                          <span className="text-[10px] text-stone-500 block">{zone.estimatedDelivery}</span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-mono font-bold text-stone-900 shrink-0 ml-2">
                                      {isHomeFreeShipping ? "Gratis" : formatPrice(zone.costCents, "ARS")}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selector de Zona para Moto Express */}
                    {deliveryMethod === "MOTORCYCLE" && (
                      <div className="mt-3 rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-3.5 text-xs text-stone-700 space-y-3">
                        {activeMotoZones.length > 0 && (
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-semibold text-stone-800 uppercase tracking-wider">
                              Seleccioná tu zona de cobertura en moto:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {activeMotoZones.map((zone) => {
                                const isSelected = currentMotoZone?.id === zone.id;
                                return (
                                  <label
                                    key={zone.id}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-stone-900 bg-white shadow-2xs ring-1 ring-stone-900"
                                        : "border-[#e7e2da] bg-white/70 hover:bg-white text-stone-600"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <input
                                        type="radio"
                                        name="motorcycleZone"
                                        value={zone.id}
                                        checked={isSelected}
                                        onChange={() => setSelectedMotoZoneId(zone.id)}
                                        className="accent-stone-900"
                                      />
                                      <div className="truncate">
                                        <span className="font-semibold text-stone-900 block truncate">{zone.name}</span>
                                        {zone.estimatedDelivery && (
                                          <span className="text-[10px] text-stone-500 block">{zone.estimatedDelivery}</span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-mono font-bold text-stone-900 shrink-0 ml-2">
                                      {formatPrice(zone.costCents, "ARS")}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
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
                        <Link prefetch={false}
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
                        <span className="font-semibold text-stone-800 line-clamp-1">
                          {i.title || i.formattedCode}
                          {i.maxStock <= 0 && (
                            <span className="ml-1.5 inline-block text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded px-1">
                              Sin stock
                            </span>
                          )}
                        </span>
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

          {/* PASO 3: REVISIÓN Y CONFIRMACIÓN */}
          {currentStep === "payment" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Columna Izquierda: Revisión de Datos y Selección de Pago (8 cols) */}
              <div className="lg:col-span-8 rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="border-b border-[#e7e2da] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="font-serif text-2xl font-light text-stone-900">
                      Revisión final de tu pedido
                    </h1>
                    <p className="text-xs text-stone-500 mt-1">
                      Verificá tus datos de contacto y entrega antes de confirmar la reserva.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setSelectedPaymentMethod(effectivePaymentMethod);
                      setCurrentStep("shipping");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Modificar datos</span>
                  </button>
                </div>

                {/* Resumen de Datos & Entrega en 2 Columnas Horizontales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Tarjeta Comprador */}
                  <div className="rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#926a3c]" />
                        Tus Datos
                      </span>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          setSelectedPaymentMethod(effectivePaymentMethod);
                          setCurrentStep("shipping");
                        }}
                        className="text-xs font-semibold text-stone-600 hover:text-stone-950 underline cursor-pointer disabled:opacity-50"
                      >
                        Editar
                      </button>
                    </div>
                    <div className="space-y-0.5 text-stone-800">
                      <p className="font-medium text-stone-900">{customerName}</p>
                      <p className="text-stone-600">DNI: {customerDni}</p>
                      <p className="text-stone-600">{customerPhone}</p>
                      <p className="text-stone-600 truncate">{customerEmail}</p>
                    </div>
                  </div>

                  {/* Tarjeta Entrega */}
                  <div className="rounded-xl border border-[#e7e2da] bg-[#faf8f5] p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        {deliveryMethod === "PICKUP" ? (
                          <Store className="h-3.5 w-3.5 text-[#926a3c]" />
                        ) : (
                          <Truck className="h-3.5 w-3.5 text-[#926a3c]" />
                        )}
                        Modalidad de Entrega
                      </span>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          setSelectedPaymentMethod(effectivePaymentMethod);
                          setCurrentStep("shipping");
                        }}
                        className="text-xs font-semibold text-stone-600 hover:text-stone-950 underline cursor-pointer disabled:opacity-50"
                      >
                        Editar
                      </button>
                    </div>
                    <div className="space-y-0.5 text-stone-800">
                      <p className="font-medium text-stone-900">
                        {deliveryMethod === "HOME_DELIVERY"
                          ? `Envío a Domicilio - ${currentHomeZone?.name || "Correo"} (${isHomeFreeShipping || shippingCents === 0 ? "Gratis" : formatPrice(shippingCents, "ARS")})`
                          : deliveryMethod === "MOTORCYCLE"
                          ? `Moto Express - ${currentMotoZone?.name || "Mensajería"} (${formatPrice(shippingCents, "ARS")})`
                          : "Retiro en Showroom (Gratis)"}
                      </p>
                      <p className="text-stone-600 text-[11px] leading-relaxed">
                        {deliveryMethod === "HOME_DELIVERY" || deliveryMethod === "MOTORCYCLE"
                          ? deliveryAddress
                          : storeLocation.pickupAddressVisibility === "COORDINATE_WHATSAPP"
                          ? `Dirección a coordinar por WhatsApp${storeLocation.locality ? ` (${storeLocation.locality})` : ""}`
                          : showroomAddress ||
                            [storeLocation.streetAddress, storeLocation.locality].filter(Boolean).join(", ") ||
                            "Palermo Soho"}
                      </p>
                      {deliveryNotes && (
                        <p className="text-[11px] text-stone-500 italic">Notas: {deliveryNotes}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selector de Método de Pago (BR-47) - Solo métodos habilitados */}
                <div className="border-t border-[#e7e2da] pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
                      Método de Pago
                    </span>
                    {transferDiscountPercent > 0 && effectivePaymentMethod === "TRANSFER" && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                        {transferDiscountPercent}% OFF con Transferencia
                      </span>
                    )}
                  </div>

                  {enabledPaymentMethods.length > 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {enabledPaymentMethods.map((m) => {
                        const isSelected = effectivePaymentMethod === m.method;
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
                              <div className="flex items-center gap-2 font-medium text-stone-900">
                                <PaymentProcessorIcon method={m.method} className="h-4 w-4 shrink-0" />
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
                  ) : enabledPaymentMethods.length === 1 ? (
                    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PaymentProcessorIcon method={enabledPaymentMethods[0].method} className="h-5 w-5 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-xs text-stone-900">
                              {enabledPaymentMethods[0].name}
                            </p>
                            {enabledPaymentMethods[0].badge && (
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  enabledPaymentMethods[0].method === "TRANSFER"
                                    ? "text-emerald-700 bg-emerald-100/70"
                                    : "text-sky-700 bg-sky-100/70"
                                }`}
                              >
                                {enabledPaymentMethods[0].badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {enabledPaymentMethods[0].description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-1">
                      <p className="font-semibold">No hay medios de pago online habilitados</p>
                      <p className="text-[11px] text-amber-800">
                        Por favor comunicate con el showroom para coordinar tu compra directamente por WhatsApp.
                      </p>
                    </div>
                  )}

                  {/* Detalle específico de Transferencia Bancaria */}
                  {effectivePaymentMethod === "TRANSFER" && (
                    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-4 sm:p-5 text-xs space-y-4 animate-in fade-in-50">
                      <div className="flex items-start gap-2.5">
                        <Clock className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-amber-950">
                            Reserva por 24 horas & {transferDiscountPercent}% OFF automático
                          </p>
                          <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                            Tus prendas quedan apartadas por <strong>24 horas</strong>. Si no se registra la transferencia en ese plazo, la orden se cancela automáticamente y las prendas vuelven al stock disponible.
                          </p>
                        </div>
                      </div>

                      {/* Datos de la Cuenta Bancaria */}
                      <div className="rounded-xl border border-amber-200/80 bg-white p-3.5 space-y-2.5 text-stone-800">
                        <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                          <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-[#926a3c]" />
                            Datos para la Transferencia
                          </span>
                          {transferDiscountPercent > 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              {transferDiscountPercent}% OFF Aplicado
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {bankDetails?.alias && (
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                              <div>
                                <span className="text-[10px] text-stone-500 uppercase font-bold block">Alias</span>
                                <span className="font-mono font-bold text-stone-950 text-xs">{bankDetails.alias}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(bankDetails.alias || "", "alias_step")}
                                className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 border border-stone-300 hover:bg-stone-50 cursor-pointer shadow-2xs"
                              >
                                {copiedField === "alias_step" ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {bankDetails?.cbu && (
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                              <div>
                                <span className="text-[10px] text-stone-500 uppercase font-bold block">CBU / CVU</span>
                                <span className="font-mono text-xs text-stone-900">{bankDetails.cbu}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(bankDetails.cbu || "", "cbu_step")}
                                className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 border border-stone-300 hover:bg-stone-50 cursor-pointer shadow-2xs"
                              >
                                {copiedField === "cbu_step" ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-stone-600 pt-1 border-t border-stone-100">
                          {bankDetails?.bankName && (
                            <div>
                              <span className="text-stone-400 block text-[10px] uppercase font-semibold">Banco</span>
                              <span className="font-medium text-stone-900">{bankDetails.bankName}</span>
                            </div>
                          )}
                          {bankDetails?.accountHolder && (
                            <div>
                              <span className="text-stone-400 block text-[10px] uppercase font-semibold">Titular</span>
                              <span className="font-medium text-stone-900">{bankDetails.accountHolder}</span>
                            </div>
                          )}
                          {bankDetails?.cuit && (
                            <div>
                              <span className="text-stone-400 block text-[10px] uppercase font-semibold">CUIT</span>
                              <span className="font-mono text-stone-900">{bankDetails.cuit}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Uploader Opcional de Comprobante PDF */}
                      <div className="rounded-xl border border-amber-200/70 bg-white/95 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-stone-900 flex items-center gap-1.5 text-xs">
                            <FileText className="h-3.5 w-3.5 text-[#926a3c]" />
                            ¿Ya transferiste? Adjuntá tu comprobante (opcional)
                          </label>
                          <span className="text-[10px] text-stone-500">Solo PDF · Máx 10 MB</span>
                        </div>

                        <p className="text-[11px] text-stone-500">
                          Si preferís transferir después, podés confirmar ahora y adjuntarlo luego desde{" "}
                          <strong className="text-stone-800">Mis Pedidos</strong> antes de que pasen las 24 horas.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <input
                            type="file"
                            id="checkout-receipt-pdf"
                            accept="application/pdf,.pdf"
                            disabled={isSubmitting}
                            onChange={handleReceiptFileChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="checkout-receipt-pdf"
                            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer shadow-2xs"
                          >
                            <Upload className="h-3.5 w-3.5 text-stone-500" />
                            <span>{transferReceiptFile ? "Cambiar archivo PDF" : "Seleccionar comprobante PDF"}</span>
                          </label>

                          {transferReceiptFile && (
                            <div className="flex items-center gap-2 text-xs text-stone-800 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
                              <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />
                              <span className="truncate max-w-[200px] font-medium">{transferReceiptFile.name}</span>
                              <span className="text-[10px] text-stone-400">
                                ({(transferReceiptFile.size / (1024 * 1024)).toFixed(1)} MB)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setTransferReceiptFile(null);
                                  setTransferReceiptBase64(null);
                                }}
                                className="text-stone-400 hover:text-stone-700 cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {receiptFileError && (
                          <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            {receiptFileError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detalle de Mercado Pago */}
                  {effectivePaymentMethod === "MERCADOPAGO" && (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 sm:p-5 text-xs space-y-2 animate-in fade-in-50">
                      <div className="flex items-center gap-2 font-semibold text-sky-950">
                        <PaymentProcessorIcon method="MERCADOPAGO" className="h-4 w-4" />
                        <span>Pago seguro con Mercado Pago</span>
                      </div>
                      <p className="text-[11px] text-sky-900 leading-relaxed">
                        Al confirmar el pedido, serás redirigido a la pasarela segura de Mercado Pago para abonar de forma inmediata con tarjetas de crédito, débito, dinero en cuenta o cuotas.
                      </p>
                    </div>
                  )}

                  {/* Detalle de Efectivo */}
                  {effectivePaymentMethod === "CASH" && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 text-xs space-y-2 animate-in fade-in-50">
                      <div className="flex items-center gap-2 font-semibold text-emerald-950">
                        <Banknote className="h-4 w-4 text-emerald-600" />
                        <span>Pago en efectivo</span>
                      </div>
                      <p className="text-[11px] text-emerald-900 leading-relaxed">
                        Abonás en efectivo al momento de retirar en el showroom o recibir tu compra.
                      </p>
                      {cashNotes && (
                        <p className="text-[11px] text-emerald-800 italic bg-white/70 p-2.5 rounded-lg border border-emerald-200/60">
                          {cashNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Detalle de Coordinar por WhatsApp */}
                  {effectivePaymentMethod === "WHATSAPP" && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 text-xs space-y-2 animate-in fade-in-50">
                      <div className="flex items-center gap-2 font-semibold text-emerald-950">
                        <MessageCircle className="h-4 w-4 text-[#25D366]" />
                        <span>Atención directa por WhatsApp</span>
                      </div>
                      <p className="text-[11px] text-emerald-900 leading-relaxed">
                        Al confirmar el pedido, te conectaremos directamente por WhatsApp con el equipo del showroom para coordinar el medio de pago que prefieras y los detalles de entrega.
                      </p>
                    </div>
                  )}

                  {/* Detalle de Payway / Getnet / MODO / Google Pay */}
                  {effectivePaymentMethod === "PAYWAY" && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 sm:p-5 text-xs space-y-2 animate-in fade-in-50">
                      <div className="flex items-center gap-2 font-semibold text-indigo-950">
                        <CreditCard className="h-4 w-4 text-indigo-600" />
                        <span>Pago seguro con Payway (Prisma)</span>
                      </div>
                      <p className="text-[11px] text-indigo-900 leading-relaxed">
                        Serás dirigido a la plataforma de Payway para pagar con tarjetas de crédito bancarias (con Cuota Simple) y débito con acreditación segura.
                      </p>
                    </div>
                  )}

                  {effectivePaymentMethod === "GETNET" && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 sm:p-5 text-xs space-y-2 animate-in fade-in-50">
                      <div className="flex items-center gap-2 font-semibold text-rose-950">
                        <CreditCard className="h-4 w-4 text-rose-600" />
                        <span>Pago con Getnet (Santander)</span>
                      </div>
                      <p className="text-[11px] text-rose-900 leading-relaxed">
                        Aboná con promociones exclusivas de Santander y tarjetas Visa/Mastercard a través de Getnet.
                      </p>
                    </div>
                  )}

                  {effectivePaymentMethod === "MODO" && (
                    <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 sm:p-5 text-xs space-y-2 animate-in fade-in-50">
                      <div className="flex items-center gap-2 font-semibold text-teal-950">
                        <QrCode className="h-4 w-4 text-teal-600" />
                        <span>Pago con MODO / App Bancaria</span>
                      </div>
                      <p className="text-[11px] text-teal-900 leading-relaxed">
                        Escaneá el código QR desde tu app bancaria o la app de MODO para acceder a reintegros y promociones.
                      </p>
                    </div>
                  )}

                  {effectivePaymentMethod === "GOOGLEPAY" && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 text-xs space-y-2 animate-in fade-in-50">
                      <div className="flex items-center gap-2 font-semibold text-amber-950">
                        <Wallet className="h-4 w-4 text-amber-500" />
                        <span>Google Pay</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        Pago rápido y seguro en 1 clic con tus tarjetas guardadas en Google.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Resumen de Piezas y Botón de Confirmación Sticky (4 cols) */}
              <div className="lg:col-span-4 rounded-2xl border border-[#e7e2da] bg-white p-5 sm:p-6 shadow-2xs space-y-5 sticky top-24">
                <div className="flex items-center justify-between border-b border-[#e7e2da] pb-3">
                  <h2 className="font-serif text-lg font-medium text-stone-900">
                    Resumen del pedido
                  </h2>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleReturnToCartStep}
                    className="text-xs font-medium text-stone-500 hover:text-stone-900 underline cursor-pointer disabled:opacity-50"
                  >
                    Editar bolsa
                  </button>
                </div>

                {/* Lista compacta de prendas */}
                <ul className="divide-y divide-[#e7e2da]/70 max-h-52 overflow-y-auto pr-1 text-xs space-y-1">
                  {items.map((i) => (
                    <li key={i.key} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {i.photoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={i.photoUrl}
                            alt={i.title || i.formattedCode}
                            className="h-11 w-9 object-cover rounded-md shrink-0 bg-stone-100 border border-stone-200/60"
                          />
                        ) : (
                          <div className="h-11 w-9 rounded-md bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200/60">
                            <Store className="h-4 w-4 text-stone-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 truncate text-xs">
                            {i.formattedCode} · {i.title}
                            {i.maxStock <= 0 && (
                              <span className="ml-1.5 inline-block text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded px-1">
                                Sin stock
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {i.colorName} · Talle {i.size} (x{i.quantity})
                          </p>
                        </div>
                      </div>
                      <span className="font-serif font-semibold text-stone-900 text-xs shrink-0">
                        {formatPrice(i.unitPriceCents ? i.unitPriceCents * i.quantity : null, i.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Desglose Financiero */}
                <div className="border-t border-[#e7e2da] pt-3.5 space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal piezas:</span>
                    <span className="font-medium text-stone-900">{formatPrice(subtotalCents, "ARS")}</span>
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
                    <span className="font-medium text-stone-900">
                      {shippingCents === 0 ? "Gratis" : formatPrice(shippingCents, "ARS")}
                    </span>
                  </div>

                  <div className="border-t border-[#e7e2da] pt-3 flex justify-between items-baseline text-stone-900">
                    <span className="font-serif text-base font-semibold">Total:</span>
                    <span className="font-serif text-2xl font-bold">
                      {formatPrice(finalTotalCents, "ARS")}
                    </span>
                  </div>
                </div>

                {/* Checkbox de Términos & Condiciones */}
                <div className="border-t border-[#e7e2da] pt-3">
                  <label className="flex items-start gap-2.5 text-xs text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      disabled={isSubmitting}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 accent-stone-900 disabled:opacity-50 shrink-0"
                    />
                    <span className="text-[11px] leading-relaxed">
                      Acepto los{" "}
                      <Link prefetch={false}
                        href="/terminos"
                        target="_blank"
                        className="underline font-semibold text-stone-900 hover:text-stone-700"
                      >
                        términos de compra
                      </Link>
                      , política de reserva por {effectivePaymentMethod === "TRANSFER" ? "24 horas" : reservationText} y condiciones de cambio (15 días con etiqueta).
                    </span>
                  </label>
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Botón Principal de Confirmación */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmOrder}
                  className="w-full inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm hover:bg-stone-800 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Registrando orden...</span>
                    </>
                  ) : effectivePaymentMethod === "TRANSFER" ? (
                    <>
                      <Building2 className="h-4 w-4 text-[#d4af37]" />
                      <span>Confirmar y ver CBU para transferir</span>
                    </>
                  ) : effectivePaymentMethod === "MERCADOPAGO" ? (
                    <>
                      <PaymentProcessorIcon method="MERCADOPAGO" className="h-4 w-4" />
                      <span>Continuar a Mercado Pago</span>
                    </>
                  ) : effectivePaymentMethod === "PAYWAY" ? (
                    <>
                      <CreditCard className="h-4 w-4 text-indigo-400" />
                      <span>Continuar a Payway (Cuota Simple)</span>
                    </>
                  ) : effectivePaymentMethod === "GETNET" ? (
                    <>
                      <CreditCard className="h-4 w-4 text-rose-400" />
                      <span>Continuar a Getnet (Santander)</span>
                    </>
                  ) : effectivePaymentMethod === "MODO" ? (
                    <>
                      <QrCode className="h-4 w-4 text-teal-400" />
                      <span>Pagar con MODO / App Bancaria</span>
                    </>
                  ) : effectivePaymentMethod === "GOOGLEPAY" ? (
                    <>
                      <Wallet className="h-4 w-4 text-amber-400" />
                      <span>Pagar con Google Pay</span>
                    </>
                  ) : effectivePaymentMethod === "CASH" ? (
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

                {/* Sellos de Confianza */}
                <div className="border-t border-[#e7e2da] pt-3 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#926a3c] shrink-0" />
                    Stock garantizado
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-[#926a3c]" />
                    Atención directa
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
