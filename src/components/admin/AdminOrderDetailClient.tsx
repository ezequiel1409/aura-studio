"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bike,
  Building2,
  CreditCard,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Printer,
  QrCode,
  Wallet,
  RotateCcw,
  ShoppingBag,
  Store,
  Truck,
  User,
  XCircle,
  FileText,
} from "lucide-react";
import { Order, OrderStatus } from "../../domain/order/types";
import { OrderClaim } from "../../domain/claim/types";
import { PaymentMethod, PaymentStatus } from "../../domain/payment/types";
import { formatOrderCode } from "../../domain/order/rules";
import { formatPriceARS } from "../../lib/format/currency";

interface AdminOrderDetailClientProps {
  initialOrder: Order;
  brandName?: string | null;
  whatsappNumber?: string | null;
  showroomAddress?: string | null;
}

const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; icon: typeof Building2; color: string }
> = {
  TRANSFER: { label: "Transferencia Bancaria", icon: Building2, color: "text-[#d4af37]" },
  MERCADOPAGO: { label: "Mercado Pago", icon: CreditCard, color: "text-sky-400" },
  CASH: { label: "Efectivo", icon: Banknote, color: "text-emerald-400" },
  WHATSAPP: { label: "WhatsApp Directo", icon: MessageCircle, color: "text-[#25D366]" },
  STRIPE: { label: "Stripe", icon: CreditCard, color: "text-indigo-400" },
  PAYWAY: { label: "Payway (Prisma)", icon: CreditCard, color: "text-indigo-400" },
  GETNET: { label: "Getnet (Santander)", icon: CreditCard, color: "text-rose-400" },
  MODO: { label: "MODO (QR / Bancos)", icon: QrCode, color: "text-teal-400" },
  GOOGLEPAY: { label: "Google Pay", icon: Wallet, color: "text-amber-400" },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: "Cobro Pendiente",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-800/80",
  },
  AUTHORIZED: {
    label: "En Procesamiento",
    bg: "bg-sky-950/60",
    text: "text-sky-300",
    border: "border-sky-800/80",
  },
  PAID: {
    label: "Cobro Acreditado",
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/80",
  },
  REJECTED: {
    label: "Cobro Rechazado",
    bg: "bg-rose-950/60",
    text: "text-rose-300",
    border: "border-rose-800/80",
  },
  REFUNDED: {
    label: "Reembolsado",
    bg: "bg-zinc-900",
    text: "text-zinc-400",
    border: "border-zinc-700",
  },
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: typeof Clock; description: string }
> = {
  PENDING: {
    label: "Pendiente",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-800/80",
    icon: Clock,
    description: "Orden recibida. Pendiente de confirmación de pago o retiro.",
  },
  CONFIRMED: {
    label: "Confirmada",
    bg: "bg-sky-950/60",
    text: "text-sky-300",
    border: "border-sky-800/80",
    icon: CheckCircle2,
    description: "Pedido confirmado. Preparando paquete para entrega.",
  },
  PAID: {
    label: "Pagada",
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/80",
    icon: CheckCircle2,
    description: "Pago acreditado y registrado con éxito.",
  },
  CANCELLED: {
    label: "Cancelada",
    bg: "bg-zinc-900",
    text: "text-zinc-400",
    border: "border-zinc-700",
    icon: XCircle,
    description: "Orden cancelada. Stock restituido al catálogo.",
  },
};

