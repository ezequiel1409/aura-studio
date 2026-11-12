"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  ADMIN_PRIMARY_NAV_ITEMS,
  isSubNavItemActive,
} from "../header/nav-items";

interface AdminSectionShellProps {
  groupId: "catalog" | "store";
  children: ReactNode;
}

/**
 * Contenedor persistente para secciones administrativas multipestaña (Catálogo / Mi Tienda).
 * Montado en layouts anidados de Route Groups `(catalog)` y `(store)` para que las barras
 * y pestañas padre permanezcan montadas mientras únicamente cambia el `<section>` principal.
 */
export function AdminSectionShell({ groupId, children }: AdminSectionShellProps) {
  const pathname = usePathname() || "";
  const group = ADMIN_PRIMARY_NAV_ITEMS.find((item) => item.id === groupId);
  const activeSub = group?.subItems?.find((sub) => isSubNavItemActive(pathname, sub));

  const sectionLabel = group
    ? activeSub
      ? `${group.label}: ${activeSub.label}`
      : group.label
    : "Contenido de sección";

  return (
    <section
      id={`admin-section-main-${groupId}`}
      data-section-group={groupId}
      data-active-subsection={activeSub?.href ?? pathname}
      aria-label={sectionLabel}
      className="min-w-0"
    >
      {children}
    </section>
  );
}
