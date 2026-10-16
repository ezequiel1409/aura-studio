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
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400 transition-all group shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 shrink-0"
            aria-hidden="true"
          >
            <ShoppingBag size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-zinc-100 truncate">Pedidos</p>
              {pendingOrdersCount > 0 && (
                <span className="rounded-full bg-amber-300 text-zinc-950 px-2 py-0.5 text-[11px] font-bold shrink-0">
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              {totalOrdersCount} {totalOrdersCount === 1 ? "orden" : "órdenes"}
            </p>
          </div>
        </div>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="text-zinc-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all shrink-0 ml-2"
        />
      </Link>

      <Link
        href="/admin/productos"
        aria-label="Ir al catálogo de productos: gestión de stock, edición y acciones en lote"
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700/80 text-zinc-200 shrink-0" aria-hidden="true">
            <Package size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-100 truncate">Catálogo</p>
            <p className="text-xs text-zinc-400 font-medium truncate">Stock, edición y lote</p>
          </div>
        </div>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="text-zinc-400 group-hover:text-zinc-100 group-hover:translate-x-1 transition-all shrink-0 ml-2"
        />
      </Link>

      <Link
        href="/admin/categorias"
        aria-label="Ir a categorías: árbol, orden y métricas de visitas"
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700/80 text-amber-300 shrink-0" aria-hidden="true">
            <FolderTree size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-100 truncate">Categorías</p>
            <p className="text-xs text-zinc-400 font-medium truncate">Árbol, orden y visitas</p>
          </div>
        </div>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="text-zinc-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all shrink-0 ml-2"
        />
      </Link>

      <Link
        href="/admin/configuracion"
        aria-label="Ir a configuración de la tienda: parte superior, portada, pie de página y equipo"
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700/80 text-emerald-300 shrink-0" aria-hidden="true">
            <Settings size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-100 truncate">Configuración</p>
            <p className="text-xs text-zinc-400 font-medium truncate">Cabecera, portada y pie</p>
          </div>
        </div>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="text-zinc-400 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all shrink-0 ml-2"
        />
      </Link>

      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir catálogo público de la tienda como clienta (en nueva pestaña)"
        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group shadow-2xs focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700/80 text-amber-300 shrink-0" aria-hidden="true">
            <ShoppingBag size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-100 truncate">Catálogo Público</p>
            <p className="text-xs text-zinc-400 font-medium truncate">Explorar como clienta</p>
          </div>
        </div>
        <ArrowRight
          size={16}
          aria-hidden="true"
          className="text-zinc-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all shrink-0 ml-2"
        />
      </a>
    </div>
  );
}
