import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import CatalogLoading from "../src/app/loading";
import ProductDetailLoading from "../src/app/p/[code]/loading";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe("Instant Navigation & Accessibility (AR-11, BR-09, BR-24)", () => {
  describe("CatalogLoading Component", () => {
    it("renderiza atributos de accesibilidad WCAG requeridos (role=status, aria-live=polite, aria-busy=true)", () => {
      const html = renderToString(CatalogLoading());

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain("Cargando catálogo completo de Aura Studio");
    });

    it("incluye spinner y mensaje visual con estética editorial", () => {
      const html = renderToString(CatalogLoading());

      expect(html).toContain("Cargando piezas del catálogo...");
      expect(html).toContain("animate-spin");
    });
  });

  describe("ProductDetailLoading Component", () => {
    it("renderiza atributos de accesibilidad WCAG requeridos", () => {
      const html = renderToString(ProductDetailLoading());

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain("Cargando detalles de la pieza seleccionada");
    });

    it("proporciona enlace de retorno al catálogo principal para navegación accesible", () => {
      const html = renderToString(ProductDetailLoading());

      expect(html).toContain('href="/"');
      expect(html).toContain("Volver al catálogo");
      expect(html).toContain("Cargando pieza...");
    });

    it("muestra placeholder con spinner central para la galería", () => {
      const html = renderToString(ProductDetailLoading());

      expect(html).toContain("Aura Studio");
      expect(html).toContain("animate-spin");
    });
  });

  describe("CategoryNav Hierarchical Component (BR-15, BR-16, BR-38)", () => {
    const mockCategories = [
      { id: 1, parentId: null, name: "Sin clasificar", slug: "sin-clasificar", position: 999, isHidden: false, isSystem: true },
      { id: 2, parentId: null, name: "Prendas", slug: "prendas", position: 1, isHidden: false, isSystem: false },
      { id: 3, parentId: 2, name: "Remeras", slug: "remeras", position: 1, isHidden: false, isSystem: false },
      { id: 4, parentId: 2, name: "Pantalones", slug: "pantalones", position: 2, isHidden: false, isSystem: false },
      { id: 5, parentId: null, name: "Calzado", slug: "calzado", position: 2, isHidden: false, isSystem: false },
    ];

    it("renderiza solo categorías raíz en el nivel 1 cuando no hay filtro seleccionado", async () => {
      const { CategoryNav } = await import("../src/components/catalog/CategoryNav");
      const html = renderToString(React.createElement(CategoryNav, { categories: mockCategories }));

      // Nivel 1 contiene Todo, Prendas y Calzado
      expect(html).toContain("Todo");
      expect(html).toContain("Prendas");
      expect(html).toContain("Calzado");
      // "Sin clasificar" debe estar excluida (BR-38)
      expect(html).not.toContain("Sin clasificar");
      // En nivel 1 sin categoría activa, no debe renderizarse el nivel 2
      expect(html).not.toContain("Subcategorías de Prendas");
      expect(html).not.toContain("Remeras");
    });

    it("despliega subcategorías de nivel 2 con opción 'Todas' al seleccionar categoría padre", async () => {
      const { CategoryNav } = await import("../src/components/catalog/CategoryNav");
      const html = renderToString(React.createElement(CategoryNav, { categories: mockCategories, activeSlug: "prendas" }));

      // Nivel 1
      expect(html).toContain("Prendas");
      // Nivel 2 contextual
      expect(html).toContain('aria-label="Subcategorías de Prendas"');
      expect(html).toContain("Todas");
      expect(html).toContain("Remeras");
      expect(html).toContain("Pantalones");
    });

    it("marca la categoría padre en nivel 1 y la subcategoría en nivel 2 al seleccionar una hija", async () => {
      const { CategoryNav } = await import("../src/components/catalog/CategoryNav");
      const html = renderToString(React.createElement(CategoryNav, { categories: mockCategories, activeSlug: "pantalones" }));

      expect(html).toContain('aria-label="Subcategorías de Prendas"');
      expect(html).toContain("Pantalones");
      expect(html).toContain('href="/?categoria=pantalones"');
      expect(html).toContain('href="/?categoria=prendas"');
    });
  });
});
