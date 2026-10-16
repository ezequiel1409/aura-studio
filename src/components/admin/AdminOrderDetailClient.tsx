"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Printer,
  ShoppingBag,
  Store,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { Order, OrderStatus } from "../../domain/order/types";
import { formatOrderCode } from "../../domain/order/rules";
import { formatPriceARS } from "../../lib/format/currency";

interface AdminOrderDetailClientProps {
  initialOrder: Order;
  brandName?: string | null;
  whatsappNumber?: string | null;
  showroomAddress?: string | null;
}

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      alert(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setIsUpdating(false);
    }
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
        {/* Columna Izquierda (2/3): Artículos y Desglose Financiero */}
        <div className="lg:col-span-2 space-y-6">
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

        {/* Columna Derecha (1/3): Datos del Comprador, Logística y Estado */}
        <div className="space-y-6">
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
