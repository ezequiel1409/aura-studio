import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ProductGallery } from "../src/components/catalog/ProductGallery";
import { ProductShowcaseClient } from "../src/components/catalog/ProductShowcaseClient";
import { memoryCache } from "../src/infra/cache/memory-cache";
import { Product, ProductPhoto } from "../src/domain/product/types";

describe("Galería Dinámica por Variante de Producto y LRU Cache", () => {
  describe("Sincronización de Galería y Selector de Variante", () => {
    const mockPhotos: ProductPhoto[] = [
      {
        id: 101,
        productId: 1,
        productColorId: 10, // Color Negro
        position: 0,
        keyThumb: "https://example.com/negro-thumb.jpg",
        keyFull: "https://example.com/negro-full.jpg",
        createdAt: Date.now(),
      },
      {
        id: 102,
        productId: 1,
        productColorId: 10, // Color Negro foto 2
        position: 1,
        keyThumb: "https://example.com/negro-2-thumb.jpg",
        keyFull: "https://example.com/negro-2-full.jpg",
        createdAt: Date.now(),
      },
      {
        id: 103,
        productId: 1,
        productColorId: 20, // Color Rosa
        position: 2,
        keyThumb: "https://example.com/rosa-thumb.jpg",
        keyFull: "https://example.com/rosa-full.jpg",
        createdAt: Date.now(),
      },
    ];

    it("renderiza la tira deslizante con todas las fotos disponibles", () => {
      const html = renderToString(
        React.createElement(ProductGallery, {
          photos: mockPhotos,
          title: "Top Básico Seamless",
          code: "#000101",
          selectedColorId: 10,
        })
      );

      expect(html).toContain("Top Básico Seamless - Foto 1 de 3");
      expect(html).toContain("Top Básico Seamless - Foto 3 de 3");
      expect(html).toContain("will-change-transform");
      expect(html).toContain("transition-transform duration-500");
    });

    it("ProductShowcaseClient sincroniza el estado entre la selección de color y la vista del producto", () => {
      const mockProduct: Product = {
        id: 1,
        code: 101,
        rawText: "Top Básico Seamless de alto impacto.",
        title: "Top Básico Seamless",
        priceCents: 4500000,
        currency: "ARS",
        categoryId: 1,
        status: "AVAILABLE",
        isFeatured: true,
        allowReturn: true,
        manualFields: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        soldOutAt: null,
        reservedUntil: null,
        colors: [
          {
            id: 10,
            productId: 1,
            name: "Negro",
            hexCode: "#000000",
            position: 0,
            sizes: [{ id: 1, productColorId: 10, size: "M", stock: 5, reservedStock: 0 }],
          },
          {
            id: 20,
            productId: 1,
            name: "Rosa",
            hexCode: "#ffc0cb",
            position: 1,
            sizes: [{ id: 2, productColorId: 20, size: "S", stock: 3, reservedStock: 0 }],
          },
        ],
        photos: mockPhotos,
      };

      const html = renderToString(
        React.createElement(ProductShowcaseClient, {
          product: mockProduct,
          formattedCode: "#000101",
          sizes: ["S", "M"],
          category: { id: 1, name: "Tops", slug: "tops" },
          brandName: "Mi Tienda",
          whatsappNumber: "+5491100000000",
          isReserved: false,
          isSoldOut: false,
        })
      );

      expect(html).toContain("Top Básico Seamless");
      expect(html).toContain("Negro");
      expect(html).toContain("Rosa");
      expect(html).toContain("SKU:");
      expect(html).toContain("#000101");
    });
  });

  describe("MemoryCache: Control estricto de memoria en V8 Isolates (128 MB)", () => {
    it("almacena y recupera entradas dentro de su TTL", () => {
      memoryCache.set("test_key_1", { name: "TestItem" }, 60);
      const val = memoryCache.get<{ name: string }>("test_key_1");
      expect(val).toEqual({ name: "TestItem" });
    });

    it("elimina entradas expiradas y no devuelve valores caducados", () => {
      memoryCache.set("test_expired", "expired_val", -1); // Expirado de inmediato
      const val = memoryCache.get("test_expired");
      expect(val).toBeNull();
    });

    it("respeta el límite de entradas y no causa memory leaks ilimitados", () => {
      // Insertar 150 elementos en una caché con límite de 120
      for (let i = 0; i < 150; i++) {
        memoryCache.set(`key_${i}`, `val_${i}`, 300);
      }
      // La clave 0 debe haber sido desalojada por la política LRU
      expect(memoryCache.get("key_0")).toBeNull();
      // Las claves más recientes deben mantenerse
      expect(memoryCache.get("key_149")).toBe("val_149");
    });
  });
});
