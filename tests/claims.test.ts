import { beforeEach, describe, expect, it } from "vitest";
import { createTestEnvironment } from "./setup-db";
import { createProduct } from "../src/services/product.service";
import { createOrder, getOrderByCode, getOrderById, listOrders, updateOrderStatus } from "../src/services/order.service";
import {
  createOrderClaim,
  inspectOrderClaim,
  isValidEmail,
  isValidPhone,
  normalizeDni,
  normalizeEmail,
  normalizePhone,
} from "../src/services/claim.service";
import { ValidationError } from "../src/domain/errors";

describe("Botón de Arrepentimiento, Devoluciones y Control de Calidad (Res. 424/2020)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  describe("Funciones utilitarias de normalización y validación", () => {
    it("normaliza DNI eliminando puntos y espacios", () => {
      expect(normalizeDni("40.123.456")).toBe("40123456");
      expect(normalizeDni(" 40 123 456 ")).toBe("40123456");
    });

    it("normaliza teléfono eliminando guiones y espacios", () => {
      expect(normalizePhone("+54 9 11 2345-6789")).toBe("5491123456789");
    });

    it("normaliza email convirtiendo a minúsculas y quitando espacios", () => {
      expect(normalizeEmail("  Comprador@Example.COM ")).toBe("comprador@example.com");
    });

    it("valida formato de email y teléfono por separado", () => {
      expect(isValidEmail("cliente@tienda.com")).toBe(true);
      expect(isValidEmail("invalido-sin-arroba")).toBe(false);
      expect(isValidPhone("11 4444-5555")).toBe(true);
      expect(isValidPhone("123")).toBe(false);
    });
  });

  describe("Creación de Solicitud de Arrepentimiento (createOrderClaim)", () => {
    it("valida campos requeridos: número de pedido, DNI, email y teléfono por separado y condición de uso", async () => {
      // Falta orden
      await expect(
        createOrderClaim(
          {
            orderCode: 0,
            customerName: "Camila Díaz",
            customerDni: "40123456",
            customerEmail: "camila@example.com",
            customerPhone: "1144445555",
            conditionAccepted: true,
          },
          env.deps
        )
      ).rejects.toThrow(ValidationError);

      // DNI inválido
      await expect(
        createOrderClaim(
          {
            orderCode: 1,
            customerName: "Camila Díaz",
            customerDni: "123",
            customerEmail: "camila@example.com",
            customerPhone: "1144445555",
            conditionAccepted: true,
          },
          env.deps
        )
      ).rejects.toThrow(ValidationError);

      // Email inválido cuando se envían campos separados
      await expect(
        createOrderClaim(
          {
            orderCode: 1,
            customerName: "Camila Díaz",
            customerDni: "40123456",
            customerEmail: "correo-invalido",
            customerPhone: "1144445555",
            conditionAccepted: true,
          },
          env.deps
        )
      ).rejects.toThrow("correo electrónico válido");

      // Teléfono inválido cuando se envían campos separados
      await expect(
        createOrderClaim(
          {
            orderCode: 1,
            customerName: "Camila Díaz",
            customerDni: "40123456",
            customerEmail: "camila@example.com",
            customerPhone: "123",
            conditionAccepted: true,
          },
          env.deps
        )
      ).rejects.toThrow("número de teléfono válido");

      // Condición de recirculación no aceptada (prenda con manchas o usada)
      await expect(
        createOrderClaim(
          {
            orderCode: 1,
            customerName: "Camila Díaz",
            customerDni: "40123456",
            customerEmail: "camila@example.com",
            customerPhone: "1144445555",
            conditionAccepted: false,
          },
          env.deps
        )
      ).rejects.toThrow(ValidationError);
    });

    it("rechaza si el pedido no existe en el sistema", async () => {
      await expect(
        createOrderClaim(
          {
            orderCode: 99999,
            customerName: "Camila Díaz",
            customerDni: "40123456",
            customerEmail: "camila@example.com",
            customerPhone: "1144445555",
            conditionAccepted: true,
          },
          env.deps
        )
      ).rejects.toThrow("No se encontró ningún pedido");
    });

    it("rechaza si el email o teléfono no coinciden con los datos registrados (anti-troll)", async () => {
      const product = await createProduct(
        {
          rawText: "Pantalón Sastrero $50.000",
          colors: [{ name: "Negro", position: 0, sizes: [{ size: "M", stock: 2 }] }],
        },
        env.deps
      );

      const orderResult = await createOrder(
        {
          customerName: "Valeria Gómez",
          customerPhone: "1155558888",
          customerEmail: "valeria@example.com",
          customerDni: "40123456",
          deliveryMethod: "PICKUP",
          items: [
            {
              productCode: product.code,
              productTitle: product.title ?? "Pantalón Sastrero",
              colorName: "Negro",
              size: "M",
              quantity: 1,
              unitPriceCents: 5000000,
            },
          ],
        },
        env.deps
      );

      // Email no coincide
      await expect(
        createOrderClaim(
          {
            orderCode: orderResult.order.code,
            customerName: "Desconocido",
            customerDni: "40123456",
            customerEmail: "intruso@hacker.com",
            customerPhone: "1155558888",
            conditionAccepted: true,
          },
          env.deps
        )
      ).rejects.toThrow("no coincide con los datos registrados");

      // Teléfono no coincide
      await expect(
        createOrderClaim(
          {
            orderCode: orderResult.order.code,
            customerName: "Desconocido",
            customerDni: "40123456",
            customerEmail: "valeria@example.com",
            customerPhone: "1199990000",
            conditionAccepted: true,
          },
          env.deps
        )
      ).rejects.toThrow("no coincide con los datos registrados");
    });

    it("bloquea arrepentimiento o cambios si la prenda es de Venta Final (allowReturn === false)", async () => {
      // Crear prenda con allowReturn === false (como productos personalizados de Adidas)
      const finalSaleProduct = await createProduct(
        {
          rawText: "Top Edición Especial Archivo $30.000",
          allowReturn: false,
          colors: [{ name: "Blanco", position: 0, sizes: [{ size: "S", stock: 1 }] }],
        },
        env.deps
      );

      const orderResult = await createOrder(
        {
          customerName: "Lucía Fernández",
          customerPhone: "1144445555",
          customerEmail: "lucia@example.com",
          customerDni: "38999888",
          deliveryMethod: "PICKUP",
          items: [
            {
              productCode: finalSaleProduct.code,
              productTitle: finalSaleProduct.title ?? "Top Edición Especial Archivo",
              colorName: "Blanco",
              size: "S",
              quantity: 1,
              unitPriceCents: 3000000,
            },
          ],
        },
        env.deps
      );

      await expect(
        createOrderClaim(
          {
            orderCode: orderResult.order.code,
            customerName: "Lucía Fernández",
            customerDni: "38999888",
            contactValue: "lucia@example.com",
            conditionAccepted: true,
          },
          env.deps
        )
      ).rejects.toThrow("Venta Final (sin cambios ni devoluciones)");
    });

    it("crea exitosamente la solicitud de arrepentimiento y genera código de trámite", async () => {
      const product = await createProduct(
        {
          rawText: "Blazer Lino $70.000",
          allowReturn: true,
          colors: [{ name: "Beige", position: 0, sizes: [{ size: "L", stock: 2 }] }],
        },
        env.deps
      );

      const orderResult = await createOrder(
        {
          customerName: "Sofía Martínez",
          customerPhone: "1122334455",
          customerEmail: "sofia@example.com",
          customerDni: "35123456",
          deliveryMethod: "PICKUP",
          items: [
            {
              productCode: product.code,
              productTitle: product.title ?? "Blazer Lino",
              colorName: "Beige",
              size: "L",
              quantity: 1,
              unitPriceCents: 7000000,
            },
          ],
        },
        env.deps
      );

      const claim = await createOrderClaim(
        {
          orderCode: orderResult.order.code,
          customerName: "Sofía Martínez",
          customerDni: "35123456",
          contactValue: "sofia@example.com",
          conditionAccepted: true,
          reason: "El talle me quedó un poco holgado.",
        },
        env.deps
      );

      expect(claim).toBeDefined();
      expect(claim.orderId).toBe(orderResult.order.id);
      expect(claim.status).toBe("PENDING");
      expect(claim.claimCode).toMatch(/^REV-/);
      expect(claim.conditionAccepted).toBe(true);

      // Si intenta crear otro reclamo para la misma orden, se rechaza
      await expect(
        createOrderClaim(
          {
            orderCode: orderResult.order.code,
            customerName: "Sofía Martínez",
            customerDni: "35123456",
            contactValue: "sofia@example.com",
            conditionAccepted: true,
          },
          env.deps
        )
      ).rejects.toThrow("Ya existe una solicitud activa");
    });
  });

  describe("Anidamiento con la Orden en Backoffice (getOrderById & listOrders)", () => {
    it("incluye el objeto claim anidado en la orden para que el comercio no se maree", async () => {
      const product = await createProduct(
        {
          rawText: "Kimono Seda $40.000",
          colors: [{ name: "Verde", position: 0, sizes: [{ size: "U", stock: 1 }] }],
        },
        env.deps
      );

      const orderResult = await createOrder(
        {
          customerName: "Agustina Paz",
          customerPhone: "1166778899",
          customerEmail: "agustina@example.com",
          customerDni: "37456789",
          deliveryMethod: "PICKUP",
          items: [
            {
              productCode: product.code,
              productTitle: product.title ?? "Kimono Seda",
              colorName: "Verde",
              size: "U",
              quantity: 1,
              unitPriceCents: 4000000,
            },
          ],
        },
        env.deps
      );

      // Antes del reclamo, claim es null
      const orderBefore = await getOrderById(orderResult.order.id, env.deps);
      expect(orderBefore.claim).toBeNull();

      // Crea el reclamo
      const claim = await createOrderClaim(
        {
          orderCode: orderResult.order.code,
          customerName: "Agustina Paz",
          customerDni: "37456789",
          contactValue: "agustina@example.com",
          conditionAccepted: true,
          type: "EXCHANGE",
        },
        env.deps
      );
      expect(claim.claimCode).toMatch(/^CAM-/);

      // Al buscar por ID o por Código, la orden trae el reclamo anidado
      const orderAfter = await getOrderById(orderResult.order.id, env.deps);
      expect(orderAfter.claim).toBeDefined();
      expect(orderAfter.claim?.id).toBe(claim.id);
      expect(orderAfter.claim?.status).toBe("PENDING");

      const orderByCode = await getOrderByCode(orderResult.order.code, env.deps);
      expect(orderByCode.claim?.claimCode).toBe(claim.claimCode);

      // En el listado general de órdenes para el backoffice también viene anidado
      const allOrders = await listOrders(env.deps);
      const foundInList = allOrders.find((o) => o.id === orderResult.order.id);
      expect(foundInList?.claim?.claimCode).toBe(claim.claimCode);
    });
  });

  describe("Control de Calidad e Inspección en Backoffice (inspectOrderClaim)", () => {
    it("Aprobar y Recircular Stock: cancela la orden y restaura el stock automáticamente", async () => {
      // 1. Crear producto con stock 1
      const product = await createProduct(
        {
          rawText: "Vestido Gala $90.000",
          colors: [{ name: "Rojo", position: 0, sizes: [{ size: "M", stock: 1 }] }],
        },
        env.deps
      );

      // 2. Orden compra la única unidad -> producto pasa a stock 0 / SOLD_OUT
      const orderResult = await createOrder(
        {
          customerName: "Elena Blanco",
          customerPhone: "1199887766",
          customerEmail: "elena@example.com",
          customerDni: "32111222",
          deliveryMethod: "PICKUP",
          items: [
            {
              productCode: product.code,
              productTitle: product.title ?? "Vestido Gala",
              colorName: "Rojo",
              size: "M",
              quantity: 1,
              unitPriceCents: 9000000,
            },
          ],
        },
        env.deps
      );

      // Verificar que el producto quedó en SOLD_OUT y stock 0
      const prodAfterOrder = await env.deps.productRepo.findById(product.id);
      expect(prodAfterOrder?.status).toBe("SOLD_OUT");
      const sizeMOrdered = prodAfterOrder?.colors?.[0].sizes.find((s) => s.size === "M");
      expect(sizeMOrdered?.stock).toBe(0);

      // 3. Cliente genera solicitud de arrepentimiento
      const claim = await createOrderClaim(
        {
          orderCode: orderResult.order.code,
          customerName: "Elena Blanco",
          customerDni: "32111222",
          contactValue: "elena@example.com",
          conditionAccepted: true,
        },
        env.deps
      );

      // 4. Backoffice inspecciona la prenda y la APRUEBA
      const inspection = await inspectOrderClaim(
        claim.id,
        {
          decision: "APPROVE_RESTOCK",
          adminNotes: "Prenda devuelta intacta con etiquetas y sin manchas.",
        },
        env.deps
      );

      expect(inspection.claim.status).toBe("APPROVED_RESTOCKED");
      expect(inspection.claim.resolvedAt).toBeDefined();

      // 5. Verificar que la orden pasó a CANCELLED
      const orderFinal = await getOrderById(orderResult.order.id, env.deps);
      expect(orderFinal.status).toBe("CANCELLED");

      // 6. Verificar que el stock se restauró y el producto volvió a AVAILABLE
      const prodAfterRestock = await env.deps.productRepo.findById(product.id);
      expect(prodAfterRestock?.status).toBe("AVAILABLE");
      const sizeMRestored = prodAfterRestock?.colors?.[0].sizes.find((s) => s.size === "M");
      expect(sizeMRestored?.stock).toBe(1);
    });

    it("Rechazar por Manchas / Uso: no cancela la orden y NO recircula el stock", async () => {
      // 1. Crear producto con stock 1
      const product = await createProduct(
        {
          rawText: "Mono Seda $60.000",
          colors: [{ name: "Azul", position: 0, sizes: [{ size: "S", stock: 1 }] }],
        },
        env.deps
      );

      // 2. Orden compra la unidad
      const orderResult = await createOrder(
        {
          customerName: "Paula Rossi",
          customerPhone: "1155443322",
          customerEmail: "paula@example.com",
          customerDni: "39888777",
          deliveryMethod: "PICKUP",
          items: [
            {
              productCode: product.code,
              productTitle: product.title ?? "Mono Seda",
              colorName: "Azul",
              size: "S",
              quantity: 1,
              unitPriceCents: 6000000,
            },
          ],
        },
        env.deps
      );

      // Confirmar orden para que no esté pendiente
      await updateOrderStatus(orderResult.order.id, "CONFIRMED", env.deps);

      // 3. Cliente genera solicitud de arrepentimiento
      const claim = await createOrderClaim(
        {
          orderCode: orderResult.order.code,
          customerName: "Paula Rossi",
          customerDni: "39888777",
          contactValue: "paula@example.com",
          conditionAccepted: true,
        },
        env.deps
      );

      // 4. Backoffice inspecciona y rechaza por manchas de maquillaje
      const inspection = await inspectOrderClaim(
        claim.id,
        {
          decision: "REJECT_CONDITION",
          rejectionReason: "La prenda presenta manchas de maquillaje en el cuello y no tiene la etiqueta original.",
          adminNotes: "Foto adjunta en expediente interno.",
        },
        env.deps
      );

      expect(inspection.claim.status).toBe("REJECTED_CONDITION");
      expect(inspection.claim.rejectionReason).toContain("manchas de maquillaje");

      // 5. La orden NO se cancela, sigue en CONFIRMED
      const orderFinal = await getOrderById(orderResult.order.id, env.deps);
      expect(orderFinal.status).toBe("CONFIRMED");

      // 6. El stock NO se restaura, sigue en 0 y SOLD_OUT
      const prodFinal = await env.deps.productRepo.findById(product.id);
      expect(prodFinal?.status).toBe("SOLD_OUT");
      const sizeSFinal = prodFinal?.colors?.[0].sizes.find((s) => s.size === "S");
      expect(sizeSFinal?.stock).toBe(0);
    });
  });
});
