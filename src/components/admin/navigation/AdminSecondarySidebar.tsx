"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { useAdminNav } from "./AdminNavContext";
import { AdminSubNavLink } from "./AdminSubNavLink";

export const AdminSecondarySidebar = memo(function AdminSecondarySidebar() {
  const pathname = usePathname() || "";

  const { isCollapsed, activeGroup, hasSecondary } = useAdminNav();

  if (!hasSecondary || !activeGroup || !activeGroup.subItems) {
    return null;
  }

  return (
    <aside
      aria-label={`Subsecciones de ${activeGroup.label}`}
      className={`hidden lg:flex flex-col fixed inset-y-0 z-40 bg-zinc-900/95 backdrop-blur-md border-r border-zinc-800 text-zinc-100 select-none w-[220px] transition-all duration-200 ease-in-out ${
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
        {activeGroup.subItems.map((sub) => (
          <AdminSubNavLink
            key={sub.href}
            item={sub}
            pathname={pathname}
            variant="sidebar"
          />
        ))}
      </nav>
    </aside>
  );
});
