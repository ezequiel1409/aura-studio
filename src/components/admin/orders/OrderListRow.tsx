"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  RotateCcw,
} from "lucide-react";
import { Order, OrderStatus } from "../../../domain/order/types";
import { formatOrderCode } from "../../../domain/order/rules";
import { formatPriceARS } from "../../../lib/format/currency";
import {
  getDeliveryMethodMeta,
  getOrderWhatsAppLink,
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_KEYS,
  PAYMENT_METHOD_CONFIG,
} from "./order-ui.config";

export interface OrderListRowProps {
  order: Order;
  density: "comfortable" | "compact";
  isExpanded: boolean;
  isUpdating: boolean;
  brandName: string;
  onToggleExpand: (orderId: number) => void;
  onStatusChange: (orderId: number, status: OrderStatus) => void;
}

const CLAIM_BADGE_CLASS: Record<string, { labelPrefix?: string; label?: string; className: string }> = {
  PENDING: {
    className: "bg-rose-950/90 text-rose-200 border-rose-600/80 animate-pulse",
  },
  APPROVED_RESTOCKED: {
    label: "Devolución Aprobada",
    className: "bg-emerald-950/80 text-emerald-300 border-emerald-700/80",
  },
  REJECTED_CONDITION: {
    label: "Devolución Rechazada",
    className: "bg-zinc-900 text-rose-300 border-rose-800/80",
  },
};

/**
 * Fila de pedido en la vista administrativa con acordeón inline de prendas y cambio rápido de estado.
 */
