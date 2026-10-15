import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  getBackofficeSummary,
  getProductStatusHistory,
  undoProductStatusChange,
} from "../src/services/backoffice.service";
import { changeProductStatus, createProduct } from "../src/services/product.service";
import { POST as createProductHandler } from "../src/app/api/admin/products/create/route";
import { createSessionToken } from "../src/infra/auth/session";
import { getEnv } from "../src/lib/env";
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

describe("Creación de Productos en Backoffice: API, Validación de Negocio y Anti-duplicados (BR-01, BR-26)", () => {
  let env: ReturnType<typeof createTestEnvironment>;
  let validToken: string;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
    validToken = await createSessionToken(
      getEnv().SESSION_SECRET,
      { email: "admin@aurastudio.com", role: "SUPER_ADMIN" },
      7200 * 1000
    );
  });

  it("rechaza si el texto crudo está vacío con código de negocio y detalle de campos faltantes", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/products/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: "   " }),
    });
    req.cookies.set("aura_admin_token", validToken);

    const res = await createProductHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.errorType).toBe("BUSINESS");
    expect(data.errorCode).toBe("ERR_BUSINESS_MISSING_RAW_TEXT");
    expect(data.missingFields).toContain("Texto o descripción de la prenda");
    expect(data.details).toBeDefined();
  });

  it("rechaza si el precio numérico no es válido con código de negocio", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/products/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawText: "Top Seda",
        priceCents: -5000,
      }),
    });
    req.cookies.set("aura_admin_token", validToken);

    const res = await createProductHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.errorType).toBe("BUSINESS");
    expect(data.errorCode).toBe("ERR_BUSINESS_INVALID_PRICE");
    expect(data.missingFields).toContain("Precio numérico en pesos");
  });

  it("rechaza si un talle tiene stock negativo con código de negocio", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/products/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawText: "Camisa Lino",
        colors: [
          {
            name: "Blanco",
            sizes: [{ size: "M", stock: -2 }],
          },
        ],
      }),
    });
    req.cookies.set("aura_admin_token", validToken);

    const res = await createProductHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.errorType).toBe("BUSINESS");
    expect(data.errorCode).toBe("ERR_BUSINESS_INVALID_STOCK");
    expect(data.missingFields.length).toBeGreaterThan(0);
  });

  it("previene crear un producto duplicado si se reenvía el mismo clientSubmissionId", async () => {
    const submissionId = "sub_test_idempotency_123";
    const payload = {
      clientSubmissionId: submissionId,
      rawText: "Vestido Sirena $50.000 talle M",
      title: "Vestido Sirena",
      priceCents: 5000000,
    };

    // Primer intento: crea el producto
    const req1 = new NextRequest("http://localhost:3000/api/admin/products/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    req1.cookies.set("aura_admin_token", validToken);

    const res1 = await createProductHandler(req1);
    const data1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(data1.ok).toBe(true);
    const initialCode = data1.product.code;

    // Segundo intento con el MISMO clientSubmissionId (simulando doble clic o reintento)
    const req2 = new NextRequest("http://localhost:3000/api/admin/products/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    req2.cookies.set("aura_admin_token", validToken);

    const res2 = await createProductHandler(req2);
    const data2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(data2.ok).toBe(true);
    expect(data2.duplicatePrevented).toBe(true);
    expect(data2.product.code).toBe(initialCode); // Mismo producto, no se duplicó
  });
});

