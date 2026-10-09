import { beforeEach, describe, expect, it } from "vitest";
import { createTestEnvironment } from "./setup-db";
import {
  bulkSetProductFeatured,
  createProduct,
  listProducts,
  toggleProductFeatured,
  updateProduct,
} from "../src/services/product.service";

describe("Prendas Destacadas y Foto de Portada (Catálogo & Backoffice)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  describe("Creación y Actualización de Prenda con isFeatured", () => {
    it("crea un producto con isFeatured = true y lo persiste en la base de datos", async () => {
      const product = await createProduct(
        {
          rawText: "Vestido Gala Seda $45.000 Talle M",
          title: "Vestido Gala Seda",
          priceCents: 4500000,
          isFeatured: true,
          photos: [
            {
              keyThumb: "/uploads/thumb-1.webp",
              keyFull: "/uploads/full-1.webp",
              position: 0,
            },
            {
              keyThumb: "/uploads/thumb-2.webp",
              keyFull: "/uploads/full-2.webp",
              position: 1,
            },
          ],
        },
        env.deps
      );

      expect(product.isFeatured).toBe(true);

      const fetched = await env.deps.productRepo.findById(product.id);
      expect(fetched?.isFeatured).toBe(true);
      // La foto en posición 0 es la portada
      expect(fetched?.photos?.[0].keyThumb).toBe("/uploads/thumb-1.webp");
    });

    it("crea por defecto con isFeatured = false si no se especifica", async () => {
      const product = await createProduct(
        {
          rawText: "Remera Básica Blanca $10.000 Talle S",
        },
        env.deps
      );

      expect(product.isFeatured).toBe(false);

      const fetched = await env.deps.productRepo.findById(product.id);
      expect(fetched?.isFeatured).toBe(false);
    });

    it("actualiza el estado de destacado mediante updateProduct", async () => {
      const product = await createProduct(
        {
          rawText: "Campera Denim $38.000",
          isFeatured: false,
        },
        env.deps
      );

      const updated = await updateProduct(
        product.id,
        {
          isFeatured: true,
        },
        env.deps
      );

      expect(updated.isFeatured).toBe(true);

      const fetched = await env.deps.productRepo.findById(product.id);
      expect(fetched?.isFeatured).toBe(true);
    });
  });

  describe("Alternar Destacado (toggleProductFeatured & bulkSetProductFeatured)", () => {
    it("alterna el estado de destacado con un solo clic (toggleProductFeatured)", async () => {
      const product = await createProduct(
        {
          rawText: "Pantalón Sastrero $28.000",
          isFeatured: false,
        },
        env.deps
      );

      const toggledOn = await toggleProductFeatured(product.id, env.deps);
      expect(toggledOn.isFeatured).toBe(true);

      const toggledOff = await toggleProductFeatured(product.id, env.deps);
      expect(toggledOff.isFeatured).toBe(false);
    });

    it("permite destacar o desmarcar múltiples prendas en lote (bulkSetProductFeatured)", async () => {
      const p1 = await createProduct({ rawText: "Top 1 $15.000", isFeatured: false }, env.deps);
      const p2 = await createProduct({ rawText: "Top 2 $16.000", isFeatured: false }, env.deps);
      const p3 = await createProduct({ rawText: "Top 3 $17.000", isFeatured: true }, env.deps);

      // Destacar p1 y p2
      await bulkSetProductFeatured({ productIds: [p1.id, p2.id], isFeatured: true }, env.deps);

      const fetched1 = await env.deps.productRepo.findById(p1.id);
      const fetched2 = await env.deps.productRepo.findById(p2.id);
      expect(fetched1?.isFeatured).toBe(true);
      expect(fetched2?.isFeatured).toBe(true);

      // Desmarcar p1 y p3
      await bulkSetProductFeatured({ productIds: [p1.id, p3.id], isFeatured: false }, env.deps);

      const fetched1After = await env.deps.productRepo.findById(p1.id);
      const fetched3After = await env.deps.productRepo.findById(p3.id);
      expect(fetched1After?.isFeatured).toBe(false);
      expect(fetched3After?.isFeatured).toBe(false);
    });
  });

  describe("Filtrado y Ordenamiento en Catálogo (listProducts)", () => {
    it("filtra exclusivamente productos destacados cuando isFeatured = true", async () => {
      const pNormal = await createProduct({ rawText: "Prenda Común $12.000", isFeatured: false }, env.deps);
      const pDestacada = await createProduct({ rawText: "Prenda Especial $35.000", isFeatured: true }, env.deps);

      const results = await listProducts({ isFeatured: true }, env.deps);

      expect(results.items.some((p) => p.id === pDestacada.id)).toBe(true);
      expect(results.items.some((p) => p.id === pNormal.id)).toBe(false);
      expect(results.total).toBe(1);
    });

    it("prioriza las prendas destacadas al ordenar por newest en el showroom", async () => {
      // Creamos primero una destacada, luego una común
      const p1 = await createProduct({ rawText: "Prenda Antigua Destacada $20.000", isFeatured: true }, env.deps);
      const p2 = await createProduct({ rawText: "Prenda Reciente No Destacada $15.000", isFeatured: false }, env.deps);

      const results = await listProducts({ sortBy: "newest" }, env.deps);

      // p1 siendo destacada debe aparecer antes que p2 aunque p2 haya sido creada después
      const idxP1 = results.items.findIndex((p) => p.id === p1.id);
      const idxP2 = results.items.findIndex((p) => p.id === p2.id);

      expect(idxP1).toBeLessThan(idxP2);
    });
  });
});