export function AdminOrderDetailClient({
  initialOrder,
  brandName = "Aura Studio",
}: AdminOrderDetailClientProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isInspectingClaim, setIsInspectingClaim] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formattedCode = formatOrderCode(order.code);
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const cleanPhone = order.customerPhone.replace(/\D/g, "");

  const dateCreatedStr = new Date(order.createdAt * 1000).toLocaleString("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const dateUpdatedStr = new Date(order.updatedAt * 1000).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleStatusChange = async (newStatus: OrderStatus) => {
    const prev = order;
    setIsUpdating(true);
    setErrorMessage(null);
    setOrder({ ...order, status: newStatus });

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar el estado");
      }
      setToastMessage(
        `Estado actualizado a "${STATUS_CONFIG[newStatus].label}" exitosamente`
      );
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      setOrder(prev);
      setErrorMessage(err instanceof Error ? err.message : "Error al actualizar el estado");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentStatusChange = async (newPaymentStatus: PaymentStatus) => {
    const prev = order;
    setIsUpdatingPayment(true);
    setErrorMessage(null);
    setOrder({
      ...order,
      paymentStatus: newPaymentStatus,
      status: newPaymentStatus === "PAID" ? "PAID" : order.status,
    });

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar el estado de cobro");
      }
      setToastMessage(
        `Cobro actualizado a "${PAYMENT_STATUS_CONFIG[newPaymentStatus]?.label || newPaymentStatus}" exitosamente`
      );
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      setOrder(prev);
      setErrorMessage(err instanceof Error ? err.message : "Error al actualizar el cobro");
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleInspectClaim = async (
    claimId: string,
    decision: "APPROVE_RESTOCK" | "REJECT_CONDITION",
    rejectionReason?: string
  ) => {
    setIsInspectingClaim(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/claims/${claimId}/inspect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo procesar la inspección.");
      }

      setOrder((prev) => ({
        ...prev,
        status: decision === "APPROVE_RESTOCK" ? "CANCELLED" : prev.status,
        claim: data.claim,
      }));

      setToastMessage(
        decision === "APPROVE_RESTOCK"
          ? "Devolución aprobada. El stock fue recirculado automáticamente a la tienda."
          : "Devolución rechazada por no cumplir las condiciones de recirculación."
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error al procesar la inspección.");
    } finally {
      setIsInspectingClaim(false);
    }
  };

  const handleRejectCondition = (claim: OrderClaim) => {
    const reason = window.prompt(
      "Ingresá el motivo del rechazo del producto (ej: Manchas de maquillaje en cuello, olor a perfume, sin etiqueta original):",
      "Prenda recibida con manchas o señales de uso que impiden su recirculación."
    );
    if (reason === null) return;
    handleInspectClaim(claim.id, "REJECT_CONDITION", reason);

    const claimPhone = claim.customerPhone.replace(/[^0-9]/g, "");
    const waText = encodeURIComponent(
      `Hola ${claim.customerName.split(" ")[0]}! Te contactamos de ${brandName} por tu trámite ${claim.claimCode}. Recibimos la prenda en el showroom pero durante el control de calidad detectamos que no se encuentra en condiciones de recirculación (${reason}). Te enviamos fotos para coordinar.`
    );
    window.open(`https://wa.me/${claimPhone}?text=${waText}`, "_blank");
  };

  const getWhatsAppTemplateLink = (type: "receipt" | "confirmed" | "ready") => {
    const firstName = order.customerName.split(" ")[0];
    let text = `¡Hola ${firstName}! Te contactamos por tu pedido ${formattedCode} en ${brandName}.`;
    if (type === "receipt") {
      text = `¡Hola ${firstName}! Recibimos tu pedido ${formattedCode} en ${brandName}. Te pasamos los datos para coordinar el pago o la entrega.`;
    } else if (type === "confirmed") {
      text = `¡Hola ${firstName}! Tu pedido ${formattedCode} ya está confirmado y estamos preparando tus prendas.`;
    } else if (type === "ready") {
      text =
        order.deliveryMethod === "PICKUP"
          ? `¡Hola ${firstName}! Tu pedido ${formattedCode} ya está listo para retirar en nuestro showroom. ¡Te esperamos!`
          : `¡Hola ${firstName}! Tu paquete del pedido ${formattedCode} ya está listo y en camino a tu domicilio.`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const buyerGreeting = encodeURIComponent(
    `¡Hola ${order.customerName}! Te escribimos desde ${brandName} por tu pedido ${formattedCode}.`
  );

  return (
    <div className="space-y-6">
      {/* Toast de confirmación */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 rounded-xl border border-emerald-800 bg-emerald-950/95 px-4 py-2.5 text-xs font-semibold text-emerald-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2"
        >
          {toastMessage}
        </div>
      )}

      {/* Banner de error accesible */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-200 text-xs font-medium shadow-sm"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Cerrar aviso de error"
            className="p-1 rounded-lg text-rose-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}

      {/* Navegación y Acciones de Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <Link
            href="/admin/ordenes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-amber-300 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a todos los pedidos</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-zinc-100">
              {formattedCode}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
            >
              <statusCfg.icon className="h-3.5 w-3.5" />
              <span>{statusCfg.label}</span>
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Registrado el {dateCreatedStr}
          </p>
        </div>

        {/* Botones de acción rápida: Imprimir y WhatsApp */}
        <div className="flex flex-wrap items-center gap-2.5">
          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}?text=${buyerGreeting}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat WhatsApp</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
            title="Imprimir ficha de pedido o comprobante"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Grid de Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (2/3): Reclamo Postventa, Artículos y Desglose Financiero */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Alerta de Reclamo / Arrepentimiento Postventa */}
          {order.claim && (
            <section className="rounded-2xl border border-rose-800/70 bg-rose-950/30 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-rose-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Solicitud de Arrepentimiento / Postventa
                  </h2>
                </div>
                <span className="font-mono text-xs font-bold text-rose-200 bg-rose-950 border border-rose-800 px-2.5 py-0.5 rounded-lg">
                  {order.claim.claimCode}
                </span>
              </div>

              <div className="text-xs text-zinc-300 space-y-1.5">
                <p>
                  <strong className="text-zinc-400">Tipo de solicitud:</strong>{" "}
                  {order.claim.type === "EXCHANGE"
                    ? "Cambio de talle / prenda"
                    : "Arrepentimiento de compra (Ley 24.240)"}
                </p>
                {order.claim.reason && (
                  <p className="italic text-zinc-200 bg-zinc-950/70 p-3 rounded-xl border border-rose-900/40">
                    &ldquo;{order.claim.reason}&rdquo;
                  </p>
                )}
              </div>

              {order.claim.status === "PENDING" ? (
                <div className="pt-3 border-t border-rose-900/50 space-y-2.5">
                  <p className="text-[11px] font-semibold text-rose-200">
                    Control de Calidad al recibir la prenda:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isInspectingClaim}
                      onClick={() => handleInspectClaim(order.claim!.id, "APPROVE_RESTOCK")}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-3 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>Aprobar y Recircular (+1 stock)</span>
                    </button>
                    <button
                      type="button"
                      disabled={isInspectingClaim}
                      onClick={() => handleRejectCondition(order.claim!)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-rose-100 font-semibold text-xs px-3 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Rechazar por Manchas / Uso</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-rose-900/50 text-xs">
                  {order.claim.status === "APPROVED_RESTOCKED" ? (
                    <span className="text-emerald-400 font-semibold">
                      ✓ Control de calidad aprobado · Stock recirculado a la tienda
                    </span>
                  ) : (
                    <div className="text-rose-300 space-y-0.5">
                      <p className="font-semibold">
                        ✕ Devolución rechazada en control de calidad
                      </p>
                      {order.claim.rejectionReason && (
                        <p className="text-zinc-400 text-[11px]">
                          Motivo: {order.claim.rejectionReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Card: Lista de Productos */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-400" />
                <h2 className="text-sm font-bold text-zinc-100">
                  Prendas en este pedido ({(order.items || []).length})
                </h2>
              </div>
            </div>

            <div className="divide-y divide-zinc-800">
              {(order.items || []).map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-16 w-12 sm:h-20 sm:w-16 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.photoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.photoUrl}
                          alt={item.productTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-zinc-600" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-sm text-zinc-100 truncate">
                        #{String(item.productCode).padStart(3, "0")} · {item.productTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        {item.colorName !== "Único" && (
                          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-300">
                            {item.colorName}
                          </span>
                        )}
                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-300">
                          Talle {item.size}
                        </span>
                        <span>
                          Cantidad: <strong className="text-zinc-200">{item.quantity}u</strong>
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">
                        Unitario: {formatPriceARS(item.unitPriceCents, order.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Subtotal</span>
                    <span className="font-mono text-sm sm:text-base font-bold text-zinc-100">
                      {formatPriceARS(item.subtotalCents, order.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desglose de Totales */}
            <div className="p-4 sm:p-5 bg-zinc-950/60 border-t border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400 font-mono">
                <span>Subtotal prendas</span>
                <span>{formatPriceARS(order.subtotalCents, order.currency)}</span>
              </div>

              {order.discountCents > 0 && (
                <div className="flex items-center justify-between text-emerald-400 font-mono">
                  <span>
                    Descuento {order.couponCode ? `(Cupón ${order.couponCode})` : ""}
                  </span>
                  <span>-{formatPriceARS(order.discountCents, order.currency)}</span>
                </div>
              )}

              {order.paymentDiscountCents && order.paymentDiscountCents > 0 ? (
                <div className="flex items-center justify-between text-emerald-400 font-mono">
                  <span>Bonificación Transferencia</span>
                  <span>-{formatPriceARS(order.paymentDiscountCents, order.currency)}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-zinc-400 font-mono">
                <span>Costo de envío / logística</span>
                <span>
                  {order.shippingCents > 0
                    ? formatPriceARS(order.shippingCents, order.currency)
                    : "Bonificado / A convenir"}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-base font-bold text-zinc-100 font-mono">
                <span>Total de la Orden</span>
                <span className="text-amber-300 text-lg sm:text-xl">
                  {formatPriceARS(order.totalCents, order.currency)}
                </span>
              </div>
            </div>
          </section>

          {/* Notas u observaciones */}
          {order.notes && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Observaciones internas
              </h2>
              <p className="text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                {order.notes}
              </p>
            </section>
          )}
        </div>

        {/* Columna Derecha (1/3): Datos del Comprador, Logística, Mensajes Rápidos y Estado */}
        <div className="space-y-6">
          {/* Card: Cobro y Pago (BR-47, BR-48) */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Método y Cobro
              </h2>
              {order.paymentStatus && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    (PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING).bg
                  } ${
                    (PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING).text
                  } ${
                    (PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING).border
                  }`}
                >
                  {(PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING).label}
                </span>
              )}
            </div>

            <div className="space-y-2 pt-0.5">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                {(() => {
                  const methodCfg =
                    order.paymentMethod && PAYMENT_METHOD_CONFIG[order.paymentMethod]
                      ? PAYMENT_METHOD_CONFIG[order.paymentMethod]
                      : PAYMENT_METHOD_CONFIG.WHATSAPP;
                  const Icon = methodCfg.icon;
                  return (
                    <>
                      <Icon className={`h-4 w-4 ${methodCfg.color} shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-zinc-200 block truncate">
                          {methodCfg.label}
                        </span>
                        {order.paymentExternalId && (
                          <span className="text-[10px] font-mono text-zinc-500 block truncate">
                            Ref: {order.paymentExternalId}
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Comprobante de Transferencia Bancaria */}
              {order.paymentMethod === "TRANSFER" && (
                <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-medium">Comprobante de transferencia:</span>
                    {order.transferReceiptUrl ? (
                      <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full text-[10px]">
                        PDF Adjunto
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full text-[10px]">
                        Sin comprobante
                      </span>
                    )}
                  </div>

                  {order.transferReceiptUrl ? (
                    <div className="space-y-1.5">
                      <a
                        href={`/api/orders/${order.id}/receipt`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-red-400 shrink-0" />
                        <span>Abrir y verificar comprobante PDF</span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      </a>
                      {order.transferReceiptUploadedAt && (
                        <p className="text-[10px] text-zinc-500 text-center">
                          Subido el {new Date(order.transferReceiptUploadedAt * 1000).toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      El comprador aún no ha adjuntado el comprobante de transferencia.
                    </p>
                  )}

                  {order.status === "PENDING" && (
                    <div className="p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Plazo de Reserva: 24 horas</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Si no se acredita el pago en 24 horas, la orden se cancela automáticamente y las prendas vuelven al stock.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de Confirmación Rápida de Cobro */}
              {order.paymentStatus !== "PAID" ? (
                <button
                  type="button"
                  disabled={isUpdatingPayment}
                  onClick={() => handlePaymentStatusChange("PAID")}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPayment ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Registrando cobro...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Confirmar Cobro / Marcar Pagado</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-zinc-400 p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                  <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Cobro registrado con éxito
                  </span>
                  <button
                    type="button"
                    disabled={isUpdatingPayment}
                    onClick={() => handlePaymentStatusChange("PENDING")}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                  >
                    Revertir
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Card: Selector de Estado */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Gestión de Estado
            </h2>
            <div className="space-y-2">
              <label htmlFor="order-status-select" className="sr-only">
                Cambiar estado de la orden
              </label>
              <div className="relative">
                <select
                  id="order-status-select"
                  value={order.status}
                  disabled={isUpdating}
                  onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-xs font-bold text-zinc-100 focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="PENDING">Pendiente (espera de pago/coordinación)</option>
                  <option value="CONFIRMED">Confirmada (preparando paquete)</option>
                  <option value="PAID">Pagada (pago acreditado)</option>
                  <option value="CANCELLED">Cancelada (restaura stock)</option>
                </select>
                {isUpdating && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {statusCfg.description}
              </p>
            </div>
          </section>

          {/* Card: Datos del Comprador */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-200">
              <User className="h-4 w-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Compradora
              </h2>
            </div>

            <div className="space-y-2 pt-1">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Nombre</span>
                <p className="font-semibold text-zinc-100">{order.customerName}</p>
              </div>

              {order.customerDni && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">DNI</span>
                  <p className="font-mono text-zinc-200">{order.customerDni}</p>
                </div>
              )}

              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">WhatsApp / Teléfono</span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="font-mono text-zinc-200">{order.customerPhone}</span>
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${buyerGreeting}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-900 transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span>Chat</span>
                    </a>
                  )}
                </div>
              </div>

              {order.customerEmail && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Email</span>
                  <p className="text-zinc-300 truncate">{order.customerEmail}</p>
                </div>
              )}
            </div>
          </section>

          {/* Card: Mensajes Rápidos por WhatsApp */}
          {cleanPhone && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-200">
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Mensajes rápidos por WhatsApp
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-1">
                <a
                  href={getWhatsAppTemplateLink("receipt")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-emerald-800/50 bg-emerald-950/30 hover:bg-emerald-950/60 px-3.5 py-2.5 text-xs font-medium text-emerald-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    1. Enviar datos de pago / recepción
                  </span>
                  <ExternalLink className="h-3 w-3 text-emerald-500 shrink-0" />
                </a>
                <a
                  href={getWhatsAppTemplateLink("confirmed")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-sky-800/50 bg-sky-950/30 hover:bg-sky-950/60 px-3.5 py-2.5 text-xs font-medium text-sky-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    2. Avisar que el pedido está confirmado
                  </span>
                  <ExternalLink className="h-3 w-3 text-sky-500 shrink-0" />
                </a>
                <a
                  href={getWhatsAppTemplateLink("ready")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-amber-800/50 bg-amber-950/30 hover:bg-amber-950/60 px-3.5 py-2.5 text-xs font-medium text-amber-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    3. Avisar que está listo / en camino
                  </span>
                  <ExternalLink className="h-3 w-3 text-amber-500 shrink-0" />
                </a>
              </div>
            </section>
          )}

          {/* Card: Logística y Entrega */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-200">
              <MapPin className="h-4 w-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Método de Entrega
              </h2>
            </div>

            <div className="space-y-2 pt-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200">
                {order.deliveryMethod === "HOME_DELIVERY" ? (
                  <>
                    <Truck className="h-3.5 w-3.5 text-amber-400" />
                    <span>Envío a domicilio</span>
                  </>
                ) : order.deliveryMethod === "MOTORCYCLE" ? (
                  <>
                    <Bike className="h-3.5 w-3.5 text-amber-400" />
                    <span>Motomensajería</span>
                  </>
                ) : (
                  <>
                    <Store className="h-3.5 w-3.5 text-amber-400" />
                    <span>Retiro en Showroom</span>
                  </>
                )}
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Destino</span>
                <p className="text-zinc-200 font-medium mt-0.5">
                  {order.deliveryAddress || "Retiro presencial en Showroom"}
                </p>
              </div>

              {order.deliveryNotes && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Instrucciones de entrega</span>
                  <p className="text-zinc-400 italic text-[11px] mt-0.5">
                    {order.deliveryNotes}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Card: Auditoría */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-[11px] text-zinc-500 space-y-1 font-mono">
            <p>ID Interno: #{order.id}</p>
            <p>Última actualización: {dateUpdatedStr}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
