import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import AdminLayout from "../src/app/admin/layout";
import { AdminHeader } from "../src/components/admin/AdminHeader";
import { UndoToast } from "../src/components/admin/UndoToast";
import { StatusHistoryModal } from "../src/components/admin/StatusHistoryModal";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Backoffice Accessibility & Inclusive UX (WCAG 2.1 AA)", () => {
  describe("AdminLayout (Landmarks & Skip Link)", () => {
    it("incluye enlace de salto al contenido principal para navegación con teclado (Skip Link)", () => {
      const html = renderToString(
        React.createElement(AdminLayout, null, React.createElement("div", null, "Contenido"))
      );

      expect(html).toContain('href="#admin-main"');
      expect(html).toContain("Saltar al contenido principal");
    });

    it("provee landmark <main> con id='admin-main' y tabIndex={-1} para destino de foco", () => {
      const html = renderToString(
        React.createElement(AdminLayout, null, React.createElement("div", null, "Contenido"))
      );

      expect(html).toContain('<main id="admin-main" tabindex="-1"');
      expect(html).toContain("Contenido");
    });
  });

  describe("AdminHeader (Navigation Landmark & Accessible Labels)", () => {
    it("etiqueta semánticamente los landmarks de navegación de escritorio y móvil", () => {
      const html = renderToString(React.createElement(AdminHeader));

      expect(html).toContain('aria-label="Navegación principal de administración"');
      expect(html).toContain('aria-label="Navegación móvil de administración"');
    });

    it("comunica la página activa a lectores de pantalla mediante aria-current='page'", () => {
      const html = renderToString(React.createElement(AdminHeader));

      expect(html).toContain('aria-current="page"');
      expect(html).toContain("Resumen");
    });

    it("asigna aria-labels amigables a los botones con solo ícono (Tienda y Cerrar Sesión)", () => {
      const html = renderToString(React.createElement(AdminHeader));

      expect(html).toContain('aria-label="Abrir catálogo público de la tienda en una pestaña nueva"');
      expect(html).toContain('aria-label="Cerrar sesión de administración"');
    });

    it("cuenta con anillos de foco visible de alto contraste (focus-visible)", () => {
      const html = renderToString(React.createElement(AdminHeader));

      expect(html).toContain("focus-visible:ring-2");
      expect(html).toContain("focus-visible:ring-amber-400");
    });

    it("incluye botón accesible de alternancia de tema claro/oscuro (AdminThemeToggle)", () => {
      const html = renderToString(React.createElement(AdminHeader));

      expect(html).toContain('aria-label="Cambiar a modo oscuro accesible"');
      expect(html).toContain("Oscuro");
    });

    it("cuenta con menú de navegación colapsable/desplegable para móviles con aria-controls y aria-expanded", () => {
      const html = renderToString(React.createElement(AdminHeader));

      expect(html).toContain('aria-controls="admin-collapsible-nav"');
      expect(html).toContain('aria-label="Abrir menú de navegación"');
      expect(html).toContain('id="admin-collapsible-nav"');
    });

    it("incluye botón de cuenta de usuario estilo Google con avatar y aria-haspopup='dialog'", () => {
      const html = renderToString(React.createElement(AdminHeader));

      expect(html).toContain('id="admin-user-menu-button"');
      expect(html).toContain('aria-haspopup="dialog"');
    });
  });

  describe("UndoToast (Live Regions & Friendly Progress Bar)", () => {
    const mockAction = {
      id: "act-1",
      productId: 101,
      productCode: 42,
      fromStatus: "AVAILABLE",
      toStatus: "RESERVED",
      message: "Prenda #042 marcada como Reservada.",
    };

    it("anuncia cambios con role='status', aria-live='polite' y aria-atomic='true'", () => {
      const html = renderToString(
        React.createElement(UndoToast, {
          action: mockAction,
          onUndo: vi.fn(),
          onDismiss: vi.fn(),
        })
      );

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('aria-atomic="true"');
      expect(html).toContain("Prenda #042 marcada como Reservada.");
    });

    it("incluye barra de progreso accesible con role='progressbar'", () => {
      const html = renderToString(
        React.createElement(UndoToast, {
          action: mockAction,
          onUndo: vi.fn(),
          onDismiss: vi.fn(),
        })
      );

      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuemin="0"');
      expect(html).toContain('aria-valuemax="100"');
      expect(html).toContain('aria-label="Tiempo restante para revertir el cambio"');
    });

    it("proporciona nombres accesibles a los botones de deshacer y descartar", () => {
      const html = renderToString(
        React.createElement(UndoToast, {
          action: mockAction,
          onUndo: vi.fn(),
          onDismiss: vi.fn(),
        })
      );

      expect(html).toContain('aria-label="Deshacer cambio de estado en producto #042"');
      expect(html).toContain('aria-label="Cerrar notificación de deshacer"');
    });
  });

  describe("StatusHistoryModal (Accessible Modal Dialog)", () => {
    it("renderiza semántica de diálogo modal accesible (role='dialog', aria-modal='true', aria-labelledby)", () => {
      const html = renderToString(
        React.createElement(StatusHistoryModal, {
          productId: 12,
          productCode: 3,
          productTitle: "Blusa Seda",
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="status-history-title"');
      expect(html).toContain('id="status-history-title"');
    });

    it("proporciona botón de cerrar con aria-label claro", () => {
      const html = renderToString(
        React.createElement(StatusHistoryModal, {
          productId: 12,
          productCode: 3,
          productTitle: "Blusa Seda",
          onClose: vi.fn(),
        })
      );

      expect(html).toContain('aria-label="Cerrar historial de estados"');
    });
  });

  describe("AdminLoginPage (Storefront Return Link & Branding)", () => {
    it("incluye enlace accesible para volver a la tienda pública", async () => {
      const { default: AdminLoginPage } = await import("../src/app/admin/login/page");
      const html = renderToString(React.createElement(AdminLoginPage));

      expect(html).toContain('href="/"');
      expect(html).toContain("Volver a la tienda");
    });

    it("renderiza nombre de tienda, tipo de tienda dinámicos y único enlace sin flecha de retroceso", async () => {
      const { default: AdminLoginPage } = await import("../src/app/admin/login/page");
      const html = renderToString(
        React.createElement(
          AdminLoginPage as React.ComponentType<{
            initialBrandName?: string;
            initialStoreType?: string;
          }>,
          {
            initialBrandName: "Boutique Elegance",
            initialStoreType: "Boutique",
          }
        )
      );

      expect(html).toContain("Boutique Elegance");
      expect(html).toContain("Boutique");
      expect(html).toContain("Panel de Administración");
      // Se quitó el enlace superior, debe haber solo 1 ocurrencia de "Volver a la tienda"
      const matches = html.match(/Volver a la tienda/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe("Light Mode Color Contrast & Settings Accessibility (WCAG AA/AAA)", () => {
    it("garantiza que globals.css define contrastes WCAG AAA para acentos ámbar y variantes de fondo en modo claro", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const cssContent = fs.readFileSync(path.resolve(__dirname, "../src/app/globals.css"), "utf-8");

      // Reglas de modo claro para texto y bordes ámbar
      expect(cssContent).toContain('#admin-layout-root[data-theme="light"] .text-amber-400');
      expect(cssContent).toContain("#92400e"); // Amber-800 (>7:1 WCAG AAA)
      expect(cssContent).toContain('#admin-layout-root[data-theme="light"] .border-amber-400');
      expect(cssContent).toContain("#b45309"); // Amber-700 (>3:1 WCAG AA UI)
      expect(cssContent).toContain('#admin-layout-root[data-theme="light"] .bg-amber-950\\/20');
      expect(cssContent).toContain("#fef3c7"); // Amber-100

      // Reglas para opacidades de zinc-950 en tarjetas de settings
      expect(cssContent).toContain('#admin-layout-root[data-theme="light"] .bg-zinc-950\\/80');
      expect(cssContent).toContain('#admin-layout-root[data-theme="light"] .bg-zinc-950\\/60');
    });

    it("SettingsClient renderiza la vista previa de acento con color de texto accesible y roles correctos", async () => {
      const { SettingsClient } = await import("../src/components/admin/SettingsClient");
      const mockSettings = {
        whatsappNumber: "+5491112345678",
        showroomName: "Aura Test",
        logoUrl: "",
        heroMode: "featured_carousel" as const,
        themePalette: "lino",
        themePrimaryColor: "#926a3c",
      };

      const html = renderToString(React.createElement(SettingsClient, { initialSettings: mockSettings }));
      expect(html).toContain("Vista previa de acento:");
      expect(html).toContain("Aura Studio");
      expect(html).toContain('id="primaryColorPicker"');
      expect(html).toContain('id="rgbRInput"');
    });
  });

  describe("ProductListClient (Hierarchical & Collapsible Catalog UX)", () => {
    it("renderiza catálogo jerarquizado por grupos colapsables con roles accesibles aria-expanded", async () => {
      const { ProductListClient } = await import("../src/components/admin/ProductListClient");

      const mockCategories = [
        { id: 1, name: "Vestidos", slug: "vestidos", position: 1, parentId: null, isHidden: false, isSystem: false },
        { id: 2, name: "Remeras", slug: "remeras", position: 2, parentId: null, isHidden: false, isSystem: false },
      ];

      const mockProducts = [
        {
          id: 10,
          code: 23,
          title: "Vestido Lino Siena",
          categoryId: 1,
          status: "AVAILABLE" as const,
          priceCents: 1850000,
          currency: "ARS",
          rawText: "Vestido lino siena",
          isFeatured: true,
          soldOutAt: null,
          photos: [],
          colors: [
            {
              id: 1,
              productId: 10,
              name: "Natural",
              position: 1,
              sizes: [{ id: 1, productColorId: 1, size: "M", stock: 3, reservedStock: 0 }],
            },
          ],
        },
        {
          id: 11,
          code: 24,
          title: "Remera Algodón Pima",
          categoryId: 2,
          status: "SOLD_OUT" as const,
          priceCents: 950000,
          currency: "ARS",
          rawText: "Remera algodon",
          isFeatured: false,
          soldOutAt: Date.now() - 1000,
          photos: [],
          colors: [],
        },
      ];

      const html = renderToString(
        React.createElement(ProductListClient, {
          initialProducts: mockProducts as any,
          categories: mockCategories as any,
        })
      );

      // Jerarquía por categoría presente
      expect(html).toContain("Vestidos");
      expect(html).toContain("Remeras");
      expect(html).toContain("Agrupar por:");
      expect(html).toContain("Categorías");

      // Acordeones con aria-expanded
      expect(html).toContain('aria-expanded="true"');
      expect(html).toContain("aria-controls");

      // Menú accesible de opciones de producto
      expect(html).toContain('aria-haspopup="true"');

      // Título completo visible sin ahogarse
      expect(html).toContain("Vestido Lino Siena");
      expect(html).toContain("Remera Algodón Pima");
    });
  });
});
