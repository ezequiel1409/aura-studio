import { describe, it, expect, vi } from "vitest";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
import { GET as getLlmsTxt } from "../src/app/llms.txt/route";

vi.mock("../src/infra/db/connection", () => {
  return {
    getProductServiceDeps: vi.fn(() => ({
      settingsRepo: {
        get: vi.fn(async (key: string) => {
          if (key === "showroom_name") return "Comercio Demo";
          if (key === "business_descriptor") return "Selección Editorial";
          if (key === "about_text") return "Catálogo digital de productos curados.";
          return null;
        }),
      },
      navigationRepo: {
        listSections: vi.fn().mockResolvedValue([
          { id: 1, name: "Recién Llegados", slug: "recien-llegados", isVisible: true },
          { id: 2, name: "Destacados", slug: "destacados", isVisible: true },
        ]),
      },
      categoryRepo: {
        listAll: vi.fn().mockResolvedValue([
          { id: 1, name: "Remeras", slug: "remeras" },
          { id: 2, name: "Accesorios", slug: "accesorios" },
        ]),
      },
      productRepo: {
        list: vi.fn().mockResolvedValue({
          items: [
            {
              id: 10,
              code: 1,
              title: "Producto Alfa",
              status: "AVAILABLE",
              updatedAt: 1730000000000,
            },
            {
              id: 11,
              code: 23,
              title: "Producto Beta",
              status: "AVAILABLE",
              updatedAt: 1730000000000,
            },
          ],
          total: 2,
        }),
      },
      promotionRepo: {
        listPromotions: vi.fn().mockResolvedValue([
          { id: 1, slug: "banco-demo-3-cuotas", title: "Banco Demo 3 Cuotas" },
        ]),
      },
    })),
  };
});

describe("SEO Técnico, Robots y Sitemap (Next.js 16 App Router)", () => {
  it("robots() define directivas correctas para buscadores y agentes de IA", () => {
    const res = robots();

    expect(res.rules).toBeDefined();
    expect(res.sitemap).toContain("/sitemap.xml");

    const rules = Array.isArray(res.rules) ? res.rules : [res.rules];

    const generalRule = rules.find((r) => r.userAgent === "*");
    expect(generalRule).toBeDefined();
    expect(generalRule?.allow).toBe("/");
    expect(generalRule?.disallow).toContain("/admin");
    expect(generalRule?.disallow).toContain("/api/");

    const aiRule = rules.find(
      (r) => Array.isArray(r.userAgent) && r.userAgent.includes("GPTBot")
    );
    expect(aiRule).toBeDefined();
    expect(aiRule?.allow).toBe("/");
  });

  it("sitemap() genera URLs dinámicas completas para páginas fijas, colecciones y productos con formato canónico", async () => {
    const entries = await sitemap();

    expect(entries.length).toBeGreaterThanOrEqual(7);

    const urls = entries.map((e) => e.url);

    expect(urls.some((u) => u === "https://mitienda.local" || u.endsWith("/"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/catalogo"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/promociones"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/terminos"))).toBe(true);

    expect(urls.some((u) => u.endsWith("/recien-llegados"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/destacados"))).toBe(true);

    expect(urls.some((u) => u.endsWith("/p/001"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/p/023"))).toBe(true);

    expect(urls.some((u) => u.endsWith("/promociones/banco-demo-3-cuotas"))).toBe(true);
  });

  it("GET /llms.txt devuelve un manifiesto markdown estructurado dinámico y libre de hardcoding", async () => {
    const response = await getLlmsTxt();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");

    const text = await response.text();
    expect(text).toContain("Comercio Demo");
    expect(text).toContain("Guía para Agentes de IA");
    expect(text).toContain("recien-llegados");
    expect(text).toContain("Accesorios");
    expect(text).not.toMatch(/shefit/i);
  });
});
