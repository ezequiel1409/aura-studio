import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  Tag,
} from "lucide-react";
import { BackofficeSummaryCounts } from "../../../domain/ports/repositories.port";

interface DashboardStatGridProps {
  summary: BackofficeSummaryCounts;
}

export function DashboardStatGrid({ summary }: DashboardStatGridProps) {
  const statCards = [
    {
      title: "Disponibles",
      count: summary.available,
      description: "Productos con stock listos para la venta",
      href: "/admin/productos?status=AVAILABLE",
      icon: CheckCircle2,
      bgBadge: "status-badge-available",
      accentBorder: "hover:border-emerald-600/60",
    },
    {
      title: "Reservadas",
      count: summary.reserved,
      description: "Productos apartados temporalmente",
      href: "/admin/productos?status=RESERVED",
      icon: Clock,
      bgBadge: "status-badge-reserved",
      accentBorder: "hover:border-amber-600/60",
    },
    {
      title: "Agotadas",
      count: summary.soldOut,
      description: "Sin stock · Listas para archivar",
      href: "/admin/productos?status=SOLD_OUT",
      icon: Package,
      bgBadge: "status-badge-soldout",
      accentBorder: "hover:border-stone-500",
    },
    {
      title: "Por vencer",
      count: summary.expiringSoon,
      description: "Agotadas hace más de 20 días",
      href: "/admin/productos?filter=por_vencer",
      icon: AlertTriangle,
      bgBadge: "status-badge-expiring",
      accentBorder: "hover:border-rose-600/60",
    },
    {
      title: "Sin clasificar",
      count: summary.uncategorized,
      description: "Publicadas en categoría general por defecto",
      href: "/admin/productos?filter=sin_clasificar",
      icon: Tag,
      bgBadge: "status-badge-uncategorized",
      accentBorder: "hover:border-purple-600/60",
    },
    {
      title: "Sin precio",
      count: summary.noPrice,
      description: "Muestran 'Consultar precio' en el catálogo",
      href: "/admin/productos?filter=sin_precio",
      icon: DollarSign,
      bgBadge: "status-badge-noprice",
      accentBorder: "hover:border-sky-600/60",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 md:gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.title}
            href={card.href}
            aria-label={`${card.title}: ${card.count} productos. ${card.description}. Ver listado filtrado.`}
            className={`flex flex-col justify-between p-4 md:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xs transition-all hover:bg-zinc-800/50 active:scale-[0.99] group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${card.accentBorder}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                {card.title}
              </span>
              <span className={`p-2 rounded-xl border ${card.bgBadge}`} aria-hidden="true">
                <Icon size={17} />
              </span>
            </div>

            <div className="my-3">
              <span className="text-3xl md:text-4xl font-mono font-bold tracking-tight text-zinc-100">
                {card.count}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors pt-2.5 border-t border-zinc-800/80">
              <span className="line-clamp-1 font-medium">{card.description}</span>
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="shrink-0 ml-1.5 group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
