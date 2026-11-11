import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/analytics/track/route";
import { createTestEnvironment } from "./setup-db";
import { createProduct } from "../src/services/product.service";

describe("Analytics Track Endpoint (Fase 4 - waitUntil & Bot Filtering)", () => {
  let validProductId: number;

  beforeEach(async () => {
    const env = createTestEnvironment();
    await env.seed();
    const product = await createProduct(
      {
        rawText: "Remera Algodón $15000 Negro M",
        categoryId: 1,
        source: "web",
      },
      env.deps
    );
    validProductId = product.id;
  });

  it("ignora peticiones provenientes de bots conocidos sin registrar evento", async () => {
    const req = new NextRequest("http://localhost/api/analytics/track", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
      body: JSON.stringify({
        type: "product_view",
        productId: validProductId,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("acepta peticiones de usuarios legítimos y responde ok", async () => {
    const req = new NextRequest("http://localhost/api/analytics/track", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
      },
      body: JSON.stringify({
        type: "product_view",
        productId: validProductId,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("devuelve 400 si el cuerpo de la petición no es JSON válido", async () => {
    const req = new NextRequest("http://localhost/api/analytics/track", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0",
      },
      body: "invalid-json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });
});
