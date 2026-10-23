"use client";

import Link from "next/link";
import {
  ADMIN_PRIMARY_NAV_ITEMS,
  ADMIN_QUICK_CREATE_ITEM,
  isAdminNavItemActive,
} from "./nav-items";

interface AdminDesktopNavProps {
  pathname: string;
}

export function AdminDesktopNav({ pathname }: AdminDesktopNavProps) {
  const QuickIcon = ADMIN_QUICK_CREATE_ITEM.icon;
  const isQuickActive = pathname === ADMIN_QUICK_CREATE_ITEM.href;

  return (
    <nav
      aria-label="Navegación principal de administración"
      className="hidden sm:flex items-center gap-1 bg-zinc-900/90 border border-zinc-800/90 p-1 rounded-xl"
    >
      {ADMIN_PRIMARY_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = isAdminNavItemActive(pathname, item);
        return (
          <Link prefetch={false}
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              isActive
                ? "bg-amber-200 text-zinc-950 shadow-xs admin-nav-active"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 admin-nav-inactive"
            }`}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="h-4 w-px bg-zinc-800 mx-0.5 hidden lg:block" aria-hidden="true" />

      <Link prefetch={false}
        href={ADMIN_QUICK_CREATE_ITEM.href}
        aria-current={isQuickActive ? "page" : undefined}
        className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
          isQuickActive
            ? "bg-amber-300 text-zinc-950"
            : "text-amber-300 hover:bg-amber-950/50 border border-amber-500/30"
        }`}
      >
        <QuickIcon size={14} aria-hidden="true" />
        <span>{ADMIN_QUICK_CREATE_ITEM.label}</span>
      </Link>
    </nav>
  );
}
