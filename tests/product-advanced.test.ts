import { beforeEach, describe, expect, it } from "vitest";
import {
  bulkChangeProductStatus,
  bulkDeleteProducts,
  bulkMoveProductCategory,
  createProduct,
  deleteProduct,
  updateProduct,
} from "../src/services/product.service";
import { createCategory } from "../src/services/category.service";
import { createTestEnvironment } from "./setup-db";

describe("Edición Avanzada y Acciones en Lote de Prendas (BR-29, BR-33, BR-34)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  describe("BR-33: Edición completa sin pérdida y preservación de campos manuales", () => {
    it("al editar el texto crudo se vuelve a interpretar, pero NO se pisan los datos corregidos a mano", async () => {
      const { deps } = env;

      // Crear prenda con título manual explícito y precio inferido del texto
      const created = await createProduct(
        {
          rawText: "Vestido floreado lino $50.000 talle M",
          title: "Vestido Primavera Exclusivo", // Corregido a mano al crear
        },
        deps
      );

      expect(created.title).toBe("Vestido Primavera Exclusivo");
      expect(created.priceCents).toBe(5000000);
      expect(created.manualFields).toContain("title");

      // La administradora edita el texto crudo con un nuevo precio y nuevo texto
      const updated = await updateProduct(
        created.id,
        {
          rawText: "Vestido floreado lino importado $75.000 talle M",
        },
        deps
      );

      // El título manual se preservó intacto (BR-33)
      expect(updated.title).toBe("Vestido Primavera Exclusivo");
      // El precio que no era manual se actualizó al nuevo valor parseado (75.000)
      expect(updated.priceCents).toBe(7500000);
    });

    it("ajustar el stock total a 0 transiciona automáticamente a SOLD_OUT con sold_out_at (BR-02, BR-03)", async () => {
      const { deps } = env;

      const product = await createProduct(
        {
          rawText: "Remera algodón $20.000",
          colors: [
            {
              name: "Blanco",
              sizes: [{ size: "M", stock: 2 }],
            },
          ],
        },
        deps
      );
      expect(product.status).toBe("AVAILABLE");
      expect(product.soldOutAt).toBeNull();

      // Actualizar reduciendo stock a 0
      const updated = await updateProduct(
        product.id,
        {
          colors: [
            {
              name: "Blanco",
              sizes: [{ size: "M", stock: 0 }],
            },
          ],
        },
        deps
      );

      expect(updated.status).toBe("SOLD_OUT");
      expect(updated.soldOutAt).not.toBeNull();
    });

    it("reponer stock de una prenda SOLD_OUT reactiva automáticamente a AVAILABLE y limpia sold_out_at (BR-02, BR-03)", async () => {
      const { deps } = env;

      const product = await createProduct(
        {
          rawText: "Jean azul $60.000",
          colors: [
            {
              name: "Azul",
              sizes: [{ size: "38", stock: 0 }],
            },
          ],
        },
        deps
      );
      expect(product.status).toBe("SOLD_OUT");

      // Ingresar nuevo stock
      const updated = await updateProduct(
        product.id,
        {
          colors: [
            {
              name: "Azul",
              sizes: [{ size: "38", stock: 5 }],
            },
          ],
        },
        deps
      );

      expect(updated.status).toBe("AVAILABLE");
      expect(updated.soldOutAt).toBeNull();
    });
  });

  describe("BR-34: Eliminación manual de prenda", () => {
    it("elimina la prenda y sus variantes de base de datos", async () => {
      const { deps } = env;

      const product = await createProduct(
        {
          rawText: "Top seda $18.000",
        },
        deps
      );

      await deleteProduct(product.id, deps);

      const fetched = await deps.productRepo.findById(product.id);
      expect(fetched).toBeNull();
    });
  });

  describe("BR-29: Acciones en lote", () => {
    it("permite cambiar de estado a múltiples prendas a la vez", async () => {
      const { deps } = env;

      const p1 = await createProduct({ rawText: "Prenda 1 $10.000" }, deps);
      const p2 = await createProduct({ rawText: "Prenda 2 $20.000" }, deps);

      const result = await bulkChangeProductStatus(
        {
          productIds: [p1.id, p2.id],
          newStatus: "RESERVED",
        },
        deps
      );

      expect(result.updatedCount).toBe(2);
      expect(result.errors.length).toBe(0);

      const refetched1 = await deps.productRepo.findById(p1.id);
      const refetched2 = await deps.productRepo.findById(p2.id);

      expect(refetched1!.status).toBe("RESERVED");
      expect(refetched2!.status).toBe("RESERVED");
    });

    it("permite mover múltiples prendas a una nueva categoría en lote", async () => {
      const { deps } = env;

      const nuevaCat = await createCategory({ name: "Ropa Deportiva" }, deps);
      const p1 = await createProduct({ rawText: "Calza $25.000" }, deps);
      const p2 = await createProduct({ rawText: "Top deportivo $15.000" }, deps);

      const result = await bulkMoveProductCategory(
        {
          productIds: [p1.id, p2.id],
          targetCategoryId: nuevaCat.id,
        },
        deps
      );

      expect(result.updatedCount).toBe(2);

      const refetched1 = await deps.productRepo.findById(p1.id);
      const refetched2 = await deps.productRepo.findById(p2.id);

      expect(refetched1!.categoryId).toBe(nuevaCat.id);
      expect(refetched2!.categoryId).toBe(nuevaCat.id);
    });

    it("permite eliminar múltiples prendas en lote", async () => {
      const { deps } = env;

      const p1 = await createProduct({ rawText: "Prenda A $10.000" }, deps);
      const p2 = await createProduct({ rawText: "Prenda B $20.000" }, deps);

      const result = await bulkDeleteProducts(
        {
          productIds: [p1.id, p2.id],
        },
        deps
      );

      expect(result.deletedCount).toBe(2);

      expect(await deps.productRepo.findById(p1.id)).toBeNull();
      expect(await deps.productRepo.findById(p2.id)).toBeNull();
    });
  });
});
