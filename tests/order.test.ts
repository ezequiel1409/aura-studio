import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestEnvironment } from "./setup-db";
import { createProduct } from "../src/services/product.service";
import {
  createOrder,
  getOrderByCode,
  getOrderById,
  updateOrderStatus,
  listOrders,
  clearOrderSubmissionsCache,
} from "../src/services/order.service";
import * as paymentService from "../src/services/payment.service";
import { WhatsAppPaymentAdapter } from "../src/infra/payments/whatsapp.adapter";
import { validateCreateOrderInput, formatOrderCode, parseOrderCode } from "../src/domain/order/rules";
import { ValidationError } from "../src/domain/errors";

describe("Order & Logistics Flow (BR-40, BR-41, BR-42)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    vi.restoreAllMocks();
    clearOrderSubmissionsCache();
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
          customerEmail: "camila@example.com",
          customerDni: "40123456",
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
          customerEmail: "camila@example.com",
          customerDni: "40123456",
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

      // Email inválido o faltante
      expect(() =>
        validateCreateOrderInput({
          customerName: "Camila Díaz",
          customerPhone: "1123456789",
          customerEmail: "",
          customerDni: "40123456",
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
      ).toThrow(/email/i);

      expect(() =>
        validateCreateOrderInput({
          customerName: "Camila Díaz",
          customerPhone: "1123456789",
          customerEmail: "invalido",
          customerDni: "40123456",
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
      ).toThrow(/email/i);

      // DNI inválido o faltante (< 6 dígitos)
      expect(() =>
        validateCreateOrderInput({
          customerName: "Camila Díaz",
          customerPhone: "1123456789",
          customerEmail: "camila@example.com",
          customerDni: "",
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
      ).toThrow(/dni/i);

      expect(() =>
        validateCreateOrderInput({
          customerName: "Camila Díaz",
          customerPhone: "1123456789",
          customerEmail: "camila@example.com",
          customerDni: "12345",
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
      ).toThrow(/dni/i);

      // Envío a domicilio sin dirección
      expect(() =>
        validateCreateOrderInput({
          customerName: "Camila Díaz",
          customerPhone: "1123456789",
          customerEmail: "camila@example.com",
          customerDni: "40123456",
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
        customerEmail: "camila@example.com",
        customerDni: "40123456",
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
      expect(valid.customerEmail).toBe("camila@example.com");
      expect(valid.customerDni).toBe("40123456");
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
          customerDni: "40123456",
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
            customerEmail: "lucia@example.com",
            customerDni: "38123456",
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

    it("descuenta el stock físico de la prenda al crear la orden y pasa a SOLD_OUT si se agota", async () => {
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

      // Crear orden comprando 2 unidades
      await createOrder(
        {
          customerName: "Valeria Gómez",
          customerPhone: "11 5555-8888",
          customerEmail: "valeria@example.com",
          customerDni: "40123456",
          deliveryMethod: "PICKUP",
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

      // Verificar que el stock remanente sea 1
      const updatedProduct = await env.deps.productRepo.findById(product.id);
      const remainingStock = updatedProduct?.colors?.reduce(
        (sum, c) => sum + c.sizes.reduce((sSum, s) => sSum + s.stock, 0),
        0
      );
      expect(remainingStock).toBe(1);
      const colorSize = updatedProduct?.colors?.find((c) => c.name === "Natural")?.sizes?.find((s) => s.size === "M");
      expect(colorSize?.stock).toBe(1);
      expect(updatedProduct?.status).toBe("AVAILABLE");

      // Comprar la última unidad restante
      const secondOrder = await createOrder(
        {
          customerName: "Camila Díaz",
          customerPhone: "11 4444-1111",
          customerEmail: "camila@example.com",
          customerDni: "40123456",
          deliveryMethod: "PICKUP",
          items: [
            {
              productId: product.id,
              productCode: product.code,
              productTitle: product.title || "Vestido Lino",
              colorName: "Natural",
              size: "M",
              quantity: 1,
              unitPriceCents: 4500000,
            },
          ],
        },
        env.deps
      );

      // Debe quedar en 0 y pasar automáticamente a SOLD_OUT
      const soldOutProduct = await env.deps.productRepo.findById(product.id);
      const soldOutTotalStock = soldOutProduct?.colors?.reduce(
        (sum, c) => sum + c.sizes.reduce((sSum, s) => sSum + s.stock, 0),
        0
      );
      expect(soldOutTotalStock).toBe(0);
      expect(soldOutProduct?.status).toBe("SOLD_OUT");

      // Si la segunda orden es cancelada, se debe restaurar el stock y volver a AVAILABLE
      await updateOrderStatus(secondOrder.order.id, "CANCELLED", env.deps);
      const restoredProduct = await env.deps.productRepo.findById(product.id);
      const restoredTotalStock = restoredProduct?.colors?.reduce(
        (sum, c) => sum + c.sizes.reduce((sSum, s) => sSum + s.stock, 0),
        0
      );
      expect(restoredTotalStock).toBe(1);
      expect(restoredProduct?.status).toBe("AVAILABLE");
    });

    it("permite listar pedidos con sus ítems completos y cambiar de estado", async () => {
      const product = await createProduct(
        {
          rawText: "Top Seda $20.000",
          colors: [
            {
              name: "Negro",
              position: 0,
              sizes: [{ size: "S", stock: 5 }],
            },
          ],
        },
        env.deps
      );

      const { order } = await createOrder(
        {
          customerName: "Marina Torres",
          customerPhone: "11 8888-9999",
          customerEmail: "marina@example.com",
          customerDni: "36123456",
          deliveryMethod: "PICKUP",
          items: [
            {
              productId: product.id,
              productCode: product.code,
              productTitle: "Top Seda",
              colorName: "Negro",
              size: "S",
              quantity: 1,
              unitPriceCents: 2000000,
            },
          ],
        },
        env.deps
      );

      // Listar órdenes
      const orders = await listOrders({}, env.deps);
      expect(orders.length).toBeGreaterThanOrEqual(1);
      const found = orders.find((o) => o.id === order.id);
      expect(found).toBeDefined();
      expect(found?.items?.length).toBe(1);
      expect(found?.items?.[0].productTitle).toBe("Top Seda");
      expect(found?.status).toBe("PENDING");

      // Actualizar estado a CONFIRMED
      const updated = await updateOrderStatus(order.id, "CONFIRMED", env.deps);
      expect(updated.status).toBe("CONFIRMED");

      // Filtrar por estado
      const confirmedOrders = await listOrders({ status: "CONFIRMED" }, env.deps);
      expect(confirmedOrders.some((o) => o.id === order.id)).toBe(true);

      const cancelledOrders = await listOrders({ status: "CANCELLED" }, env.deps);
      expect(cancelledOrders.some((o) => o.id === order.id)).toBe(false);
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

  describe("Código y Navegación de Órdenes (parseOrderCode)", () => {
    it("parsea correctamente códigos de orden con y sin prefijo", () => {
      expect(parseOrderCode("#ORD-001")).toBe(1);
      expect(parseOrderCode("ORD-001")).toBe(1);
      expect(parseOrderCode("ORD-25")).toBe(25);
      expect(parseOrderCode("#123")).toBe(123);
      expect(parseOrderCode("005")).toBe(5);
      expect(parseOrderCode("42")).toBe(42);
      expect(parseOrderCode("")).toBe(null);
      expect(parseOrderCode("ORD-")).toBe(null);
      expect(parseOrderCode("invalido")).toBe(null);
    });

    it("permite consultar órdenes tanto por id interno como por código correlativo", async () => {
      const product = await createProduct(
        {
          rawText: "Vestido Lino\nPrecio: $ 30.000",
          categoryId: 1,
        },
        env.deps
      );

      const { order } = await createOrder(
        {
          customerName: "Florencia Peña",
          customerPhone: "1122334455",
          customerEmail: "florencia@example.com",
          customerDni: "34123456",
          deliveryMethod: "PICKUP",
          items: [
            {
              productId: product.id,
              productCode: product.code,
              productTitle: "Vestido Lino",
              colorName: "Único",
              size: "M",
              quantity: 1,
              unitPriceCents: 3000000,
            },
          ],
        },
        env.deps
      );

      const byId = await getOrderById(order.id, env.deps);
      expect(byId.id).toBe(order.id);
      expect(byId.customerName).toBe("Florencia Peña");

      const byCode = await getOrderByCode(order.code, env.deps);
      expect(byCode.id).toBe(order.id);
      expect(byCode.code).toBe(order.code);
    });
  });

  describe("DNI del Titular y Búsqueda Omnicanal en Órdenes", () => {
    it("valida y persiste el DNI del comprador en la orden", async () => {
      // 1. Normalización de DNI en reglas
      const validated = validateCreateOrderInput({
        customerName: "Camila Díaz",
        customerPhone: "1123456789",
        customerEmail: "camila@example.com",
        customerDni: "40.123.456",
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
      });
      expect(validated.customerDni).toBe("40123456");

      // 2. Persistencia en base de datos vía createOrder
      const product = await createProduct(
        {
          rawText: "Top Seda $20.000",
          colors: [{ name: "Negro", position: 0, sizes: [{ size: "M", stock: 5 }] }],
        },
        env.deps
      );

      const { order } = await createOrder(
        {
          customerName: "Camila Díaz",
          customerPhone: "1123456789",
          customerEmail: "camila@example.com",
          customerDni: "40.123.456",
          deliveryMethod: "PICKUP",
          items: [
            {
              productId: product.id,
              productCode: product.code,
              productTitle: product.title ?? "Top Seda",
              colorName: "Negro",
              size: "M",
              quantity: 1,
              unitPriceCents: 2000000,
            },
          ],
        },
        env.deps
      );

      expect(order.customerDni).toBe("40123456");

      // Recuperación por ID y por Código
      const byId = await getOrderById(order.id, env.deps);
      expect(byId.customerDni).toBe("40123456");

      const byCode = await getOrderByCode(order.code, env.deps);
      expect(byCode.customerDni).toBe("40123456");
    });
  });

  describe("Idempotencia y Rollback Transaccional en Creación de Órdenes", () => {
    it("previene la duplicación de órdenes y doble descuento de stock al reintentar con la misma llave de idempotencia", async () => {
      const product = await createProduct(
        {
          rawText: "Pantalón Sastrero $45.000",
          colors: [{ name: "Negro", position: 0, sizes: [{ size: "L", stock: 10 }] }],
        },
        env.deps
      );

      const input = {
        idempotencyKey: "test_idem_unique_key_001",
        customerName: "Lucía Méndez",
        customerPhone: "1144556677",
        customerEmail: "lucia@example.com",
        customerDni: "38111222",
        deliveryMethod: "PICKUP" as const,
        paymentMethod: "TRANSFER" as const,
        items: [
          {
            productId: product.id,
            productCode: product.code,
            productTitle: product.title ?? "Pantalón Sastrero",
            colorName: "Negro",
            size: "L",
            quantity: 2,
            unitPriceCents: 4500000,
          },
        ],
      };

      // 1. Primer envío
      const res1 = await createOrder(input, env.deps);
      expect(res1.order.id).toBeGreaterThan(0);
      expect(res1.order.code).toBeGreaterThan(0);

      // El stock debe haber bajado de 10 a 8
      let updatedProduct = await env.deps.productRepo.findById(product.id);
      expect(updatedProduct!.colors![0].sizes[0].stock).toBe(8);

      // 2. Segundo envío con la misma llave de idempotencia
      const res2 = await createOrder(input, env.deps);

      // Debe devolver exactamente la misma orden existente
      expect(res2.order.id).toBe(res1.order.id);
      expect(res2.order.code).toBe(res1.order.code);

      // El stock NO debe volver a descontarse (debe permanecer en 8, no en 6)
      updatedProduct = await env.deps.productRepo.findById(product.id);
      expect(updatedProduct!.colors![0].sizes[0].stock).toBe(8);

      // En la base de datos sólo existe 1 orden
      const allOrders = await env.deps.orderRepo.list();
      expect(allOrders.length).toBe(1);
    });

    it("resuelve peticiones concurrentes idénticas en vuelo sin duplicar stock ni órdenes", async () => {
      const product = await createProduct(
        {
          rawText: "Blusa Seda $35.000",
          colors: [{ name: "Blanco", position: 0, sizes: [{ size: "S", stock: 5 }] }],
        },
        env.deps
      );

      const input = {
        idempotencyKey: "test_concurrent_key_002",
        customerName: "Mariana Costa",
        customerPhone: "1199887766",
        customerEmail: "mariana@example.com",
        customerDni: "39888777",
        deliveryMethod: "PICKUP" as const,
        paymentMethod: "TRANSFER" as const,
        items: [
          {
            productId: product.id,
            productCode: product.code,
            productTitle: product.title ?? "Blusa Seda",
            colorName: "Blanco",
            size: "S",
            quantity: 1,
            unitPriceCents: 3500000,
          },
        ],
      };

      // Disparar dos peticiones en paralelo
      const [resA, resB] = await Promise.all([
        createOrder(input, env.deps),
        createOrder(input, env.deps),
      ]);

      expect(resA.order.id).toBe(resB.order.id);
      expect(resA.order.code).toBe(resB.order.code);

      const updatedProduct = await env.deps.productRepo.findById(product.id);
      expect(updatedProduct!.colors![0].sizes[0].stock).toBe(4);

      const allOrders = await env.deps.orderRepo.list();
      expect(allOrders.length).toBe(1);
    });

    it("ejecuta rollback transaccional automático (restaura stock y cancela orden) si la pasarela de pago falla", async () => {
      const product = await createProduct(
        {
          rawText: "Vestido Gala $60.000",
          colors: [{ name: "Rojo", position: 0, sizes: [{ size: "M", stock: 5 }] }],
        },
        env.deps
      );

      // Simular falla en la comunicación con la pasarela de pago
      vi.spyOn(paymentService, "createOrderPaymentPreference").mockRejectedValueOnce(
        new Error("Conexión rechazada por timeout en API de cobro")
      );

      const input = {
        idempotencyKey: "test_rollback_key_003",
        customerName: "Sofía Rossi",
        customerPhone: "1155667788",
        customerEmail: "sofia@example.com",
        customerDni: "37444555",
        deliveryMethod: "PICKUP" as const,
        paymentMethod: "MERCADOPAGO" as const,
        items: [
          {
            productId: product.id,
            productCode: product.code,
            productTitle: product.title ?? "Vestido Gala",
            colorName: "Rojo",
            size: "M",
            quantity: 2,
            unitPriceCents: 6000000,
          },
        ],
      };

      // Debe lanzar ValidationError informando el rollback
      await expect(createOrder(input, env.deps)).rejects.toThrow(
        /No se pudo completar el proceso de cobro.*Tu stock fue restaurado y la orden cancelada/i
      );

      // ROLLBACK 1: El inventario fue restaurado a 5 unidades intactas
      const restoredProduct = await env.deps.productRepo.findById(product.id);
      expect(restoredProduct!.colors![0].sizes[0].stock).toBe(5);

      // ROLLBACK 2: La orden creada quedó marcada como CANCELLED y REJECTED
      const allOrders = await env.deps.orderRepo.list();
      expect(allOrders.length).toBe(1);
      expect(allOrders[0].status).toBe("CANCELLED");
      expect(allOrders[0].paymentStatus).toBe("REJECTED");

      // ROLLBACK 3: La llave de idempotencia fue liberada para permitir un nuevo intento
      // Ahora sin mock de falla, la reintentación debe operar con éxito
      const retryResult = await createOrder(input, env.deps);
      expect(retryResult.order.id).toBeGreaterThan(0);
      expect(retryResult.order.status).toBe("PENDING");

      // Stock debitado 5 - 2 = 3
      const productAfterRetry = await env.deps.productRepo.findById(product.id);
      expect(productAfterRetry!.colors![0].sizes[0].stock).toBe(3);
    });
  });
});

