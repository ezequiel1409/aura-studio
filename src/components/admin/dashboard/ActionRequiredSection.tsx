"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle, Clock, DollarSign, PackageSearch, ShoppingBag, Sparkles } from "lucide-react";

interface ActionRequiredProps {
  pendingOrdersCount: number;
  expiringReservationsCount: number;
  unpricedProductsCount: number;
  uncategorizedProductsCount: number;
}

export function ActionRequiredSection({
  pendingOrdersCount,
  expiringReservationsCount,
  unpricedProductsCount,
  uncategorizedProductsCount,
}: ActionRequiredProps) {
  const hasIssues =
    pendingOrdersCount > 0 ||
    expiringReservationsCount > 0 ||
    unpricedProductsCount > 0 ||
    uncategorizedProductsCount > 0;

  if (!hasIssues) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300">
        <Sparkles size={18} className="text-emerald-400 shrink-0" aria-hidden="true" />
        <div className="flex-1 text-xs">
          <strong className="font-bold">Todo en orden.</strong> No tenés pedidos pendientes ni productos con datos incompletos ✨
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Acciones prioritarias requeridas" className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">
          Requiere tu atención
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Pedidos pendientes */}
        {pendingOrdersCount > 0 && (
          <div className="flex flex-col justify-between p-4 rounded-2xl bg-zinc-900 border border-amber-500/40 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
                  <ShoppingBag size={15} aria-hidden="true" />
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-300 text-zinc-950 font-mono">
                  {pendingOrdersCount}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100">
                {pendingOrdersCount === 1 ? "1 pedido pendiente" : `${pendingOrdersCount} pedidos pendientes`}
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Reservas registradas esperando confirmación o comprobante de pago.
              </p>
            </div>

            <Link prefetch={false}
              href="/admin/ordenes?status=PENDING"
              className="mt-3.5 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <span>Revisar pedidos</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        )}

        {/* 2. Reservas por vencer */}
        {expiringReservationsCount > 0 && (
          <div className="flex flex-col justify-between p-4 rounded-2xl bg-zinc-900 border border-rose-500/40 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-rose-400/20 text-rose-300">
                  <Clock size={15} aria-hidden="true" />
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-400 text-zinc-950 font-mono">
                  {expiringReservationsCount}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100">
                {expiringReservationsCount === 1 ? "1 reserva por vencer" : `${expiringReservationsCount} reservas por vencer`}
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Prendas apartadas que superaron el tiempo de reserva acordado.
              </p>
            </div>

            <Link prefetch={false}
              href="/admin/productos?filter=por_vencer"
              className="mt-3.5 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-rose-700/50 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
            >
              <span>Ver reservas</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        )}

        {/* 3. Productos sin precio */}
        {unpricedProductsCount > 0 && (
          <div className="flex flex-col justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-zinc-800 text-amber-300">
                  <DollarSign size={15} aria-hidden="true" />
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300 border border-zinc-700 font-mono">
                  {unpricedProductsCount}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100">
                {unpricedProductsCount === 1 ? "1 producto sin precio" : `${unpricedProductsCount} sin precio`}
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Muestra &ldquo;Consultar precio&rdquo; en el catálogo público.
              </p>
            </div>

            <Link prefetch={false}
              href="/admin/productos?filter=sin_precio"
              className="mt-3.5 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <span>Asignar precio</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        )}

        {/* 4. Productos sin clasificar */}
        {uncategorizedProductsCount > 0 && (
          <div className="flex flex-col justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
                  <PackageSearch size={15} aria-hidden="true" />
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  {uncategorizedProductsCount}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100">
                {uncategorizedProductsCount === 1 ? "1 sin categorizar" : `${uncategorizedProductsCount} sin categorizar`}
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Se muestran bajo categoría general por defecto.
              </p>
            </div>

            <Link prefetch={false}
              href="/admin/productos?filter=sin_clasificar"
              className="mt-3.5 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <span>Categorizar</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

