"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { isSubNavItemActive } from "../header/nav-items";
import { useAdminNav } from "./AdminNavContext";

export function AdminSecondarySidebar() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams ? searchParams.toString() : "";

  const { isCollapsed, activeGroup, hasSecondary } = useAdminNav();

  if (!hasSecondary || !activeGroup || !activeGroup.subItems) {
    return null;
  }

  return (
    <aside
      aria-label={`Subsecciones de ${activeGroup.label}`}
      className={`hidden md:flex flex-col fixed inset-y-0 z-40 bg-zinc-900/95 backdrop-blur-md border-r border-zinc-800 text-zinc-100 select-none w-[220px] transition-all duration-200 ease-in-out ${
        isCollapsed ? "left-16" : "left-60"
      }`}
    >
      {/* 1. Encabezado de la Sub-sidebar */}
      <div className="h-16 px-4 border-b border-zinc-800 flex flex-col justify-center shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
          Sección
        </span>
        <h2 className="text-sm font-bold text-zinc-100 truncate">
          {activeGroup.label}
        </h2>
      </div>

      {/* 2. Lista de Subsecciones */}
      <nav
        aria-label={`Navegación secundaria de ${activeGroup.label}`}
        className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto scrollbar-none"
      >
        {activeGroup.subItems.map((sub) => {
          const SubIcon = sub.icon;
          const isActive = isSubNavItemActive(
            pathname,
            searchParamsString,
            sub
          );

          return (
            <Link prefetch={false}
              key={sub.href}
              href={sub.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                isActive
                  ? "bg-amber-300 text-zinc-950 font-bold shadow-xs admin-nav-active"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80"
              }`}
            >
              <SubIcon size={15} aria-hidden="true" className="shrink-0" />
              <div className="min-w-0">
                <span className="truncate block leading-tight">{sub.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

