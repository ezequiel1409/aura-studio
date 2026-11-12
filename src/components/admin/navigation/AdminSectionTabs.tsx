"use client";

import { memo } from "react";
import { AdminNavItem } from "../header/nav-items";
import { AdminSubNavLink } from "./AdminSubNavLink";

interface AdminSectionTabsProps {
  group: AdminNavItem;
  pathname: string;
}

/**
 * Barra de pestañas horizontales persistentes para navegar entre subsecciones
 * dentro de un mismo grupo sin desmontar los tabs ni recrear el shell.
 */
export const AdminSectionTabs = memo(function AdminSectionTabs({
  group,
  pathname,
}: AdminSectionTabsProps) {
  if (!group.subItems || group.subItems.length === 0) {
    return null;
  }

  return (
    <>
      <span className="block text-[10px] uppercase font-bold tracking-wider text-amber-300 mb-1.5">
        {group.label}
      </span>
      <nav
        aria-label={`Subsecciones de ${group.label}`}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1"
      >
        {group.subItems.map((sub) => (
          <AdminSubNavLink
            key={sub.href}
            item={sub}
            pathname={pathname}
            variant="tab"
          />
        ))}
      </nav>
    </>
  );
});
