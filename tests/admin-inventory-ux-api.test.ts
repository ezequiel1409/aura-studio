import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createProduct } from "../src/services/product.service";
import { GET as listAdminProductsHandler } from "../src/app/api/admin/products/route";
import { PATCH as patchProductStockHandler } from "../src/app/api/admin/products/[id]/stock/route";
import { GET as listAdminOrdersHandler } from "../src/app/api/admin/orders/route";
import { ADMIN_SESSION_COOKIE_NAME } from "../src/infra/auth/guard";
import { createSessionToken } from "../src/infra/auth/session";
import { setGlobalAppDepsForTesting } from "../src/infra/db/connection";
import { getEnv } from "../src/lib/env";
import { createTestEnvironment } from "./setup-db";

describe("Admin Inventory & Orders API Overhaul", () => {
  let env: ReturnType<typeof createTestEnvironment>;
  let validToken: string;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
    setGlobalAppDepsForTesting(env.deps);

    validToken = await createSessionToken(
      getEnv().SESSION_SECRET,
      { email: "admin@example.com", role: "SUPER_ADMIN" },
      7200 * 1000
    );
  });

  afterEach(() => {
    setGlobalAppDepsForTesting(null);
  });

  it("GET /api/admin/products rechaza solicitudes sin sesión admin (401)", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/products?page=1&pageSize=2");
    const res = await listAdminProductsHandler(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/products soporta paginación real y filtro stock_bajo (<= 3 u.)", async () => {
    const { deps } = env;
    const cat = await deps.categoryRepo.findBySlug("vestidos-y-enteritos");
    expect(cat).toBeDefined();

    await createProduct(
      {
        rawText: "Vestido Stock Alto $35000",
        title: "Vestido Stock Alto",
        priceCents: 3500000,
        categoryId: cat!.id,
        colors: [{ name: "Negro", sizes: [{ size: "M", stock: 10 }] }],
      },
      deps
    );

    await createProduct(
      {
        rawText: "Blusa Stock Bajo $25000",
        title: "Blusa Stock Bajo",
        priceCents: 2500000,
        categoryId: cat!.id,
        colors: [{ name: "Blanco", sizes: [{ size: "S", stock: 2 }] }],
      },
      deps
    );

    await createProduct(
      {
        rawText: "Pollera Agotada $19000",
        title: "Pollera Agotada",
        priceCents: 1900000,
        categoryId: cat!.id,
        colors: [{ name: "Beige", sizes: [{ size: "M", stock: 0 }] }],
      },
      deps
    );

    // Página 1 con pageSize=2
    const page1Req = new NextRequest(
      "http://localhost:3000/api/admin/products?page=1&pageSize=2&tab=todas"
    );
    page1Req.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
    const page1Res = await listAdminProductsHandler(page1Req);
    expect(page1Res.status).toBe(200);
    const page1Data = await page1Res.json();
    expect(page1Data.ok).toBe(true);
    expect(page1Data.total).toBe(3);
    expect(page1Data.totalPages).toBe(2);
    expect(page1Data.items).toHaveLength(2);

    // Página 2 con pageSize=2
    const page2Req = new NextRequest(
      "http://localhost:3000/api/admin/products?page=2&pageSize=2&tab=todas"
    );
    page2Req.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
    const page2Res = await listAdminProductsHandler(page2Req);
    const page2Data = await page2Res.json();
    expect(page2Res.status).toBe(200);
    expect(page2Data.items).toHaveLength(1);

    // Filtro tab=stock_bajo solo devuelve prendas entre 1 y 3 unidades totales
    const lowStockReq = new NextRequest(
      "http://localhost:3000/api/admin/products?page=1&pageSize=20&tab=stock_bajo"
    );
    lowStockReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
    const lowStockRes = await listAdminProductsHandler(lowStockReq);
    const lowStockData = await lowStockRes.json();
    expect(lowStockRes.status).toBe(200);
    expect(lowStockData.total).toBe(1);
    expect(lowStockData.items[0].title).toBe("Blusa Stock Bajo");
  });

  it("PATCH /api/admin/products/[id]/stock actualiza variantes sin recrear color IDs y deriva estado", async () => {
    const { deps } = env;
    const cat = await deps.categoryRepo.findBySlug("vestidos-y-enteritos");

    const created = await createProduct(
      {
        rawText: "Camisa Lino $30000",
        title: "Camisa Lino",
        priceCents: 3000000,
        categoryId: cat!.id,
        colors: [
          {
            name: "Crudo",
            hexCode: "#f5f5dc",
            sizes: [
              { size: "S", stock: 2 },
              { size: "M", stock: 3 },
            ],
          },
        ],
      },
      deps
    );

    const originalColorId = created.colors?.[0]?.id;
    expect(originalColorId).toBeTruthy();

    // Rechaza stock negativo (400)
    const badReq = new NextRequest(
      `http://localhost:3000/api/admin/products/${created.id}/stock`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ colorName: "Crudo", size: "S", stock: -1 }],
        }),
      }
    );
    badReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
    const badRes = await patchProductStockHandler(badReq, {
      params: Promise.resolve({ id: String(created.id) }),
    });
    expect(badRes.status).toBe(400);

    // Llevar todas las variantes a 0 -> pasa automáticamente a SOLD_OUT preservando color ID
    const zeroReq = new NextRequest(
      `http://localhost:3000/api/admin/products/${created.id}/stock`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            { colorName: "Crudo", size: "S", stock: 0 },
            { colorName: "Crudo", size: "M", stock: 0 },
          ],
        }),
      }
    );
    zeroReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
    const zeroRes = await patchProductStockHandler(zeroReq, {
      params: Promise.resolve({ id: String(created.id) }),
    });
    expect(zeroRes.status).toBe(200);
    const zeroData = await zeroRes.json();
    expect(zeroData.ok).toBe(true);
    expect(zeroData.product.status).toBe("SOLD_OUT");
    expect(zeroData.product.colors[0].id).toBe(originalColorId);

    // Reponer stock > 0 -> reactiva automáticamente a AVAILABLE
    const restockReq = new NextRequest(
      `http://localhost:3000/api/admin/products/${created.id}/stock`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ colorName: "Crudo", size: "M", stock: 5 }],
        }),
      }
    );
    restockReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
    const restockRes = await patchProductStockHandler(restockReq, {
      params: Promise.resolve({ id: String(created.id) }),
    });
    expect(restockRes.status).toBe(200);
    const restockData = await restockRes.json();
    expect(restockData.product.status).toBe("AVAILABLE");
    expect(restockData.product.colors[0].sizes.find((s: { size: string }) => s.size === "M").stock).toBe(5);
  });

  it("GET /api/admin/orders soporta offset y reporta total + hasMore", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/orders?limit=25&offset=0");
    req.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
    const res = await listAdminOrdersHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.orders)).toBe(true);
    expect(typeof data.total).toBe("number");
    expect(typeof data.hasMore).toBe("boolean");
  });
});
