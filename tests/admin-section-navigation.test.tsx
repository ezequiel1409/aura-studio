import { existsSync } from "node:fs";
import path from "node:path";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AdminCatalogSectionLoading from "../src/app/admin/(catalog)/loading";
import AdminCatalogProductosLoading from "../src/app/admin/(catalog)/productos/loading";
import AdminStoreSectionLoading from "../src/app/admin/(store)/loading";
import AdminStoreTiendaLoading from "../src/app/admin/(store)/tienda/loading";
import { ADMIN_PRIMARY_NAV_ITEMS } from "../src/components/admin/header/nav-items";
import { AdminSectionShell } from "../src/components/admin/navigation/AdminSectionShell";
import { AdminSectionTabs } from "../src/components/admin/navigation/AdminSectionTabs";
import { AdminSubNavLink } from "../src/components/admin/navigation/AdminSubNavLink";
import { AdminRouteSkeleton } from "../src/components/admin/ui/AdminRouteSkeleton";

let mockedPathname = "/admin/descuentos";

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname,
}));

describe("Admin Intra-Section Persistent Navigation & Route Groups", () => {
  it("AdminSectionShell mantiene el wrapper <section> estable y solo actualiza la subsección activa entre descuentos y promociones", () => {
    mockedPathname = "/admin/descuentos";
    const descuentosHtml = renderToString(
      <AdminSectionShell groupId="catalog">
        <div data-testid="section-body">Cupones</div>
      </AdminSectionShell>
    );

    expect(descuentosHtml).toContain('id="admin-section-main-catalog"');
    expect(descuentosHtml).toContain('data-section-group="catalog"');
    expect(descuentosHtml).toContain('data-active-subsection="/admin/descuentos"');
    expect(descuentosHtml).toContain('aria-label="Productos: Cupones y Descuentos"');
    expect(descuentosHtml).toContain("Cupones");

    mockedPathname = "/admin/promociones";
    const promocionesHtml = renderToString(
      <AdminSectionShell groupId="catalog">
        <div data-testid="section-body">Bancarias</div>
      </AdminSectionShell>
    );

    expect(promocionesHtml).toContain('id="admin-section-main-catalog"');
    expect(promocionesHtml).toContain('data-section-group="catalog"');
    expect(promocionesHtml).toContain('data-active-subsection="/admin/promociones"');
    expect(promocionesHtml).toContain('aria-label="Productos: Promociones bancarias"');
    expect(promocionesHtml).toContain("Bancarias");

    mockedPathname = "/admin/usuarios";
    const storeUsersHtml = renderToString(
      <AdminSectionShell groupId="store">
        <div>Accesos</div>
      </AdminSectionShell>
    );

    expect(storeUsersHtml).toContain('id="admin-section-main-store"');
    expect(storeUsersHtml).toContain('data-section-group="store"');
    expect(storeUsersHtml).toContain('data-active-subsection="/admin/usuarios"');
  });

  it("AdminSectionTabs conserva todas las pestañas de Catálogo y cambia aria-current='page' sin duplicar activos", () => {
    const catalogGroup = ADMIN_PRIMARY_NAV_ITEMS.find((item) => item.id === "catalog");
    expect(catalogGroup?.subItems?.length).toBeGreaterThan(0);

    const htmlDescuentos = renderToString(
      <AdminSectionTabs group={catalogGroup!} pathname="/admin/descuentos" />
    );

    expect(htmlDescuentos).toContain('href="/admin/descuentos"');
    expect(htmlDescuentos).toContain('href="/admin/promociones"');
    expect(htmlDescuentos).toContain('href="/admin/categorias"');
    expect(htmlDescuentos).toContain('href="/admin/productos"');
    expect(htmlDescuentos.match(/aria-current="page"/g)).toHaveLength(1);
    expect(htmlDescuentos).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/admin\/descuentos"/);

    const htmlPromociones = renderToString(
      <AdminSectionTabs group={catalogGroup!} pathname="/admin/promociones" />
    );

    expect(htmlPromociones.match(/aria-current="page"/g)).toHaveLength(1);
    expect(htmlPromociones).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/admin\/promociones"/);
    expect(htmlPromociones).not.toMatch(/<a[^>]*aria-current="page"[^>]*href="\/admin\/descuentos"/);
  });

  it("AdminSubNavLink renderiza variantes sidebar, tab y drawer manteniendo aria-current consistente", () => {
    const catalogGroup = ADMIN_PRIMARY_NAV_ITEMS.find((item) => item.id === "catalog")!;
    const promoItem = catalogGroup.subItems!.find((sub) => sub.href === "/admin/promociones")!;

    for (const variant of ["sidebar", "tab", "drawer"] as const) {
      const activeHtml = renderToString(
        <AdminSubNavLink item={promoItem} pathname="/admin/promociones" variant={variant} />
      );
      expect(activeHtml).toContain('aria-current="page"');
      expect(activeHtml).toContain("Promociones bancarias");

      const inactiveHtml = renderToString(
        <AdminSubNavLink item={promoItem} pathname="/admin/descuentos" variant={variant} />
      );
      expect(inactiveHtml).not.toContain('aria-current="page"');
    }
  });

  it("AdminRouteSkeleton con contentOnly=true omite el bloque de cabecera y los loading de Route Groups lo usan", () => {
    for (const variant of ["cards", "list", "form"] as const) {
      const fullPageSkeleton = renderToString(
        <AdminRouteSkeleton variant={variant} contentOnly={false} />
      );
      const contentOnlySkeleton = renderToString(
        <AdminRouteSkeleton variant={variant} contentOnly />
      );

      expect(contentOnlySkeleton).toContain('aria-busy="true"');
      expect(contentOnlySkeleton.length).toBeLessThan(fullPageSkeleton.length);
    }

    const cardsOnlyHtml = renderToString(<AdminRouteSkeleton variant="cards" contentOnly />);
    expect(cardsOnlyHtml).toMatch(
      /^<div[^>]*aria-busy="true"[^>]*><div class="grid grid-cols-1 md:grid-cols-2/
    );

    expect(renderToString(<AdminCatalogSectionLoading />)).toBe(
      renderToString(
        <AdminRouteSkeleton
          contentOnly
          variant="cards"
          label="Cargando subsección de catálogo..."
        />
      )
    );
    expect(renderToString(<AdminStoreSectionLoading />)).toBe(
      renderToString(
        <AdminRouteSkeleton
          contentOnly
          variant="form"
          label="Cargando subsección de tienda..."
        />
      )
    );
    expect(renderToString(<AdminCatalogProductosLoading />)).toBe(
      renderToString(
        <AdminRouteSkeleton
          contentOnly
          variant="list"
          label="Cargando catálogo..."
        />
      )
    );
    expect(renderToString(<AdminStoreTiendaLoading />)).toBe(
      renderToString(
        <AdminRouteSkeleton
          contentOnly
          variant="form"
          label="Cargando configuración de la tienda..."
        />
      )
    );
  });

  it("Route Groups (catalog) y (store) existen y los directorios planos heredados fueron eliminados", () => {
    const adminRoot = path.resolve(process.cwd(), "src/app/admin");

    expect(existsSync(path.join(adminRoot, "(catalog)/layout.tsx"))).toBe(true);
    expect(existsSync(path.join(adminRoot, "(catalog)/loading.tsx"))).toBe(true);
    expect(existsSync(path.join(adminRoot, "(catalog)/descuentos/page.tsx"))).toBe(true);
    expect(existsSync(path.join(adminRoot, "(catalog)/promociones/page.tsx"))).toBe(true);
    expect(existsSync(path.join(adminRoot, "(catalog)/categorias/page.tsx"))).toBe(true);
    expect(existsSync(path.join(adminRoot, "(catalog)/productos/page.tsx"))).toBe(true);

    expect(existsSync(path.join(adminRoot, "(store)/layout.tsx"))).toBe(true);
    expect(existsSync(path.join(adminRoot, "(store)/loading.tsx"))).toBe(true);
    expect(existsSync(path.join(adminRoot, "(store)/usuarios/page.tsx"))).toBe(true);
    expect(existsSync(path.join(adminRoot, "(store)/tienda/negocio/page.tsx"))).toBe(true);

    for (const legacyDir of [
      "categorias",
      "descuentos",
      "promociones",
      "productos",
      "tienda",
      "usuarios",
    ]) {
      expect(existsSync(path.join(adminRoot, legacyDir))).toBe(false);
    }
  });
});
