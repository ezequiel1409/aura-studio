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
      accentBorder: "hover:border-emerald-600/50",
    },
    {
      title: "Reservadas",
      count: summary.reserved,
      description: "Productos apartados temporalmente",
      href: "/admin/productos?status=RESERVED",
      icon: Clock,
      bgBadge: "status-badge-reserved",
      accentBorder: "hover:border-amber-600/50",
    },
    {
      title: "Agotadas",
      count: summary.soldOut,
      description: "Sin stock (purga automática a los 30 días)",
      href: "/admin/productos?status=SOLD_OUT",
      icon: Package,
      bgBadge: "status-badge-soldout",
      accentBorder: "hover:border-stone-500",
    },
    {
      title: "Por vencer",
      count: summary.expiringSoon,
      description: "Agotadas hace más de 23 días (≤ 7 días para purga)",
      href: "/admin/productos?filter=por_vencer",
      icon: AlertTriangle,
      bgBadge: "status-badge-expiring",
      accentBorder: "hover:border-rose-600/50",
    },
    {
      title: "Sin clasificar",
      count: summary.uncategorized,
      description: "Publicadas en categoría general por defecto",
      href: "/admin/productos?filter=sin_clasificar",
      icon: Tag,
      bgBadge: "status-badge-uncategorized",
      accentBorder: "hover:border-purple-600/50",
    },
    {
      title: "Sin precio",
      count: summary.noPrice,
      description: "Muestran 'Consultar precio' en el catálogo",
      href: "/admin/productos?filter=sin_precio",
      icon: DollarSign,
      bgBadge: "status-badge-noprice",
      accentBorder: "hover:border-sky-600/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.title}
            href={card.href}
            aria-label={`${card.title}: ${card.count} productos. ${card.description}. Ver listado filtrado.`}
            className={`flex flex-col justify-between p-4 md:p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 transition-all hover:bg-zinc-800/50 active:scale-[0.99] group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${card.accentBorder}`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {card.title}
              </span>
              <span className={`p-2 rounded-xl border ${card.bgBadge}`} aria-hidden="true">
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
              <ArrowRight
                size={12}
                aria-hidden="true"
                className="shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

