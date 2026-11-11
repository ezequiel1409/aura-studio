import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createProduct } from "../src/services/product.service";
import { PUT as updateProductHandler } from "../src/app/api/admin/products/[id]/route";
import { createSessionToken } from "../src/infra/auth/session";
import { ADMIN_SESSION_COOKIE_NAME } from "../src/infra/auth/guard";
import { getEnv } from "../src/lib/env";
import { setGlobalAppDepsForTesting } from "../src/infra/db/connection";
import { createTestEnvironment } from "./setup-db";

describe("API Edición de Productos: PUT /api/admin/products/[id] (QE Senior Audit)", () => {
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

  it("rechaza si no hay token de autenticación (401)", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/products/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nuevo Título" }),
    });

    const res = await updateProductHandler(req, {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(401);
  });

  it("rechaza si el ID de producto no es numérico (400)", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/products/abc", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nuevo Título" }),
    });
    req.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);

    const res = await updateProductHandler(req, {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
  });

  it("actualiza exitosamente título, precios, estado, fotos y atributos de la prenda", async () => {
    const { deps } = env;
    const cat = await deps.categoryRepo.findBySlug("vestidos-y-enteritos");
    expect(cat).toBeDefined();

    const created = await createProduct(
      {
        rawText: "Vestido seda $45.000",
        title: "Vestido Seda",
        priceCents: 4500000,
        categoryId: cat!.id,
      },
      deps
    );

    const req = new NextRequest(`http://localhost:3000/api/admin/products/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Vestido Seda Elegance",
        priceCents: 5200000,
        compareAtPriceCents: 6000000,
        categoryId: cat!.id,
        isFeatured: true,
        allowReturn: true,
        publishedAt: "2026-10-25T12:00:00.000Z",
        attributes: {
          tela: "seda-pura",
          estilo: ["fiesta"],
        },
        colors: [
          {
            name: "Rojo Rubí",
            hexCode: "#9b111e",
            position: 0,
            sizes: [
              { size: "S", stock: 4 },
              { size: "M", stock: 8 },
            ],
          },
        ],
      }),
    });
    req.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);

    const res = await updateProductHandler(req, {
      params: Promise.resolve({ id: String(created.id) }),
    });
    const data = await res.json();
    if (!data.ok) console.log("PUT error:", data);

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.product.title).toBe("Vestido Seda Elegance");
    expect(data.product.priceCents).toBe(5200000);
    expect(data.product.compareAtPriceCents).toBe(6000000);
    expect(data.product.isFeatured).toBe(true);
    expect(typeof data.product.publishedAt).toBe("number");
    expect(data.product.colors).toHaveLength(1);
    expect(data.product.colors[0].sizes).toHaveLength(2);
    expect(data.product.colors[0].sizes[0].stock).toBe(4);
    expect(data.product.colors[0].sizes[1].stock).toBe(8);
  });

  it("permite reasignar categoría a otra subcategoría válida", async () => {
    const { deps } = env;
    const cat1 = await deps.categoryRepo.findBySlug("vestidos-y-enteritos");
    const cat2 = await deps.categoryRepo.findBySlug("remeras-y-tops");
    expect(cat1).toBeDefined();
    expect(cat2).toBeDefined();

    const created = await createProduct(
      {
        rawText: "Top lino básico $30.000",
        title: "Top Lino",
        priceCents: 3000000,
        categoryId: cat1!.id,
      },
      deps
    );

    const req = new NextRequest(`http://localhost:3000/api/admin/products/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: cat2!.id,
      }),
    });
    req.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);

    const res = await updateProductHandler(req, {
      params: Promise.resolve({ id: String(created.id) }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.product.categoryId).toBe(cat2!.id);
  });

  it("soporta publishedAt tanto numérico como ISO 8601", async () => {
    const { deps } = env;
    const created = await createProduct(
      {
        rawText: "Buzo Oversize $40.000",
        title: "Buzo Oversize",
        priceCents: 4000000,
      },
      deps
    );

    const timestamp = Date.now() - 86400000;
    const req = new NextRequest(`http://localhost:3000/api/admin/products/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publishedAt: timestamp,
      }),
    });
    req.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);

    const res = await updateProductHandler(req, {
      params: Promise.resolve({ id: String(created.id) }),
    });
    const data = await res.json();
    if (!data.ok) console.log("PUT error:", data);

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.product.publishedAt).toBe(timestamp);
  });
});
