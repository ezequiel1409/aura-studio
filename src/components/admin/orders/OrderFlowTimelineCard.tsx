"use client";

import {
  Activity,
  CheckCircle2,
  Clock,
  CreditCard,
  Mail,
  Package,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Order, OrderTimelineEvent, OrderTimelineEventType } from "../../../domain/order/types";
import { formatPriceARS } from "../../../lib/format/currency";

interface OrderFlowTimelineCardProps {
  order: Order;
}

const ACTOR_LABELS: Record<NonNullable<OrderTimelineEvent["actor"]>, { label: string; badgeClass: string }> = {
  BUYER: { label: "Comprador", badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700" },
  MERCADOPAGO: { label: "Mercado Pago", badgeClass: "bg-sky-950/80 text-sky-300 border-sky-800/70" },
  ADMIN: { label: "Admin", badgeClass: "bg-amber-950/70 text-amber-300 border-amber-800/70" },
  SYSTEM: { label: "Sistema", badgeClass: "bg-zinc-900 text-zinc-400 border-zinc-700" },
};

function getEventVisual(type: OrderTimelineEventType) {
  switch (type) {
    case "ORDER_CREATED":
      return { icon: Sparkles, dotClass: "bg-amber-400 text-zinc-950", ringClass: "border-amber-500/40" };
    case "PAYMENT_PREFERENCE_CREATED":
      return { icon: CreditCard, dotClass: "bg-sky-500 text-white", ringClass: "border-sky-500/40" };
    case "PAYMENT_GATEWAY_RETURN":
    case "PAYMENT_WEBHOOK_RECEIVED":
      return { icon: Activity, dotClass: "bg-sky-400 text-zinc-950", ringClass: "border-sky-400/40" };
    case "PAYMENT_AUTHORIZED":
      return { icon: ShieldCheck, dotClass: "bg-sky-500 text-white", ringClass: "border-sky-500/40" };
    case "PAYMENT_PAID":
    case "ORDER_CONFIRMED":
      return { icon: CheckCircle2, dotClass: "bg-emerald-500 text-white", ringClass: "border-emerald-500/40" };
    case "STOCK_DEDUCTED":
    case "STOCK_RESTORED":
      return { icon: Package, dotClass: "bg-indigo-400 text-zinc-950", ringClass: "border-indigo-400/40" };
    case "PAYMENT_REFUNDED":
      return { icon: RotateCcw, dotClass: "bg-blue-500 text-white", ringClass: "border-blue-500/40" };
    case "PAYMENT_REJECTED":
    case "PAYMENT_CANCELLED":
    case "ORDER_CANCELLED":
      return { icon: XCircle, dotClass: "bg-rose-500 text-white", ringClass: "border-rose-500/40" };
    case "EMAIL_SENT":
      return { icon: Mail, dotClass: "bg-zinc-700 text-zinc-200", ringClass: "border-zinc-600" };
    default:
      return { icon: RefreshCw, dotClass: "bg-zinc-700 text-zinc-200", ringClass: "border-zinc-700" };
  }
}

export function OrderFlowTimelineCard({ order }: OrderFlowTimelineCardProps) {
  const isMp = order.paymentMethod === "MERCADOPAGO";
  const events: OrderTimelineEvent[] =
    order.timeline && order.timeline.length > 0
      ? order.timeline
      : [
          {
            id: `created_${order.id}`,
            at: order.createdAt,
            type: "ORDER_CREATED",
            title: "Orden creada",
            description: `Total ${formatPriceARS(order.totalCents, order.currency)}`,
            actor: "BUYER",
          },
        ];

  const isTerminalCancelledOrRefunded =
    order.status === "CANCELLED" || order.paymentStatus === "REFUNDED";
  const isRejected = order.paymentStatus === "REJECTED";
  const hasPreference = events.some((e) => e.type === "PAYMENT_PREFERENCE_CREATED") || Boolean(order.paymentDetails?.preferenceId);
  const isAuthorizedOrBeyond =
    order.paymentStatus === "AUTHORIZED" ||
    order.paymentStatus === "PAID" ||
    order.status === "PAID" ||
    order.status === "CONFIRMED" ||
    order.paymentStatus === "REFUNDED";
  const isPaidOrConfirmed =
    order.paymentStatus === "PAID" || order.status === "PAID" || order.status === "CONFIRMED";
  const isConfirmed = order.status === "CONFIRMED";

  const flowSteps = [
    {
      key: "created",
      label: "1. Orden creada",
      done: true,
    },
    ...(isMp
      ? [
          {
            key: "preference",
            label: "2. En pasarela MP",
            done: hasPreference || isAuthorizedOrBeyond || isRejected,
          },
          {
            key: "authorized",
            label: "3. Pago aceptado & stock",
            done: isAuthorizedOrBeyond,
          },
          {
            key: "paid",
            label: "4. Pago confirmado",
            done: isPaidOrConfirmed,
          },
          {
            key: "confirmed",
            label: "5. Despacho / Retiro",
            done: isConfirmed,
          },
        ]
      : [
          {
            key: "pending",
            label: "2. Cobro pendiente",
            done: true,
          },
          {
            key: "paid",
            label: "3. Pago confirmado",
            done: isPaidOrConfirmed,
          },
          {
            key: "confirmed",
            label: "4. Despacho / Retiro",
            done: isConfirmed,
          },
        ]),
  ];

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-sky-400" />
          <h2 className="text-sm font-bold text-zinc-100">
            Flujo y Trazabilidad de la Orden
          </h2>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          {events.length} {events.length === 1 ? "evento registrado" : "eventos registrados"}
        </span>
      </div>

      {/* Mapa de flujos posibles */}
      <div className="p-4 sm:p-5 bg-zinc-950/50 border-b border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {flowSteps.map((step) => (
            <div
              key={step.key}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
                step.done
                  ? "border-emerald-800/70 bg-emerald-950/50 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900/70 text-zinc-500"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
              )}
              <span>{step.label}</span>
            </div>
          ))}

          {(isRejected || isTerminalCancelledOrRefunded) && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                order.paymentStatus === "REFUNDED"
                  ? "border-blue-800/70 bg-blue-950/50 text-blue-300"
                  : "border-rose-800/70 bg-rose-950/50 text-rose-300"
              }`}
            >
              {order.paymentStatus === "REFUNDED" ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>Reembolsada & stock restituido</span>
                </>
              ) : isRejected && order.status !== "CANCELLED" ? (
                <>
                  <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>Cobro rechazado (puede reintentar)</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>Orden cancelada</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Línea de tiempo cronológica */}
      <div className="p-4 sm:p-5">
        <ol className="relative border-l border-zinc-800 ml-3 space-y-5">
          {events.map((ev) => {
            const visual = getEventVisual(ev.type);
            const Icon = visual.icon;
            const actorMeta = ev.actor ? ACTOR_LABELS[ev.actor] : ACTOR_LABELS.SYSTEM;
            const timeStr = new Date(ev.at * 1000).toLocaleString("es-AR", {
              dateStyle: "short",
              timeStyle: "medium",
            });

            const metaEntries = ev.meta
              ? Object.entries(ev.meta).filter(([, v]) => v !== null && v !== undefined && v !== "")
              : [];

            return (
              <li key={ev.id} className="ml-6 relative">
                <span
                  className={`absolute -left-[35px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${visual.dotClass} ${visual.ringClass}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-zinc-100">{ev.title}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${actorMeta.badgeClass}`}
                    >
                      {actorMeta.label}
                    </span>
                  </div>
                  <time className="text-[11px] font-mono text-zinc-500">{timeStr}</time>
                </div>
                {ev.description && (
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{ev.description}</p>
                )}
                {metaEntries.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {metaEntries.map(([k, v]) => (
                      <span
                        key={k}
                        className="rounded-md bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400"
                      >
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
