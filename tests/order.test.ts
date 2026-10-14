import { beforeEach, describe, expect, it } from "vitest";
import { createTestEnvironment } from "./setup-db";
import { createProduct } from "../src/services/product.service";
import { createOrder, getOrderByCode } from "../src/services/order.service";
import { WhatsAppPaymentAdapter } from "../src/infra/payments/whatsapp.adapter";
import { validateCreateOrderInput, formatOrderCode } from "../src/domain/order/rules";
import { ValidationError } from "../src/domain/errors";

describe("Order & Logistics Flow (BR-40, BR-41, BR-42)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  describe("Validación de Reglas de Orden (rules.ts)", () => {
    it("valida campos obligatorios del comprador y método de entrega (BR-41)", () => {
      // Nombre vacío
      expect(() =>
        validateCreateOrderInput({
          customerName: "",
          customerPhone: "1123456789",
          deliveryMethod: "PICKUP",
          items: [
            {
              productCode: 1,
              productTitle: "Top",
              colorName: "Negro",
              size: "M",
              quantity: 1,
              unitPriceCents: 2000000,
            },
          ],
        })
      ).toThrow(ValidationError);

      // Teléfono inválido
      expect(() =>
        validateCreateOrderInput({
          customerName: "Camila Díaz",
          customerPhone: "123",
          deliveryMethod: "PICKUP",
          items: [
            {
              productCode: 1,
              productTitle: "Top",
              colorName: "Negro",
              size: "M",
              quantity: 1,
              unitPriceCents: 2000000,
            },
          ],
        })
      ).toThrow(ValidationError);

      // Envío a domicilio sin dirección
      expect(() =>
        validateCreateOrderInput({
          customerName: "Camila Díaz",
          customerPhone: "1123456789",
          deliveryMethod: "HOME_DELIVERY",
          deliveryAddress: "",
          items: [
            {
              productCode: 1,
              productTitle: "Top",
              colorName: "Negro",
              size: "M",
              quantity: 1,
              unitPriceCents: 2000000,
            },
          ],
        })
      ).toThrow(ValidationError);

      // Retiro en showroom no requiere dirección
      const valid = validateCreateOrderInput({
        customerName: "Camila Díaz",
        customerPhone: "1123456789",
        deliveryMethod: "PICKUP",
        items: [
          {
            productCode: 1,
            productTitle: "Top",
            colorName: "Negro",
            size: "M",
            quantity: 2,
            unitPriceCents: 2000000,
          },
        ],
      });

      expect(valid.subtotalCents).toBe(4000000);
      expect(valid.totalCents).toBe(4000000);
    });
  });

  describe("Servicio createOrder con control de inventario (BR-40, BR-42)", () => {
    it("crea una orden atómica única (#ORD-001) y genera el link de WhatsApp", async () => {
      // Creamos un producto de prueba
      const product = await createProduct(
        {
          rawText: "Vestido Lino $45.000",
          colors: [
            {
              name: "Natural",
              position: 0,
              sizes: [{ size: "M", stock: 3 }],
            },
          ],
        },
        env.deps
      );

      const result = await createOrder(
        {
          customerName: "Valeria Gómez",
          customerPhone: "11 5555-8888",
          customerEmail: "valeria@example.com",
          deliveryMethod: "HOME_DELIVERY",
          deliveryAddress: "Av. Corrientes 1500, CABA",
          deliveryNotes: "Dejar en portería",
          items: [
            {
              productId: product.id,
              productCode: product.code,
              productTitle: product.title || "Vestido Lino",
              colorName: "Natural",
              size: "M",
              quantity: 2,
              unitPriceCents: 4500000,
            },
          ],
        },
        env.deps
      );

      expect(result.order).toBeDefined();
      expect(result.order.code).toBe(1);
      expect(formatOrderCode(result.order.code)).toBe("#ORD-001");
      expect(result.order.customerName).toBe("Valeria Gómez");
      expect(result.order.items?.length).toBe(1);
      expect(result.order.items?.[0].quantity).toBe(2);
      expect(result.order.totalCents).toBe(9000000);

      // Enlace de WhatsApp generado
      expect(result.whatsappUrl).toContain("https://wa.me/");
      const decodedUrl = decodeURIComponent(result.whatsappUrl);
      expect(decodedUrl).toContain("#ORD-001");
      expect(decodedUrl).toContain("Valeria Gómez");
      expect(decodedUrl).toContain("Av. Corrientes 1500");
      expect(decodedUrl).toContain("Envío a domicilio");

      // Buscar por código
      const fetched = await getOrderByCode(1, env.deps);
      expect(fetched.id).toBe(result.order.id);
    });

    it("impide crear una orden si la cantidad solicitada supera el stock disponible (BR-40)", async () => {
      const product = await createProduct(
        {
          rawText: "Top Seda $20.000",
          colors: [
            {
              name: "Negro",
              position: 0,
              sizes: [{ size: "S", stock: 2 }],
            },
          ],
        },
        env.deps
      );

      // Solicitar 3 unidades cuando solo hay 2
      await expect(
        createOrder(
          {
            customerName: "Lucía Luna",
            customerPhone: "11 9999-0000",
            deliveryMethod: "PICKUP",
            items: [
              {
                productId: product.id,
                productCode: product.code,
                productTitle: product.title || "Top Seda",
                colorName: "Negro",
                size: "S",
                quantity: 3, // Supera stock
                unitPriceCents: 2000000,
              },
            ],
          },
          env.deps
        )
      ).rejects.toThrow(/solo dispone de 2 unidad/);
    });
  });

  describe("WhatsApp Order Adapter (BR-42)", () => {
    it("genera el mensaje estructurado para múltiples prendas y motomensajería", () => {
      const adapter = new WhatsAppPaymentAdapter({
        whatsappNumber: "+54 9 11 9876-5432",
        brandName: "Aura Studio",
      });

      const action = adapter.createOrderPaymentAction({
        code: 5,
        customerName: "Romina Paez",
        customerPhone: "1144445555",
        deliveryMethod: "MOTORCYCLE",
        deliveryAddress: "Palermo Soho, Thames 1800",
        deliveryNotes: "Timbre 2A después de las 16hs",
        subtotalCents: 7500000,
        discountCents: 0,
        shippingCents: 0,
        totalCents: 7500000,
        currency: "ARS",
        items: [
          {
            productCode: 10,
            productTitle: "Blusa Lino",
            colorName: "Beige",
            size: "M",
            quantity: 1,
            unitPriceCents: 3500000,
            subtotalCents: 3500000,
          },
          {
            productCode: 15,
            productTitle: "Short Sastrero",
            colorName: "Negro",
            size: "40",
            quantity: 1,
            unitPriceCents: 4000000,
            subtotalCents: 4000000,
          },
        ],
      });

      expect(action.type).toBe("url");
      expect(action.url).toContain("https://wa.me/5491198765432");

      const decoded = decodeURIComponent(action.url);
      expect(decoded).toContain("#ORD-005");
      expect(decoded).toContain("• #010 Blusa Lino (1u, Color: Beige, Talle: M) - $35.000");
      expect(decoded).toContain("• #015 Short Sastrero (1u, Color: Negro, Talle: 40) - $40.000");
      expect(decoded).toContain("Motomensajería Express (Palermo Soho, Thames 1800)");
      expect(decoded).toContain("Subtotal: $75.000");
      expect(decoded).toContain("Romina Paez");
      expect(decoded).toContain("Timbre 2A después de las 16hs");
    });
  });
});