export function OrderListRow({
  order,
  density,
  isExpanded,
  isUpdating,
  brandName,
  onToggleExpand,
  onStatusChange,
}: OrderListRowProps) {
  const config = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.PENDING;
  const StatusIcon = config.icon;
  const orderCodeLabel = formatOrderCode(order.code);
  const deliveryMeta = getDeliveryMethodMeta(order.deliveryMethod);
  const DeliveryIcon = deliveryMeta.icon;
  const paymentShortLabel = order.paymentMethod
    ? PAYMENT_METHOD_CONFIG[order.paymentMethod]?.shortLabel || "WhatsApp"
    : null;

  const claimMeta = order.claim
    ? CLAIM_BADGE_CLASS[order.claim.status] || CLAIM_BADGE_CLASS.REJECTED_CONDITION
    : null;

  const primaryWaType =
    order.status === "PENDING" ? "receipt" : order.status === "CONFIRMED" ? "confirmed" : "ready";

  return (
    <div className="transition-colors hover:bg-zinc-900/40">
      {/* Fila Principal (Nivel 1) */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 ${
          density === "compact" ? "py-2" : "py-3.5"
        }`}
      >
        {/* Columna Izquierda: Botón Acordeón + Código + Cliente + Badges */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onToggleExpand(order.id)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Ocultar" : "Desplegar"} resumen rápido del pedido ${orderCodeLabel}`}
            title={
              isExpanded
                ? "Ocultar resumen rápido"
                : "Desplegar prendas y entrega sin salir de la lista"
            }
            className="min-w-[44px] min-h-[44px] rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-400/60 flex items-center justify-center text-zinc-300 hover:text-amber-300 text-xs shrink-0 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <span aria-hidden="true">{isExpanded ? "▴" : "▾"}</span>
          </button>

          <Link
            href={`/admin/ordenes/${order.id}`}
            className={`${
              density === "compact" ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-xs"
            } rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-400 font-mono font-bold text-amber-300 shrink-0 transition-colors`}
            title={`Abrir ficha completa de ${orderCodeLabel}`}
          >
            {orderCodeLabel}
          </Link>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/admin/ordenes/${order.id}`}
                className="text-sm font-bold text-zinc-100 hover:text-amber-300 transition-colors truncate"
              >
                {order.customerName}
              </Link>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.bg} ${config.text} ${config.border}`}
              >
                <StatusIcon size={11} />
                <span>{config.label}</span>
              </span>

              {paymentShortLabel && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {paymentShortLabel}
                </span>
              )}

              {order.claim && claimMeta && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${claimMeta.className}`}
                >
                  <RotateCcw size={10} />
                  <span>
                    {order.claim.status === "PENDING"
                      ? `Postventa: ${order.claim.claimCode}`
                      : claimMeta.label}
                  </span>
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-zinc-300">{order.customerPhone}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-zinc-300">
                <DeliveryIcon size={11} className="text-amber-400" />
                {deliveryMeta.shortLabel}
              </span>
              <span>·</span>
              <span>
                {order.items?.length || 1} {order.items?.length === 1 ? "prenda" : "prendas"}
              </span>
              <span>·</span>
              <span className="text-zinc-400">
                {new Date(order.createdAt * 1000).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Columna Derecha: Selector Rápido de Estado + Total + Link a Ficha Completa */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 shrink-0 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-zinc-800/60 w-full lg:w-auto">
          <div
            role="group"
            aria-label={`Cambiar estado de pedido ${orderCodeLabel}`}
            className="inline-flex flex-wrap sm:flex-nowrap gap-1 rounded-xl bg-zinc-950 p-1 border border-zinc-800 w-full sm:w-auto"
          >
            {ORDER_STATUS_KEYS.map((statusKey) => {
              const st = ORDER_STATUS_CONFIG[statusKey];
              const active = order.status === statusKey;
              return (
                <button
                  key={statusKey}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onStatusChange(order.id, statusKey)}
                  aria-pressed={active}
                  className={`min-h-[38px] flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    active ? st.quickActiveClass : "text-zinc-400 hover:text-zinc-200"
                  } ${isUpdating ? "opacity-50" : ""}`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          <div className="text-left sm:text-right min-w-[95px]">
            <p className="font-serif text-sm sm:text-base font-bold text-zinc-100 font-mono lining-nums tabular-nums">
              {formatPriceARS(order.totalCents)}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <a
              href={getOrderWhatsAppLink(order, primaryWaType, brandName)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Abrir chat de WhatsApp con ${order.customerName}`}
              aria-label={`Abrir chat de WhatsApp con ${order.customerName}`}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none shrink-0 cursor-pointer"
            >
              <MessageCircle size={15} className="fill-white" />
              <span className="font-semibold text-xs">Chat</span>
            </a>

            <Link
              href={`/admin/ordenes/${order.id}`}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-zinc-800 hover:bg-amber-300 text-zinc-100 hover:text-zinc-950 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none shrink-0"
            >
              <span>Ver ficha</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Panel Desplegable Inline */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-zinc-950/60 border-t border-zinc-800/60 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                Prendas del pedido ({order.items?.length || 0})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.photoUrl ? (
                        <div className="relative w-9 h-11 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                          <Image
                            src={item.photoUrl}
                            alt={item.productTitle}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-11 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                          <Package size={14} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-200 truncate">
                          #{String(item.productCode).padStart(3, "0")} · {item.productTitle}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {item.colorName} · Talle {item.size} ·{" "}
                          <strong className="text-zinc-200">x{item.quantity}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-zinc-200 shrink-0">
                      {formatPriceARS(item.subtotalCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 text-xs bg-zinc-900/70 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Destino / Entrega
                  </span>
                  <p className="text-zinc-200 font-medium">
                    {order.deliveryAddress || "Retiro presencial en Showroom"}
                  </p>
                  {order.deliveryNotes && (
                    <p className="text-[11px] text-zinc-400 italic mt-0.5">
                      Nota: {order.deliveryNotes}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <a
                    href={getOrderWhatsAppLink(order, "receipt", brandName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/60 text-emerald-300 text-[11px] font-medium transition-colors"
                  >
                    WA Pago
                  </a>
                  <a
                    href={getOrderWhatsAppLink(order, "confirmed", brandName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-sky-950/60 hover:bg-sky-900/70 border border-sky-800/60 text-sky-300 text-[11px] font-medium transition-colors"
                  >
                    WA Confirmado
                  </a>
                  <a
                    href={getOrderWhatsAppLink(order, "ready", brandName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/60 text-amber-300 text-[11px] font-medium transition-colors"
                  >
                    WA Listo
                  </a>
                </div>

                <Link
                  href={`/admin/ordenes/${order.id}`}
                  className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold hover:underline"
                >
                  <span>Ficha completa e impresión</span>
                  <ExternalLink size={11} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
