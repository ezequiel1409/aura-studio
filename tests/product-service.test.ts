import { beforeEach, describe, expect, it } from "vitest";
import { createTestEnvironment } from "./setup-db";
import {
  changeProductStatus,
  createProduct,
  listProducts,
} from "../src/services/product.service";
import { InvalidStatusTransitionError } from "../src/domain/errors";
import { formatProductCode } from "../src/domain/product/rules";

describe("Product Service & Core Data Flow", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  describe("createProduct (BR-01, BR-05, BR-19, BR-28, BR-39)", () => {
    it("genera códigos correlativos atómicos únicos (#001, #002) y no los reutiliza tras borrar (BR-01)", async () => {
      const p1 = await createProduct(
        {
          rawText: "Remera Negra Lisa $12.000 Talle S",
        },
        env.deps
      );

      const p2 = await createProduct(
        {
          rawText: "Top Blanco $9.500 Talle M",
        },
        env.deps
      );

      expect(p1.code).toBe(1);
      expect(formatProductCode(p1.code)).toBe("#001");

      expect(p2.code).toBe(2);
      expect(formatProductCode(p2.code)).toBe("#002");

      // Si se elimina el producto 2, el siguiente código NUNCA se reutiliza
      await env.deps.productRepo.delete(p2.id);

      const p3 = await createProduct(
        {
          rawText: "Buzo Gris $22.000 Talle L",
        },
        env.deps
      );

      expect(p3.code).toBe(3);
      expect(formatProductCode(p3.code)).toBe("#003");
    });

    it("preserva el texto crudo original y asigna 'Sin clasificar' por defecto (BR-05, BR-19)", async () => {
      const raw = "Texto libre sin categoría evidente ni estructura";
      const product = await createProduct({ rawText: raw }, env.deps);

      expect(product.rawText).toBe(raw);
      expect(product.status).toBe("AVAILABLE");

      // Categoría por defecto es "Sin clasificar"
      const category = await env.deps.categoryRepo.findById(product.categoryId);
      expect(category?.slug).toBe("sin-clasificar");
      expect(category?.isSystem).toBe(true);

      // Métricas iniciales 1:1 inicializadas (BR-39)
      const fetched = await env.deps.productRepo.findById(product.id);
      expect(fetched?.stats?.viewsCount).toBe(0);
      expect(fetched?.stats?.whatsappClicks).toBe(0);

      // Auditoría en status_history registrada (BR-28)
      const history = await env.deps.statusHistoryRepo.listByProductId(product.id);
      expect(history.length).toBe(1);
      expect(history[0].fromStatus).toBeNull();
      expect(history[0].toStatus).toBe("AVAILABLE");
    });

    it("asocia fotos y extrae campos propuestos por el parser", async () => {
      const raw = `Jean Mom Rígido Celeste
Talle: 38
Precio: $ 34.000`;

      const product = await createProduct(
        {
          rawText: raw,
          photos: [
            { keyThumb: "r2/thumb-1.webp", keyFull: "r2/full-1.webp" },
            { keyThumb: "r2/thumb-2.webp", keyFull: "r2/full-2.webp" },
          ],
        },
        env.deps
      );

      expect(product.title).toBe("Jean Mom Rígido Celeste");
      expect(product.priceCents).toBe(3400000);
      expect(product.size).toBe("38");
      expect(product.photos?.length).toBe(2);
      expect(product.photos?.[0].keyThumb).toBe("r2/thumb-1.webp");
    });
  });

  describe("changeProductStatus (BR-02, BR-03, BR-28)", () => {
    it("permite transiciones válidas, registra sold_out_at y limpia al reactivar (BR-03)", async () => {
      const product = await createProduct(
        { rawText: "Blazer Lino $45.000 Talle Único" },
        env.deps
      );

      // Disponible -> Reservada
      const reserved = await changeProductStatus(
        { productId: product.id, newStatus: "RESERVED" },
        env.deps
      );
      expect(reserved.status).toBe("RESERVED");
      expect(reserved.reservedUntil).not.toBeNull();

      // Reservada -> Agotada (BR-03: fija sold_out_at)
      const soldOut = await changeProductStatus(
        { productId: product.id, newStatus: "SOLD_OUT" },
        env.deps
      );
      expect(soldOut.status).toBe("SOLD_OUT");
      expect(soldOut.soldOutAt).not.toBeNull();
      expect(soldOut.reservedUntil).toBeNull();

      // Agotada -> Disponible (reactivación, limpia sold_out_at)
      const reactivated = await changeProductStatus(
        { productId: product.id, newStatus: "AVAILABLE" },
        env.deps
      );
      expect(reactivated.status).toBe("AVAILABLE");
      expect(reactivated.soldOutAt).toBeNull();

      // Historial completo registrado (BR-28)
      const history = await env.deps.statusHistoryRepo.listByProductId(product.id);
      expect(history.length).toBe(4); // Inicial + 3 transiciones
    });

    it("rechaza transiciones inválidas como SOLD_OUT -> RESERVED (BR-02)", async () => {
      const product = await createProduct(
        { rawText: "Campera Ecocuero $60.000" },
        env.deps
      );

      await changeProductStatus(
        { productId: product.id, newStatus: "SOLD_OUT" },
        env.deps
      );

      await expect(
        changeProductStatus(
          { productId: product.id, newStatus: "RESERVED" },
          env.deps
        )
      ).rejects.toThrow(InvalidStatusTransitionError);
    });
  });

  describe("listProducts (BR-16, BR-21, BR-23, BR-24)", () => {
    it("al filtrar por categoría padre incluye automáticamente las subcategorías (BR-16)", async () => {
      const garmentsRoot = await env.deps.categoryRepo.findBySlug("prendas");
      const remerasSub = await env.deps.categoryRepo.findBySlug("remeras-y-tops");
      const jeansSub = await env.deps.categoryRepo.findBySlug("jeans");
      const calzadoRoot = await env.deps.categoryRepo.findBySlug("calzado");

      expect(garmentsRoot).toBeDefined();
      expect(remerasSub).toBeDefined();

      // Crear productos en distintas categorías
      await createProduct(
        { rawText: "Remera estampada $10.000", categoryId: remerasSub!.id },
        env.deps
      );
      await createProduct(
        { rawText: "Jean baggy $30.000", categoryId: jeansSub!.id },
        env.deps
      );
      await createProduct(
        { rawText: "Zapatillas urbanas $50.000", categoryId: calzadoRoot!.id },
        env.deps
      );

      // Filtrar por 'Prendas' (padre) debe traer la remera y el jean, pero no las zapatillas
      const result = await listProducts({ categoryId: garmentsRoot!.id }, env.deps);

      expect(result.total).toBe(2);
      expect(result.items.some((p) => p.title?.includes("Remera"))).toBe(true);
      expect(result.items.some((p) => p.title?.includes("Jean"))).toBe(true);
      expect(result.items.some((p) => p.title?.includes("Zapatillas"))).toBe(false);
    });

    it("ordena disponibles antes que agotadas y coloca sin precio al final (BR-21, BR-23)", async () => {
      // P1: Disponible, con precio 20.000
      const p1 = await createProduct({ rawText: "P1 $20.000" }, env.deps);
      // P2: Disponible, sin precio
      const p2 = await createProduct({ rawText: "P2 sin precio" }, env.deps);
      // P3: Disponible, con precio 10.000
      const p3 = await createProduct({ rawText: "P3 $10.000" }, env.deps);
      // P4: Agotada, con precio 5.000
      const p4 = await createProduct({ rawText: "P4 $5.000" }, env.deps);
      await changeProductStatus({ productId: p4.id, newStatus: "SOLD_OUT" }, env.deps);

      // Ordenar por precio menor a mayor (price_asc)
      const result = await listProducts({ sortBy: "price_asc" }, env.deps);

      const codes = result.items.map((i) => i.code);

      // 1. Disponibles primero: p3 (10k), p1 (20k), luego p2 (sin precio al final de disponibles BR-23)
      // 2. Agotadas después: p4 (aunque su precio sea 5k, las agotadas van después de disponibles BR-21)
      expect(codes[0]).toBe(p3.code); // 10.000
      expect(codes[1]).toBe(p1.code); // 20.000
      expect(codes[2]).toBe(p2.code); // sin precio al final de disponibles
      expect(codes[3]).toBe(p4.code); // agotada va al final
    });

    it("busca exactamente por código numérico (#001 o 1) según BR-24", async () => {
      const p1 = await createProduct({ rawText: "Producto Uno $10.000" }, env.deps);
      const p2 = await createProduct({ rawText: "Producto Dos $15.000" }, env.deps);

      const searchByHash = await listProducts({ search: `#00${p1.code}` }, env.deps);
      expect(searchByHash.total).toBe(1);
      expect(searchByHash.items[0].id).toBe(p1.id);

      const searchByNumber = await listProducts({ search: `${p2.code}` }, env.deps);
      expect(searchByNumber.total).toBe(1);
      expect(searchByNumber.items[0].id).toBe(p2.id);
    });
  });
});

