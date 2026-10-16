import Link from "next/link";
import { ArrowRight, FolderTree, Package, Settings, ShoppingBag } from "lucide-react";

interface DashboardQuickLinksProps {
  totalOrdersCount: number;
  pendingOrdersCount: number;
}

export function DashboardQuickLinks({
  totalOrdersCount,
  pendingOrdersCount,
}: DashboardQuickLinksProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
      <Link
        href="/admin/ordenes"
        aria-label={`Ir a gestión de pedidos: ${totalOrdersCount} órdenes, ${pendingOrdersCount} pendientes`}
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-amber-400/60 transition-all group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-300"
            aria-hidden="true"
          >
            <ShoppingBag size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-zinc-200">Pedidos</p>
              {pendingOrdersCount > 0 && (
                <span className="rounded-full bg-amber-400 text-zinc-950 px-1.5 py-0.2 text-[10px] font-bold">
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {totalOrdersCount} {totalOrdersCount === 1 ? "orden" : "órdenes"}
            </p>
          </div>
        </div>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="text-zinc-500 group-hover:text-amber-300 group-hover:translate-x-1 transition-all"
        />
      </Link>

      <Link
        href="/admin/productos"
        aria-label="Ir al catálogo de productos: gestión de stock, edición y acciones en lote"
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-200" aria-hidden="true">
            <Package size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">Catálogo de Productos</p>
            <p className="text-xs text-zinc-400">Stock, edición y acciones en lote</p>
          </div>
        </div>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all"
        />
      </Link>

      <Link
        href="/admin/categorias"
        aria-label="Ir a categorías: árbol, orden y métricas de visitas"
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-200" aria-hidden="true">
            <FolderTree size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">Categorías</p>
            <p className="text-xs text-zinc-400">Árbol, orden y visitas acumuladas</p>
          </div>
        </div>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="text-zinc-500 group-hover:text-amber-200 group-hover:translate-x-1 transition-all"
        />
      </Link>

      <Link
        href="/admin/configuracion"
        aria-label="Ir a configuración de la tienda: parte superior, portada, pie de página y equipo"
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 text-emerald-300" aria-hidden="true">
            <Settings size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">Configuración</p>
            <p className="text-xs text-zinc-400">Cabecera, portada, pie y equipo</p>
          </div>
        </div>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="text-zinc-500 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all"
        />
      </Link>

      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir catálogo público de la tienda como clienta (en nueva pestaña)"
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-200" aria-hidden="true">
            <ShoppingBag size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">Catálogo Público</p>
            <p className="text-xs text-zinc-400">Explorar como clienta</p>
          </div>
        </div>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="text-zinc-500 group-hover:text-amber-200 group-hover:translate-x-1 transition-all"
        />
      </a>
    </div>
  );
}

