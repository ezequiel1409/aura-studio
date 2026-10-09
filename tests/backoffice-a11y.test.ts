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
        React.createElement(AdminLayout, { children: React.createElement("div", null, "Contenido") })
      );

      expect(html).toContain('href="#admin-main"');
      expect(html).toContain("Saltar al contenido principal");
    });

    it("provee landmark <main> con id='admin-main' y tabIndex={-1} para destino de foco", () => {
      const html = renderToString(
        React.createElement(AdminLayout, { children: React.createElement("div", null, "Contenido") })
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

      expect(html).toContain('aria-label="Deshacer cambio de estado en prenda #042"');
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
});
