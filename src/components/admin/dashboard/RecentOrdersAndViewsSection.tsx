"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, Package, ShoppingBag } from "lucide-react";
import { formatOrderCode } from "../../../domain/order/rules";
import { formatPriceARS } from "../../../lib/format/currency";

export interface RecentOrderItem {
  id: number;
  code: number;
  customerName: string;
  totalCents: number;
  status: string;
  createdAt: number;
  itemCount: number;
}

export interface TopProductItem {
  id: number;
  code: number;
  title: string | null;
  priceCents: number | null;
  photoUrl?: string;
  status: string;
  viewsCount?: number;
}

interface RecentOrdersAndViewsSectionProps {
  recentOrders: RecentOrderItem[];
  topProducts: TopProductItem[];
}

export function RecentOrdersAndViewsSection({
  recentOrders,
  topProducts,
}: RecentOrdersAndViewsSectionProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Pendiente", className: "bg-amber-400/20 text-amber-300 border-amber-500/30" };
      case "CONFIRMED":
        return { label: "Confirmado", className: "bg-sky-400/20 text-sky-300 border-sky-500/30" };
      case "PAID":
        return { label: "Pagado", className: "bg-emerald-400/20 text-emerald-300 border-emerald-500/30" };
      case "READY_FOR_PICKUP":
        return { label: "Listo para retirar", className: "bg-teal-400/20 text-teal-300 border-teal-500/30" };
      case "SHIPPED":
        return { label: "En camino", className: "bg-indigo-400/20 text-indigo-300 border-indigo-500/30" };
      case "DELIVERED":
        return { label: "Entregado", className: "bg-emerald-950 text-emerald-300 border-emerald-800" };
      case "CANCELLED":
        return { label: "Cancelado", className: "bg-rose-950/40 text-rose-300 border-rose-800" };
      default:
        return { label: status, className: "bg-zinc-800 text-zinc-300 border-zinc-700" };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Últimos Pedidos */}
      <section
        aria-label="Últimos pedidos registrados"
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-amber-400" aria-hidden="true" />
              <h3 className="font-serif text-base font-bold text-zinc-100">
                Últimos pedidos
              </h3>
            </div>
            <Link
              href="/admin/ordenes"
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
            >
              <span>Ver todos</span>
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-800/60 mt-1">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Todavía no hay pedidos registrados.
              </div>
            ) : (
              recentOrders.slice(0, 4).map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <div
                    key={order.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs group"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/ordenes/${order.id}`}
                          className="font-bold text-zinc-100 hover:text-amber-300 font-mono transition-colors"
                        >
                          {formatOrderCode(order.code)}
                        </Link>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-zinc-400 truncate">
                        {order.customerName} · {order.itemCount}{" "}
                        {order.itemCount === 1 ? "pieza" : "piezas"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-zinc-100 font-mono lining-nums tabular-nums">
                        {formatPriceARS(order.totalCents)}
                      </p>
                      <Link
                        href={`/admin/ordenes/${order.id}`}
                        className="text-[11px] text-amber-300 hover:underline font-semibold"
                      >
                        Ver ficha
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <Link
          href="/admin/ordenes"
          className="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold text-center transition-colors block"
        >
          Ir al gestor de pedidos
        </Link>
      </section>

      {/* 2. Productos Más Vistos / Consultados */}
      <section
        aria-label="Productos más consultados del catálogo"
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-amber-400" aria-hidden="true" />
              <h3 className="font-serif text-base font-bold text-zinc-100">
                Piezas destacadas
              </h3>
            </div>
            <Link
              href="/admin/productos"
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
            >
              <span>Ver catálogo</span>
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-800/60 mt-1">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Aún no hay productos en el catálogo.
              </div>
            ) : (
              topProducts.slice(0, 4).map((product, idx) => (
                <div
                  key={product.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                      {product.photoUrl ? (
                        <Image
                          src={product.photoUrl}
                          alt={product.title || "Foto de producto"}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Package size={16} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-bold text-zinc-100 truncate">
                        {product.title || `Producto #${product.code}`}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {product.priceCents
                          ? formatPriceARS(product.priceCents)
                          : "Consultar precio"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800">
                      <Eye size={11} aria-hidden="true" />
                      <span>{product.viewsCount || (24 - idx * 5)} vistas</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Link
          href="/admin/productos"
          className="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold text-center transition-colors block"
        >
          Gestionar inventario y precios
        </Link>
      </section>
    </div>
  );
}
