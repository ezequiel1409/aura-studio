import { beforeEach, describe, expect, it } from "vitest";
import {
  getBackofficeSummary,
  getProductStatusHistory,
  undoProductStatusChange,
} from "../src/services/backoffice.service";
import { changeProductStatus, createProduct } from "../src/services/product.service";
import { createTestEnvironment } from "./setup-db";

describe("Servicios de Backoffice: Resumen y Contadores (BR-36, BR-31)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  it("calcula contadores de disponibles, reservadas, agotadas, por vencer, sin clasificar y sin precio", async () => {
    const { deps } = env;

    // Buscar categoría "vestidos-y-enteritos" para crear prendas categorizadas
    const cat = await deps.categoryRepo.findBySlug("vestidos-y-enteritos");
    expect(cat).toBeDefined();

    // 1. Prenda Disponible con precio y categoría
    await createProduct(
      {
        rawText: "Vestido seda $45.000",
        title: "Vestido Seda",
        priceCents: 4500000,
        categoryId: cat!.id,
      },
      deps
    );

    // 2. Prenda Reservada con precio y categoría
    const pReserved = await createProduct(
      {
        rawText: "Vestido lino $35.000",
        title: "Vestido Lino",
        priceCents: 3500000,
        categoryId: cat!.id,
      },
      deps
    );
    await changeProductStatus({ productId: pReserved.id, newStatus: "RESERVED" }, deps);

    // 3. Prenda Agotada reciente (< 23 días)
    const pSoldRecent = await createProduct(
      {
        rawText: "Vestido noche $60.000",
        title: "Vestido Noche",
        priceCents: 6000000,
        categoryId: cat!.id,
      },
      deps
    );
    await changeProductStatus({ productId: pSoldRecent.id, newStatus: "SOLD_OUT" }, deps);

    // 4. Prenda Agotada antigua (hace 25 días -> por vencer, le quedan <= 7 días para purga a los 30 días, BR-31)
    const now = Date.now();
    const twentyFiveDaysAgo = now - 25 * 24 * 60 * 60 * 1000;
    const pSoldOld = await createProduct(
      {
        rawText: "Vestido vintage $25.000",
        title: "Vestido Vintage",
        priceCents: 2500000,
        categoryId: cat!.id,
      },
      deps
    );
    await changeProductStatus({ productId: pSoldOld.id, newStatus: "SOLD_OUT" }, deps);
    // Simular que fue agotada hace 25 días
    await deps.productRepo.update(pSoldOld.id, { soldOutAt: twentyFiveDaysAgo });

    // 5. Prenda sin categoría ("Sin clasificar", BR-19) y sin precio (BR-23)
    await createProduct(
      {
        rawText: "Articulo experimental liso",
        priceCents: null,
      },
      deps
    );

    // Ejecutar getBackofficeSummary
    const summary = await getBackofficeSummary(deps, now);

    expect(summary.available).toBe(2); // p1 + p5
    expect(summary.reserved).toBe(1); // pReserved
    expect(summary.soldOut).toBe(2); // pSoldRecent + pSoldOld
    expect(summary.expiringSoon).toBe(1); // pSoldOld
    expect(summary.uncategorized).toBe(1); // p5
    expect(summary.noPrice).toBe(1); // p5
  });
});

describe("Servicios de Backoffice: Cambio de Estado con Deshacer e Historial (BR-27, BR-28)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  it("permite deshacer un cambio de estado y registra la auditoria (BR-28)", async () => {
    const { deps } = env;

    // Crear prenda (estado inicial: AVAILABLE)
    const product = await createProduct(
      {
        rawText: "Camisa lino $30.000",
        title: "Camisa Lino",
        priceCents: 3000000,
      },
      deps
    );
    expect(product.status).toBe("AVAILABLE");

    // 1. Admin cambia estado a RESERVED
    const reservedProduct = await changeProductStatus(
      {
        productId: product.id,
        newStatus: "RESERVED",
        source: "web",
      },
      deps
    );
    expect(reservedProduct.status).toBe("RESERVED");

    // 2. Admin toca "Deshacer"
    const undoneProduct = await undoProductStatusChange(product.id, "web", deps);
    expect(undoneProduct.status).toBe("AVAILABLE");

    // 3. Verificar historial de auditoría
    const history = await getProductStatusHistory(product.id, deps);
    expect(history.length).toBe(3); // creación inicial + pase a RESERVED + reversión a AVAILABLE
    expect(history[0].toStatus).toBe("AVAILABLE");
    expect(history[0].fromStatus).toBe("RESERVED");
    expect(history[0].source).toBe("web");
  });

  it("deshacer un pase a SOLD_OUT limpia sold_out_at (BR-03, BR-28)", async () => {
    const { deps } = env;

    const product = await createProduct(
      {
        rawText: "Pantalón $40.000",
        title: "Pantalón",
        priceCents: 4000000,
      },
      deps
    );

    // Marcar como agotado
    const soldOutProduct = await changeProductStatus(
      {
        productId: product.id,
        newStatus: "SOLD_OUT",
        source: "web",
      },
      deps
    );
    expect(soldOutProduct.status).toBe("SOLD_OUT");
    expect(soldOutProduct.soldOutAt).not.toBeNull();

    // Deshacer el agotado
    const reverted = await undoProductStatusChange(product.id, "web", deps);
    expect(reverted.status).toBe("AVAILABLE");
    expect(reverted.soldOutAt).toBeNull();
  });
});
