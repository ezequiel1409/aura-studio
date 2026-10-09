import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  PlusCircle,
  ShoppingBag,
  Tag,
  FolderTree,
  Settings,
} from "lucide-react";
import { connection } from "next/server";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getBackofficeSummary } from "../../services/backoffice.service";

export default async function AdminDashboardPage() {
  await connection();
  const deps = getProductServiceDeps();
  const summary = await getBackofficeSummary(deps);

  const statCards = [
    {
      title: "Disponibles",
      count: summary.available,
      description: "Prendas con stock listas para la venta",
      href: "/admin/productos?status=AVAILABLE",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgBadge: "bg-emerald-950/40 border-emerald-800/60 text-emerald-300",
      accentBorder: "hover:border-emerald-700/50",
    },
    {
      title: "Reservadas",
      count: summary.reserved,
      description: "Prendas apartadas temporalmente",
      href: "/admin/productos?status=RESERVED",
      icon: Clock,
      color: "text-amber-400",
      bgBadge: "bg-amber-950/40 border-amber-800/60 text-amber-300",
      accentBorder: "hover:border-amber-700/50",
    },
    {
      title: "Agotadas",
      count: summary.soldOut,
      description: "Sin stock (purga automática a los 30 días)",
      href: "/admin/productos?status=SOLD_OUT",
      icon: Package,
      color: "text-zinc-400",
      bgBadge: "bg-zinc-800 border-zinc-700 text-zinc-300",
      accentBorder: "hover:border-zinc-600",
    },
    {
      title: "Por vencer",
      count: summary.expiringSoon,
      description: "Agotadas hace más de 23 días (≤ 7 días para purga)",
      href: "/admin/productos?filter=por_vencer",
      icon: AlertTriangle,
      color: "text-rose-400",
      bgBadge: "bg-rose-950/40 border-rose-800/60 text-rose-300",
      accentBorder: "hover:border-rose-700/50",
    },
    {
      title: "Sin clasificar",
      count: summary.uncategorized,
      description: "Publicadas en categoría general por defecto",
      href: "/admin/productos?filter=sin_clasificar",
      icon: Tag,
      color: "text-purple-400",
      bgBadge: "bg-purple-950/40 border-purple-800/60 text-purple-300",
      accentBorder: "hover:border-purple-700/50",
    },
    {
      title: "Sin precio",
      count: summary.noPrice,
      description: "Muestran 'Consultar precio' en el catálogo",
      href: "/admin/productos?filter=sin_precio",
      icon: DollarSign,
      color: "text-sky-400",
      bgBadge: "bg-sky-950/40 border-sky-800/60 text-sky-300",
      accentBorder: "hover:border-sky-700/50",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Bienvenida y Acciones de Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
            Resumen General (BR-36)
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 mt-1">
            Panel de Showroom
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Visualizá contadores en tiempo real, alertas de stock y métricas de catálogo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/productos/nuevo"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-200 text-zinc-950 font-semibold text-sm hover:bg-amber-100 active:scale-[0.98] transition-all shadow-md shadow-amber-950/30"
          >
            <PlusCircle size={18} />
            <span>+ Cargar Prenda</span>
          </Link>
        </div>
      </div>

      {/* Grid de Contadores Táctiles (BR-36) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`flex flex-col justify-between p-4 md:p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 transition-all hover:bg-zinc-800/50 active:scale-[0.99] group ${card.accentBorder}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {card.title}
                </span>
                <span
                  className={`p-2 rounded-xl border ${card.bgBadge}`}
                >
                  <Icon size={16} />
                </span>
              </div>

              <div className="my-3">
                <span className="text-3xl md:text-4xl font-mono font-bold tracking-tight text-zinc-100">
                  {card.count}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors pt-2 border-t border-zinc-800/60">
                <span className="line-clamp-1">{card.description}</span>
                <ArrowRight size={12} className="shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Accesos Directos Secundarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <Link
          href="/admin/productos"
          className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-200">
              <Package size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Lista de Prendas</p>
              <p className="text-xs text-zinc-400">Stock, edición y acciones en lote</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/categorias"
          className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-200">
              <FolderTree size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Categorías</p>
              <p className="text-xs text-zinc-400">Árbol, orden y métricas (BR-15)</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-zinc-500 group-hover:text-amber-200 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/configuracion"
          className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800 text-emerald-300">
              <Settings size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Configuración</p>
              <p className="text-xs text-zinc-400">WhatsApp, showroom y reservas (BR-35)</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-zinc-500 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all" />
        </Link>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-200">
              <ShoppingBag size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Catálogo Público</p>
              <p className="text-xs text-zinc-400">Explorar como clienta</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-zinc-500 group-hover:text-amber-200 group-hover:translate-x-1 transition-all" />
        </a>
      </div>
    </div>
  );
}
