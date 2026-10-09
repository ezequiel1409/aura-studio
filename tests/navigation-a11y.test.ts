import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import CatalogLoading from "../src/app/loading";
import ProductDetailLoading from "../src/app/p/[code]/loading";

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
});
