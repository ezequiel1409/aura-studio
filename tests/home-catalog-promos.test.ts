import { beforeEach, describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { createTestEnvironment } from "./setup-db";
import {
  createProduct,
  getCatalogFacets,
  listProducts,
} from "../src/services/product.service";
import {
  buildSectionProductFilter,
  listPublicNavigationSections,
  upsertNavigationSection,
} from "../src/services/navigation.service";
import {
  duplicatePromotion,
  listPublicPromotions,
  upsertPromotion,
} from "../src/services/promotion.service";
import {
  buildGoogleMapsSearchUrl,
  computeStoreOpenStatus,
  DEFAULT_STORE_LOCATION,
  DEFAULT_STORE_SCHEDULE,
} from "../src/lib/schedule/store-schedule";
import { Footer } from "../src/components/layout/Footer";

describe("Home, Catálogo Estilo Panel, Promociones Bancarias y Footer (Fases 1-5)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  describe("Fase 1 & 2: Atributos del Rubro, Sale, Secciones y Catálogo Estilo Panel", () => {
    it("crea productos con precio anterior (Sale), fecha de publicación y atributo 'Para', y filtra en el servidor con facetas y tandas", async () => {
      const nowMs = Date.now();

      // Producto Mujer en Sale
      const pMujerSale = await createProduct(
        {
          rawText: "Vestido Lino Siena $35.000",
          title: "Vestido Lino Siena",
          priceCents: 3500000,
          compareAtPriceCents: 4500000,
          publishedAt: nowMs - 86400 * 1000 * 2, // hace 2 días
          isFeatured: true,
          attributes: { para: ["mujer"], material: ["lino"] },
          colors: [
            {
              name: "Arena",
              hexCode: "#D2B48C",
              sizes: [
                { size: "S", stock: 2 },
                { size: "M", stock: 4 },
              ],
            },
          ],
        },
        env.deps
      );

      // Producto Hombre sin Sale
      const pHombre = await createProduct(
        {
          rawText: "Camisa Oxford $42.000",
          title: "Camisa Oxford",
          priceCents: 4200000,
          compareAtPriceCents: null,
          publishedAt: nowMs - 86400 * 1000 * 60, // hace 60 días
          isFeatured: false,
          attributes: { para: ["hombre"], material: ["algodon"] },
          colors: [
            {
              name: "Celeste",
              hexCode: "#87CEEB",
              sizes: [{ size: "L", stock: 3 }],
            },
          ],
        },
        env.deps
      );

      expect(pMujerSale.compareAtPriceCents).toBe(4500000);
      expect(pMujerSale.attributes?.para).toEqual(["mujer"]);
      expect(pHombre.attributes?.para).toEqual(["hombre"]);

      // 1. Filtrar por sección/atributo 'para: mujer'
      const resMujer = await listProducts(
        {
          attributes: { para: ["mujer"] },
          sortBy: "featured",
          page: 1,
          pageSize: 12,
        },
        env.deps
      );
      expect(resMujer.items.some((i) => i.id === pMujerSale.id)).toBe(true);
      expect(resMujer.items.some((i) => i.id === pHombre.id)).toBe(false);

      // 2. Filtrar por En Oferta (Sale) y verificar facetas del servidor
      const resSale = await listProducts(
        {
          onlyOnSale: true,
          sortBy: "price_asc",
          page: 1,
          pageSize: 12,
        },
        env.deps
      );
      expect(resSale.items.some((i) => i.id === pMujerSale.id)).toBe(true);
      expect(resSale.items.some((i) => i.id === pHombre.id)).toBe(false);

      const facets = await getCatalogFacets({}, env.deps);
      expect(facets.onSaleCount).toBeGreaterThanOrEqual(1);
      expect(facets.sizes.some((s) => s.size === "M" && s.count >= 1)).toBe(true);
    });

    it("oculta automáticamente las secciones de navegación sin productos que cumplan su regla", async () => {
      // Crear una sección con un atributo que ningún producto tiene
      await upsertNavigationSection(
        {
          name: "NIÑOS",
          slug: "ninos",
          ruleType: "ATTRIBUTE",
          ruleConfig: {
            attributeSlug: "para",
            attributeValue: "ninos",
          },
          position: 10,
          isVisible: true,
        },
        env.deps
      );

      // Crear producto para mujer para que la sección MUJER sí tenga contenido
      await createProduct(
        {
          rawText: "Blusa Seda $28.000",
          title: "Blusa Seda",
          priceCents: 2800000,
          attributes: { para: ["mujer"] },
        },
        env.deps
      );

      await upsertNavigationSection(
        {
          name: "MUJER",
          slug: "mujer",
          ruleType: "ATTRIBUTE",
          ruleConfig: {
            attributeSlug: "para",
            attributeValue: "mujer",
          },
          position: 1,
          isVisible: true,
        },
        env.deps
      );

      const visibleSections = await listPublicNavigationSections(env.deps);
      expect(visibleSections.some((s) => s.slug === "mujer")).toBe(true);
      expect(visibleSections.some((s) => s.slug === "ninos")).toBe(false);

      const mujerSection = visibleSections.find((s) => s.slug === "mujer")!;
      const resolvedFilter = buildSectionProductFilter(mujerSection);
      expect(resolvedFilter.attributes?.para).toEqual(["mujer"]);
    });
  });

  describe("Fase 4: Promociones Bancarias Informativas y Términos y Condiciones Obligatorios", () => {
    it("exige términos y condiciones y fechas de vigencia al publicar una promoción bancaria", async () => {
      const bank = await env.deps.promotionRepo!.upsertBank({
        name: "Banco Galicia",
        slug: "galicia",
        accentColor: "#e65100",
        isActive: true,
      });

      const now = Date.now();

      // Intentar crear una promoción sin términos y condiciones debe fallar
      await expect(
        upsertPromotion(
          {
            title: "3 cuotas sin interés",
            slug: "galicia-3-cuotas",
            type: "BANK",
            bankId: bank.id,
            benefitSummary: "3 cuotas sin interés",
            benefitType: "INSTALLMENTS",
            validDays: ["jue", "vie"],
            paymentMethods: ["Crédito Visa", "Crédito Mastercard"],
            termsAndConditions: "",
            startsAt: now - 86400 * 1000,
            endsAt: now + 86400 * 1000 * 30,
          },
          { promotionRepo: env.deps.promotionRepo! }
        )
      ).rejects.toThrow(/términos y condiciones/i);

      // Crear con términos y condiciones legales completos funciona
      const validPromo = await upsertPromotion(
        {
          title: "3 cuotas sin interés con Galicia",
          slug: "galicia-3-cuotas",
          type: "BANK",
          bankId: bank.id,
          benefitSummary: "3 cuotas sin interés + 15% de reintegro",
          benefitType: "BOTH",
          capCents: 1500000,
          validDays: ["jue", "vie"],
          paymentMethods: ["Crédito Visa", "Crédito Mastercard"],
          termsAndConditions:
            "Cartera de consumo. Válido jueves y viernes abonando con tarjetas de crédito Visa y Mastercard emitidas por Banco Galicia. CFTNA 0,00%.",
          startsAt: now - 86400 * 1000,
          endsAt: now + 86400 * 1000 * 30,
          isActive: true,
        },
        { promotionRepo: env.deps.promotionRepo! }
      );

      expect(validPromo.id).toBeGreaterThan(0);
      expect(validPromo.bank?.name).toBe("Banco Galicia");

      const publicPromos = await listPublicPromotions(
        { promotionRepo: env.deps.promotionRepo! },
        { now }
      );
      expect(publicPromos.active.some((p) => p.slug === "galicia-3-cuotas")).toBe(true);

      // Duplicar promoción para renovar mes a mes
      const duplicated = await duplicatePromotion(validPromo.id, {
        promotionRepo: env.deps.promotionRepo!,
      });
      expect(duplicated.title).toContain("(Copia)");
      expect(duplicated.isActive).toBe(false);
    });
  });

  describe("Fase 5: Footer en 4 Columnas, Ubicación Google Maps (sin API) y Horarios en Vivo", () => {
    it("construye enlace de búsqueda a Google Maps sin requerir clave de API", () => {
      const url = buildGoogleMapsSearchUrl({
        ...DEFAULT_STORE_LOCATION,
        streetAddress: "Gurruchaga 1650",
        locality: "Palermo Soho",
        province: "CABA",
        postalCode: "C1414",
        googleMapsUrl: null,
      });

      expect(url).toContain("https://www.google.com/maps/search/?api=1&query=");
      expect(decodeURIComponent(url)).toContain("Gurruchaga 1650");
      expect(decodeURIComponent(url)).toContain("Palermo Soho");
    });

    it("calcula correctamente el estado 'Abierto ahora' y 'Cerrado' según día y franja horaria", () => {
      // Martes 16:00 hs en Buenos Aires (UTC-3 -> 19:00 UTC)
      const tuesdayOpenDate = new Date("2026-10-20T19:00:00Z");
      const openStatus = computeStoreOpenStatus(DEFAULT_STORE_SCHEDULE, tuesdayOpenDate);
      expect(openStatus.isOpen).toBe(true);
      expect(openStatus.badgeText).toContain("Abierto ahora");
      expect(openStatus.todayKey).toBe("tuesday");

      // Lunes 16:00 hs en Buenos Aires (cerrado los lunes por defecto)
      const mondayClosedDate = new Date("2026-10-19T19:00:00Z");
      const closedStatus = computeStoreOpenStatus(DEFAULT_STORE_SCHEDULE, mondayClosedDate);
      expect(closedStatus.isOpen).toBe(false);
      expect(closedStatus.badgeText).toContain("Cerrado");
      expect(closedStatus.todayKey).toBe("monday");
    });

    it("renderiza el Footer en 4 columnas con tabla accesible de horarios, enlace a Google Maps y JSON-LD", () => {
      const html = renderToString(
        React.createElement(Footer, {
          brandName: "Aura Studio",
          whatsappNumber: "+5491112345678",
          storeLocation: DEFAULT_STORE_LOCATION,
          storeSchedule: DEFAULT_STORE_SCHEDULE,
        })
      );

      expect(html).toContain("Ver en Google Maps");
      expect(html).toContain('aria-label="Horarios de atención por día de la semana"');
      expect(html).toContain("Promociones bancarias");
      expect(html).toContain("application/ld+json");
      expect(html).toContain("ClothingStore");
    });
  });
});
