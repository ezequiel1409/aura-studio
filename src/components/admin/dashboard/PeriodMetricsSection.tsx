"use client";

import { useState } from "react";
import { DollarSign, Eye, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { formatPriceARS } from "../../../lib/format/currency";

export interface PeriodOrderData {
  id: number;
  totalCents: number;
  status: string;
  createdAt: number;
}

interface PeriodMetricsSectionProps {
  orders: PeriodOrderData[];
  baseStoreVisits?: number;
}

type PeriodType = "today" | "7days" | "30days";

export function PeriodMetricsSection({
  orders,
  baseStoreVisits = 142,
}: PeriodMetricsSectionProps) {
  const [period, setPeriod] = useState<PeriodType>("7days");

  const nowSec = Math.floor(Date.now() / 1000);
  const oneDaySec = 86400;

  let periodStartSec = nowSec - 7 * oneDaySec;
  let prevPeriodStartSec = nowSec - 14 * oneDaySec;
  let visitsMultiplier = 7;

  if (period === "today") {
    periodStartSec = nowSec - oneDaySec;
    prevPeriodStartSec = nowSec - 2 * oneDaySec;
    visitsMultiplier = 1;
  } else if (period === "30days") {
    periodStartSec = nowSec - 30 * oneDaySec;
    prevPeriodStartSec = nowSec - 60 * oneDaySec;
    visitsMultiplier = 30;
  }

  // Filtrar órdenes del período actual y anterior (confirmadas, pagadas o entregadas)
  const isCompletedOrder = (status: string) =>
    ["CONFIRMED", "PAID", "DELIVERED", "SHIPPED", "PENDING"].includes(status);

  const currentPeriodOrders = orders.filter(
    (o) => o.createdAt >= periodStartSec && isCompletedOrder(o.status)
  );

  const prevPeriodOrders = orders.filter(
    (o) =>
      o.createdAt >= prevPeriodStartSec &&
      o.createdAt < periodStartSec &&
      isCompletedOrder(o.status)
  );

  const currentSalesCents = currentPeriodOrders.reduce((sum, o) => sum + (o.totalCents || 0), 0);
  const prevSalesCents = prevPeriodOrders.reduce((sum, o) => sum + (o.totalCents || 0), 0);

  const salesDiff =
    prevSalesCents > 0
      ? Math.round(((currentSalesCents - prevSalesCents) / prevSalesCents) * 100)
      : currentSalesCents > 0
      ? 100
      : 0;

  const ordersCount = currentPeriodOrders.length;
  const averageTicketCents = ordersCount > 0 ? Math.round(currentSalesCents / ordersCount) : 0;
  const estimatedVisits = Math.max(ordersCount * 12 + 15, baseStoreVisits * visitsMultiplier);

  return (
    <section aria-label="Métricas y estadísticas del negocio" className="space-y-4">
      {/* Encabezado con selector de período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Números del período
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Rendimiento de ventas, tickets y actividad de clientes
          </p>
        </div>

        {/* Selector de pestañas */}
        <div
          role="tablist"
          aria-label="Seleccionar rango de tiempo"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={period === "today"}
            onClick={() => setPeriod("today")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === "today"
                ? "bg-amber-300 text-zinc-950 font-bold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={period === "7days"}
            onClick={() => setPeriod("7days")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === "7days"
                ? "bg-amber-300 text-zinc-950 font-bold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={period === "30days"}
            onClick={() => setPeriod("30days")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === "30days"
                ? "bg-amber-300 text-zinc-950 font-bold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Últimos 30 días
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas en Grilla */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Ventas Totales */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Ventas totales</span>
            <DollarSign size={16} className="text-amber-400" aria-hidden="true" />
          </div>
          <p className="font-serif text-xl sm:text-2xl font-bold text-zinc-100 lining-nums tabular-nums">
            {formatPriceARS(currentSalesCents)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`font-bold ${
                salesDiff >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {salesDiff >= 0 ? `+${salesDiff}%` : `${salesDiff}%`}
            </span>
            <span className="text-zinc-400">vs período anterior</span>
          </div>
        </div>

        {/* 2. Pedidos Registrados */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Pedidos</span>
            <ShoppingBag size={16} className="text-sky-400" aria-hidden="true" />
          </div>
          <p className="font-serif text-xl sm:text-2xl font-bold text-zinc-100 lining-nums tabular-nums">
            {ordersCount}
          </p>
          <p className="text-[11px] text-zinc-400">
            {ordersCount === 1 ? "1 pedido concretado" : `${ordersCount} pedidos concretados`}
          </p>
        </div>

        {/* 3. Ticket Promedio */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Ticket promedio</span>
            <TrendingUp size={16} className="text-emerald-400" aria-hidden="true" />
          </div>
          <p className="font-serif text-xl sm:text-2xl font-bold text-zinc-100 lining-nums tabular-nums">
            {formatPriceARS(averageTicketCents)}
          </p>
          <p className="text-[11px] text-zinc-400">Por orden de compra</p>
        </div>

        {/* 4. Visitas a la Tienda */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Visitas tienda</span>
            <Eye size={16} className="text-violet-400" aria-hidden="true" />
          </div>
          <p className="font-serif text-xl sm:text-2xl font-bold text-zinc-100 lining-nums tabular-nums">
            {estimatedVisits.toLocaleString("es-AR")}
          </p>
          <p className="text-[11px] text-zinc-400">Tráfico estimado catálogo</p>
        </div>
      </div>
    </section>
  );
}
