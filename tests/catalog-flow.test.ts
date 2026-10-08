import { beforeEach, describe, expect, it } from "vitest";
import { createTestEnvironment } from "./setup-db";
import { WhatsAppPaymentAdapter } from "../src/infra/payments/whatsapp.adapter";
import { trackAnalyticsEvent } from "../src/services/analytics.service";
import { createProduct } from "../src/services/product.service";
import { productStats } from "../src/infra/db/schema";
import { eq } from "drizzle-orm";

describe("Phase 2 - Public Catalog Flow & Adapters", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  describe("WhatsApp Payment Adapter (BR-13, BR-14)", () => {
    it("genera enlace de WhatsApp con mensaje prearmado y codificado", () => {
      const adapter = new WhatsAppPaymentAdapter({
        whatsappNumber: "+54 9 11 1234-5678",
        brandName: "Aura Studio",
      });

      const action = adapter.createPaymentAction({
        code: 24,
        formattedCode: "#024",
        title: "Top Lino Blanco",
        priceCents: 1850000,
        currency: "ARS",
      });

      expect(action.type).toBe("url");
      expect(action.url).toContain("https://wa.me/5491112345678?text=");
      expect(decodeURIComponent(action.url)).toContain("#024");
      expect(decodeURIComponent(action.url)).toContain("Top Lino Blanco");
      expect(decodeURIComponent(action.url)).toContain("Aura Studio");
    });
  });

  describe("Decoupled Analytics Tracking (AR-07, BR-39)", () => {
    it("registra visitas y clics de WhatsApp incrementando contadores", async () => {
      const product = await createProduct(
        { rawText: "Vestido Lencero $30.000" },
        env.deps
      );

      // 1. Registrar vista de producto
      const recordedView = await trackAnalyticsEvent(
        {
          type: "product_view",
          productId: product.id,
          sessionId: "sess_user_1",
        },
        env.db
      );
      expect(recordedView).toBe(true);

      const [pStat] = await env.db
        .select()
        .from(productStats)
        .where(eq(productStats.productId, product.id));
      expect(pStat.viewsCount).toBe(1);

      // 2. Registrar clic en WhatsApp
      const recordedClick = await trackAnalyticsEvent(
        {
          type: "whatsapp_click",
          productId: product.id,
          sessionId: "sess_user_1",
        },
        env.db
      );
      expect(recordedClick).toBe(true);

      const [pStatAfterClick] = await env.db
        .select()
        .from(productStats)
        .where(eq(productStats.productId, product.id));
      expect(pStatAfterClick.whatsappClicks).toBe(1);
    });

    it("aplica debouncing de 30 minutos a visitas repetidas en la misma sesión (BR-39)", async () => {
      const product = await createProduct(
        { rawText: "Pantalón Sastrero $25.000" },
        env.deps
      );

      // Primera visita suma
      const first = await trackAnalyticsEvent(
        {
          type: "product_view",
          productId: product.id,
          sessionId: "sess_debounce_test",
        },
        env.db
      );
      expect(first).toBe(true);

      // Segunda visita inmediata con la misma sesión es ignorada por debounce
      const second = await trackAnalyticsEvent(
        {
          type: "product_view",
          productId: product.id,
          sessionId: "sess_debounce_test",
        },
        env.db
      );
      expect(second).toBe(false);

      const [stat] = await env.db
        .select()
        .from(productStats)
        .where(eq(productStats.productId, product.id));
      expect(stat.viewsCount).toBe(1); // Sigue en 1
    });

    it("excluye la actividad de la administradora de los contadores (BR-39)", async () => {
      const product = await createProduct(
        { rawText: "Remera Oversize $15.000" },
        env.deps
      );

      const tracked = await trackAnalyticsEvent(
        {
          type: "product_view",
          productId: product.id,
          sessionId: "admin_session",
          isAdmin: true,
        },
        env.db
      );

      expect(tracked).toBe(false);

      const [stat] = await env.db
        .select()
        .from(productStats)
        .where(eq(productStats.productId, product.id));
      expect(stat.viewsCount).toBe(0);
    });
  });
});
