"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";
import { formatPrice } from "../../lib/format/currency";

interface SandboxOrderItem {
  productCode: number;
  productTitle: string;
  colorName: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
  photoUrl: string | null;
}

interface SandboxOrderSummary {
  id: number;
  code: number;
  customerName: string;
  customerEmail: string;
  deliveryMethod?: string;
  deliveryAddress?: string | null;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  paymentDiscountCents?: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  externalCheckoutUrl?: string | null;
  items: SandboxOrderItem[];
}

interface CheckoutProSandboxPanelProps {
  orderCode: number;
  paymentId: string | null;
  initialPaymentStatusParam: string | null;
  brandName: string;
  isCustomerLoggedIn: boolean;
  onPaymentAccepted?: () => void;
  onReturnToCart?: () => void;
}

export function CheckoutProSandboxPanel({
  orderCode,
  paymentId,
  initialPaymentStatusParam,
  brandName,
  isCustomerLoggedIn,
  onPaymentAccepted,
  onReturnToCart,
}: CheckoutProSandboxPanelProps) {
  const [order, setOrder] = useState<SandboxOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<"card" | "account_money">("card");

  const fetchOrderSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({
        order_code: String(orderCode),
      });
      if (paymentId) {
        query.set("payment_id", paymentId);
      }
      if (initialPaymentStatusParam) {
        query.set("payment_status", initialPaymentStatusParam);
      }

      const res = await fetch(`/api/payments/sandbox-order?${query.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data?.order) {
        throw new Error(data?.error || "No se pudo cargar la orden para el pago.");
      }
      setOrder(data.order);
      return data.order as SandboxOrderSummary;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la orden.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [initialPaymentStatusParam, orderCode, paymentId]);

  const executeGatewayCallback = useCallback(
    async (simulatedStatus: "approved" | "rejected") => {
      try {
        setProcessingPayment(true);
        setError(null);

        const effectivePaymentId = paymentId || `mock_pref_${orderCode}_${Date.now()}`;
        const res = await fetch("/api/payments/webhook/mercadopago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payment",
            id: effectivePaymentId,
            data: { id: effectivePaymentId },
            order_code: orderCode,
            status: simulatedStatus,
          }),
        });

        const data = await res.json();
        if (!res.ok || data?.received === false) {
          throw new Error(data?.error || "Error al procesar el pago con Mercado Pago.");
        }

        if (simulatedStatus === "approved") {
          onPaymentAccepted?.();
        }

        await fetchOrderSummary();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al procesar el pago.");
      } finally {
        setProcessingPayment(false);
      }
    },
    [fetchOrderSummary, onPaymentAccepted, orderCode, paymentId]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const loadedOrder = await fetchOrderSummary();
      if (!active || !loadedOrder) return;

      const isSimulatedPref = !paymentId || paymentId.startsWith("mock_pref_");

      if (
        loadedOrder.paymentStatus === "AUTHORIZED" ||
        loadedOrder.paymentStatus === "PAID"
      ) {
        onPaymentAccepted?.();
      } else if (
        (initialPaymentStatusParam === "approved" || initialPaymentStatusParam === "authorized") &&
        isSimulatedPref
      ) {
        await executeGatewayCallback("approved");
      } else if (
        (initialPaymentStatusParam === "failure" ||
          initialPaymentStatusParam === "rejected" ||
          initialPaymentStatusParam === "cancelled") &&
        loadedOrder.paymentStatus === "PENDING" &&
        isSimulatedPref
      ) {
        await executeGatewayCallback("rejected");
      }
    })();

    return () => {
      active = false;
    };
  }, [executeGatewayCallback, fetchOrderSummary, initialPaymentStatusParam, onPaymentAccepted, paymentId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-sky-600" />
        <p className="text-sm font-medium text-stone-700">
          Cargando desglose de compra en Mercado Pago Checkout Pro...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center space-y-4">
          <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
          <h2 className="text-lg font-semibold text-stone-900">
            No pudimos abrir la pasarela de pago
          </h2>
          <p className="text-xs text-stone-600">
            {error || "Verificá el número de orden e intentá nuevamente."}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {onReturnToCart ? (
              <button
                type="button"
                onClick={onReturnToCart}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al carrito
              </button>
            ) : (
              <Link
                href="/carrito"
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al carrito
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const formattedCode = `#${order.code.toString().padStart(3, "0")}`;
  const isAcceptedOrPaid =
    order.paymentStatus === "AUTHORIZED" || order.paymentStatus === "PAID";
  const isCallbackError =
    order.paymentStatus === "REJECTED" &&
    (initialPaymentStatusParam === "failure" ||
      initialPaymentStatusParam === "rejected" ||
      initialPaymentStatusParam === "cancelled");

  if (isCallbackError) {
    return (
      <div className="mx-auto max-w-xl py-6 sm:py-10">
        <div className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <XCircle className="h-7 w-7" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
            Mercado Pago · Pago Rechazado
          </p>
          <h1 className="mt-1.5 font-serif text-2xl sm:text-3xl font-medium text-stone-900">
            No se pudo completar el pago de tu orden {formattedCode}
          </h1>
          <p className="mt-2 mx-auto max-w-md text-xs sm:text-sm text-stone-600">
            La operación fue rechazada o cancelada en Mercado Pago. No se realizó ningún cargo en tu medio de pago.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {order.externalCheckoutUrl && (
              <a
                href={order.externalCheckoutUrl}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-sky-600 transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                <span>Reintentar pago en Mercado Pago</span>
              </a>
            )}
            {onReturnToCart ? (
              <button
                type="button"
                onClick={onReturnToCart}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-5 py-3 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver al carrito y elegir otro medio</span>
              </button>
            ) : (
              <Link
                href="/carrito"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-5 py-3 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver al carrito</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isAcceptedOrPaid) {
    return (
      <div className="mx-auto max-w-xl py-6 sm:py-10">
        <div className="rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
            Mercado Pago · {order.paymentStatus === "PAID" ? "Pago Confirmado" : "Pago Aceptado"}
          </p>
          <h1 className="mt-1.5 font-serif text-2xl sm:text-3xl font-medium text-stone-900">
            ¡Tu solicitud de compra {formattedCode} fue cargada!
          </h1>
          <p className="mt-2 mx-auto max-w-md text-xs sm:text-sm font-medium text-[#926a3c]">
            Para poder seguir dándole seguimiento a tu pedido, create una cuenta con tu email y contraseña.
          </p>

          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-left space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-950">Estado del pago:</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                {order.paymentStatus === "PAID" ? "Pago Confirmado" : "Pago Aceptado"}
              </span>
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              {order.paymentStatus === "PAID"
                ? "Tu pago ya fue confirmado y acreditado. Estamos preparando tu pedido."
                : "Mercado Pago aceptó tu operación. Te enviamos un correo de Pago Aceptado y te notificaremos en un correo aparte apenas quede confirmado el cobro."}
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isCustomerLoggedIn ? (
              <Link
                href={`/cuenta/login?tab=register&email=${encodeURIComponent(order.customerEmail)}`}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider hover:bg-stone-800 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Crear cuenta con mi email y contraseña</span>
              </Link>
            ) : (
              <Link
                href="/cuenta"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider hover:bg-stone-800 transition-colors"
              >
                <span>Ver seguimiento en Mi Cuenta</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            <Link
              href="/catalogo"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-stone-200 bg-white px-5 py-3 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Seguir mirando el catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalItemsQuantity = order.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl py-4 sm:py-8 space-y-4">
      {/* Barra superior con Botón de Volver al Carrito */}
      <div className="flex items-center justify-between">
        {onReturnToCart ? (
          <button
            type="button"
            onClick={onReturnToCart}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al carrito / Cambiar medio de pago</span>
          </button>
        ) : (
          <Link
            href="/carrito"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al carrito / Cambiar medio de pago</span>
          </Link>
        )}

        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-[11px] font-semibold text-sky-800">
          <Lock className="h-3 w-3 text-sky-600" />
          Entorno Seguro Checkout Pro
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (5 cols): Desglose visual con Foto de cada prenda que llevás */}
        <div className="lg:col-span-5 rounded-2xl border border-[#e7e2da] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Resumen de tu bolsa
              </p>
              <h2 className="font-serif text-lg font-medium text-stone-900">
                Lo que llevás ({totalItemsQuantity} {totalItemsQuantity === 1 ? "prenda" : "prendas"})
              </h2>
            </div>
            <span className="rounded-lg bg-stone-100 px-2.5 py-1 font-mono text-xs font-bold text-stone-700">
              {formattedCode}
            </span>
          </div>

          {/* Lista de prendas con miniatura fotográfica */}
          <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto pr-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3.5 py-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 flex items-center justify-center">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-stone-400" />
                  )}
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-[10px] font-bold text-white">
                    {item.quantity}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-stone-900">
                    {item.productTitle}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 font-medium text-stone-700">
                      {item.colorName}
                    </span>
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 font-medium text-stone-700">
                      Talle {item.size}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400">
                    {item.quantity} × {formatPrice(item.unitPriceCents, "ARS")}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-stone-900">
                    {formatPrice(item.unitPriceCents * item.quantity, "ARS")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desglose de importes */}
          <div className="border-t border-stone-200 pt-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal de prendas</span>
              <span className="font-medium text-stone-900">
                {formatPrice(order.subtotalCents, "ARS")}
              </span>
            </div>

            {order.discountCents > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento por cupón</span>
                <span className="font-medium">
                  -{formatPrice(order.discountCents, "ARS")}
                </span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span>Costo de entrega</span>
              <span className="font-medium text-stone-900">
                {order.shippingCents > 0
                  ? formatPrice(order.shippingCents, "ARS")
                  : "Gratis (Retiro en Showroom)"}
              </span>
            </div>

            <div className="flex justify-between border-t border-stone-200 pt-2.5 text-sm font-bold text-stone-900">
              <span>Total a pagar</span>
              <span className="text-base text-sky-700">
                {formatPrice(order.totalCents, "ARS")}
              </span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (7 cols): Pasarela Mercado Pago Checkout Pro */}
        <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-md">
          <div className="bg-gradient-to-r from-sky-600 to-sky-500 px-6 py-5 text-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-sky-100" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Mercado Pago Checkout Pro
                </span>
              </div>
              <span className="rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-stone-900">
                Modo Sandbox
              </span>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <p className="text-xs text-sky-100">Comercio: {brandName}</p>
                <h1 className="text-lg sm:text-xl font-bold">
                  Gestión de Pago · Orden {formattedCode}
                </h1>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[11px] text-sky-100">Importe total</p>
                <p className="text-2xl font-extrabold">
                  {formatPrice(order.totalCents, "ARS")}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {order.paymentStatus === "REJECTED" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">El intento de pago anterior fue rechazado.</p>
                  <p className="mt-0.5 text-[11px]">
                    Podés elegir otro medio de pago abajo y volver a intentar.
                  </p>
                </div>
              </div>
            )}

            {/* Selección de instrumento de pago en Checkout Pro Sandbox */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-stone-800">
                Elegí tu medio de pago en Checkout Pro (Sandbox):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInstrument("card")}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                    selectedInstrument === "card"
                      ? "border-sky-500 bg-sky-50/50 ring-1 ring-sky-500"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-stone-900">
                      Tarjeta Visa / Mastercard Test
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Terminada en •••• 4509 (Acreditación instantánea)
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedInstrument("account_money")}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                    selectedInstrument === "account_money"
                      ? "border-sky-500 bg-sky-50/50 ring-1 ring-sky-500"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  <Wallet className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-stone-900">
                      Dinero en cuenta Mercado Pago
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Saldo disponible de prueba en Sandbox
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Botones de acción de Checkout Pro Sandbox */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                disabled={processingPayment}
                onClick={() => executeGatewayCallback("approved")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-sky-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Procesando pago en Sandbox...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      Pagar {formatPrice(order.totalCents, "ARS")} (Aprobar Pago en Sandbox)
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={processingPayment}
                onClick={() => executeGatewayCallback("rejected")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-60 transition-colors cursor-pointer"
              >
                Simular rechazo de pago (Probar pantalla de error)
              </button>

              {order.externalCheckoutUrl && (
                <div className="border-t border-stone-100 pt-3">
                  <a
                    href={order.externalCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-2.5 text-xs font-semibold text-sky-800 hover:bg-sky-100/70 transition-colors"
                  >
                    <span>Abrir también en web externa de Mercado Pago Sandbox</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
