"use client";

import Link, { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { AdminSubNavItem, isSubNavItemActive } from "../header/nav-items";

interface AdminSubNavLinkProps {
  item: AdminSubNavItem;
  pathname: string;
  variant: "sidebar" | "tab" | "drawer";
  onClick?: () => void;
}

function AdminTabPendingIndicator({ variant }: { variant: AdminSubNavLinkProps["variant"] }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <Loader2
      size={variant === "drawer" ? 12 : 13}
      aria-hidden="true"
      className="ml-auto shrink-0 animate-spin opacity-80"
    />
  );
}

const VARIANT_STYLES: Record<
  AdminSubNavLinkProps["variant"],
  {
    base: string;
    active: string;
    inactive: string;
    iconSize: number;
    iconActiveClass: string;
    iconInactiveClass: string;
    labelClass?: string;
  }
> = {
  sidebar: {
    base: "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none",
    active: "bg-amber-200 text-zinc-950 font-bold shadow-xs admin-nav-active",
    inactive: "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 admin-nav-inactive",
    iconSize: 15,
    iconActiveClass: "shrink-0",
    iconInactiveClass: "shrink-0",
    labelClass: "truncate",
  },
  tab: {
    base: "inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none",
    active: "bg-amber-300 text-zinc-950 font-bold shadow-xs admin-nav-active",
    inactive:
      "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 admin-nav-inactive",
    iconSize: 13,
    iconActiveClass: "shrink-0",
    iconInactiveClass: "shrink-0",
  },
  drawer: {
    base: "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none",
    active: "bg-amber-200 border-amber-300 text-zinc-950 font-bold admin-nav-active",
    inactive: "bg-zinc-900 border-zinc-800 text-zinc-200 hover:text-amber-300 admin-nav-inactive",
    iconSize: 13,
    iconActiveClass: "text-zinc-950 shrink-0",
    iconInactiveClass: "text-amber-300 shrink-0",
    labelClass: "truncate",
  },
};

/**
 * Enlace reutilizable para subsecciones de administración.
 * Centraliza la detección de ruta activa y el indicador inline de transición (`useLinkStatus`)
 * sin provocar layout shift ni recrear los tabs padre durante la navegación.
 */
export function AdminSubNavLink({
  item,
  pathname,
  variant,
  onClick,
}: AdminSubNavLinkProps) {
  const Icon = item.icon;
  const isActive = isSubNavItemActive(pathname, item);
  const styles = VARIANT_STYLES[variant];

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`${styles.base} ${isActive ? styles.active : styles.inactive}`}
    >
      <Icon
        size={styles.iconSize}
        className={isActive ? styles.iconActiveClass : styles.iconInactiveClass}
        aria-hidden="true"
      />
      <span className={styles.labelClass}>{item.label}</span>
      <AdminTabPendingIndicator variant={variant} />
    </Link>
  );
}
