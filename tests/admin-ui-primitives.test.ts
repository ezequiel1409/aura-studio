import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ModalDialog } from "../src/components/admin/ui/ModalDialog";
import { ConfirmDialog } from "../src/components/admin/ui/ConfirmDialog";
import { AdminPageHeader } from "../src/components/admin/ui/AdminPageHeader";
import { AdminFeedbackBanner } from "../src/components/admin/ui/AdminFeedbackBanner";
import { AdminSwitch } from "../src/components/admin/ui/AdminSwitch";
import { SemanticBadge } from "../src/components/admin/ui/SemanticBadge";
import { AdminSearchFilterBar } from "../src/components/admin/ui/AdminSearchFilterBar";
import { AdminPaginationBar } from "../src/components/admin/ui/AdminPaginationBar";
import { AdminRouteSkeleton } from "../src/components/admin/ui/AdminRouteSkeleton";

describe("Admin Reusable UI Primitives", () => {
  it("ModalDialog omite contenido cuando isOpen=false y renderiza atributos ARIA + size=4xl cuando está abierto", () => {
    const closedHtml = renderToString(
      React.createElement(ModalDialog, {
        isOpen: false,
        onClose: vi.fn(),
        title: "Oculto",
        children: "Body",
      })
    );
    expect(closedHtml).toBe("");

    const openHtml = renderToString(
      React.createElement(ModalDialog, {
        isOpen: true,
        onClose: vi.fn(),
        title: "Detalle de Producto",
        subtitle: "Código #015",
        size: "4xl",
        children: React.createElement("p", null, "Contenido interno del modal"),
      })
    );
    expect(openHtml).toContain('role="dialog"');
    expect(openHtml).toContain('aria-modal="true"');
    expect(openHtml).toContain("Detalle de Producto");
    expect(openHtml).toContain("Código #015");
    expect(openHtml).toContain("max-w-4xl");
    expect(openHtml).toContain("Contenido interno del modal");
  });

  it("ConfirmDialog renderiza título, mensaje y botones de confirmación/cancelación", () => {
    const html = renderToString(
      React.createElement(ConfirmDialog, {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        title: "Eliminar elemento",
        message: "Esta acción no se puede deshacer.",
        confirmLabel: "Confirmar borrado",
      })
    );

    expect(html).toContain("Eliminar elemento");
    expect(html).toContain("Esta acción no se puede deshacer.");
    expect(html).toContain("Confirmar borrado");
    expect(html).toContain("Cancelar");
  });

  it("AdminPageHeader renderiza eyebrow, título, enlace backHref y acciones", () => {
    const html = renderToString(
      React.createElement(AdminPageHeader, {
        eyebrow: "Catálogo › Categorías",
        title: "Árbol de Categorías",
        description: "Organizá los rubros visibles de la tienda.",
        backHref: "/admin/productos",
        backLabel: "Volver a productos",
        actions: React.createElement("button", { type: "button" }, "Nueva categoría"),
      })
    );

    expect(html).toContain("Catálogo › Categorías");
    expect(html).toContain("Árbol de Categorías");
    expect(html).toContain('href="/admin/productos"');
    expect(html).toContain("Volver a productos");
    expect(html).toContain("Nueva categoría");
  });

  it("AdminFeedbackBanner diferencia roles accesibles para error y éxito con botón de cierre", () => {
    const errorHtml = renderToString(
      React.createElement(AdminFeedbackBanner, {
        type: "error",
        message: "Error de validación",
        onDismiss: vi.fn(),
      })
    );
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain("Error de validación");

    const okHtml = renderToString(
      React.createElement(AdminFeedbackBanner, {
        type: "ok",
        message: "Cambios guardados",
      })
    );
    expect(okHtml).toContain('role="status"');
    expect(okHtml).toContain("Cambios guardados");
  });

  it("AdminSwitch expone role='switch' y aria-checked sincronizado", () => {
    const checkedHtml = renderToString(
      React.createElement(AdminSwitch, {
        checked: true,
        onChange: vi.fn(),
        label: "Activar notificaciones",
        description: "Envía avisos automáticos",
      })
    );
    expect(checkedHtml).toContain('role="switch"');
    expect(checkedHtml).toContain('aria-checked="true"');
    expect(checkedHtml).toContain("Activar notificaciones");
    expect(checkedHtml).toContain("Envía avisos automáticos");

    const uncheckedHtml = renderToString(
      React.createElement(AdminSwitch, {
        checked: false,
        onChange: vi.fn(),
        ariaLabel: "Interruptor rápido",
      })
    );
    expect(uncheckedHtml).toContain('aria-checked="false"');
    expect(uncheckedHtml).toContain('aria-label="Interruptor rápido"');
  });

  it("SemanticBadge y AdminSearchFilterBar renderizan variantes, buscador y controles", () => {
    const badgeHtml = renderToString(
      React.createElement(SemanticBadge, { variant: "success", children: "Acreditado" })
    );
    expect(badgeHtml).toContain("Acreditado");
    expect(badgeHtml).toContain("emerald");

    const searchHtml = renderToString(
      React.createElement(AdminSearchFilterBar, {
        searchValue: "vestido",
        onSearchChange: vi.fn(),
        searchPlaceholder: "Buscar en tabla...",
        onClearSearch: vi.fn(),
        onRefresh: vi.fn(),
      })
    );
    expect(searchHtml).toContain('placeholder="Buscar en tabla..."');
    expect(searchHtml).toContain('value="vestido"');
  });

  it("AdminPaginationBar y AdminRouteSkeleton renderizan navegación de página y skeletons por variante", () => {
    const paginationHtml = renderToString(
      React.createElement(AdminPaginationBar, {
        page: 2,
        totalPages: 5,
        totalItems: 96,
        itemLabel: "productos",
        ariaLabel: "Paginación de productos",
        onPageChange: vi.fn(),
      })
    );
    expect(paginationHtml).toContain('aria-label="Paginación de productos"');
    expect(paginationHtml).toContain("96");
    expect(paginationHtml).toContain("productos");
    expect(paginationHtml).toContain("Anterior");
    expect(paginationHtml).toContain("Siguiente");

    const listSkeletonHtml = renderToString(
      React.createElement(AdminRouteSkeleton, { variant: "list", label: "Cargando listado" })
    );
    const detailSkeletonHtml = renderToString(
      React.createElement(AdminRouteSkeleton, { variant: "detail" })
    );
    const formSkeletonHtml = renderToString(
      React.createElement(AdminRouteSkeleton, { variant: "form" })
    );

    expect(listSkeletonHtml).toContain('aria-busy="true"');
    expect(listSkeletonHtml).toContain('aria-label="Cargando listado"');
    expect(detailSkeletonHtml).toContain("lg:grid-cols-3");
    expect(formSkeletonHtml).toContain("rounded-2xl");
  });
});
