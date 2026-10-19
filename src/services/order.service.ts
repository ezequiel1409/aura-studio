import {
  CreateOrderInput,
  Order,
  OrderStatus,
  validateCreateOrderInput,
} from "../domain/order";
import { formatOrderCode } from "../domain/order/rules";
import { GlobalAppDeps } from "../infra/db/connection";
import { ProductNotFoundError, OrderNotFoundError, ValidationError } from "../domain/errors";
import { WhatsAppPaymentAdapter } from "../infra/payments/whatsapp.adapter";
import { getShowroomSettings } from "./settings.service";
import { trackAnalyticsEvent } from "./analytics.service";
import { normalizeEmail, normalizePhone } from "./coupon.service";

/**
 * Caso de uso: Crear Orden de Compra y generar enlace WhatsApp consolidado (BR-40, BR-41, BR-42)
 */
export async function createOrder(
  input: CreateOrderInput,
  deps: GlobalAppDeps
): Promise<{ order: Order; whatsappUrl: string }> {
  // 1. Validar reglas de dominio de orden y comprador (BR-41, BR-42)
  const validated = validateCreateOrderInput(input);

  // 2. Control estricto de inventario (BR-40): verificar existencia y stock de cada ítem
  const resolvedItems = await Promise.all(
    input.items.map(async (item) => {
      let productId = item.productId ?? null;
      let product = null;
      if (productId) {
        product = await deps.productRepo.findById(productId);
      } else if (item.productCode) {
        product = await deps.productRepo.findByCode(item.productCode);
        if (product) {
          productId = product.id;
        }
      }

      if (!product && item.productCode) {
        throw new ProductNotFoundError(item.productCode);
      }

      if (product) {
        if (product.status === "SOLD_OUT") {
          throw new ValidationError(`El producto #${item.productCode} (${item.productTitle}) se encuentra agotado.`);
        }

        // Validar stock específico de la variante si tiene colores y talles
        if (product.colors && product.colors.length > 0) {
          const matchingColor = product.colors.find(
            (c) => c.name.toLowerCase() === item.colorName.toLowerCase()
          );
          if (matchingColor) {
            const matchingSize = matchingColor.sizes.find(
              (s) => s.size.toUpperCase() === item.size.toUpperCase()
            );
            if (matchingSize && matchingSize.stock < item.quantity) {
              throw new ValidationError(
                `El producto #${item.productCode} en ${item.colorName} (${item.size}) solo dispone de ${matchingSize.stock} unidad(es).`
              );
            }
          }
        }
      }

      return {
        ...item,
        productId,
      };
    })
  );

  // 3. Generar número correlativo atómico único (BR-01)
  const nextCode = await deps.counterRepo.getNextSequence("order");
  const now = Math.floor(Date.now() / 1000);

  // 4. Persistir orden y sus ítems en la base de datos
  const order = await deps.orderRepo.create({
    code: nextCode,
    customerId: validated.customerId,
    commerceId: validated.commerceId,
    customerName: validated.customerName,
    customerPhone: validated.customerPhone,
    customerEmail: validated.customerEmail,
    customerDni: validated.customerDni,
    deliveryMethod: validated.deliveryMethod,
    deliveryAddress: validated.deliveryAddress,
    deliveryNotes: validated.deliveryNotes,
    subtotalCents: validated.subtotalCents,
    discountCents: validated.discountCents,
    shippingCents: validated.shippingCents,
    totalCents: validated.totalCents,
    currency: "ARS",
    couponCode: validated.couponCode,
    status: "PENDING",
    notes: validated.notes,
    createdAt: now,
    updatedAt: now,
    items: resolvedItems.map((i) => ({
      productId: i.productId,
      productCode: i.productCode,
      productTitle: i.productTitle,
      colorName: i.colorName,
      size: i.size,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      photoUrl: i.photoUrl ?? null,
    })),
  });

  // 4b. Registrar canje de cupón si aplica (BR-41)
  if (validated.couponCode && deps.couponRepo) {
    try {
      const coupon = await deps.couponRepo.findByCode(validated.couponCode);
      if (coupon) {
        await deps.couponRepo.incrementUsage(coupon.id);
        const cleanEmail = validated.customerEmail ? normalizeEmail(validated.customerEmail) : "";
        const cleanPhone = validated.customerPhone ? normalizePhone(validated.customerPhone) : null;
        const cleanDni = validated.customerDni || null;
        if (cleanEmail || cleanPhone || cleanDni) {
          await deps.couponRepo.recordRedemption({
            couponId: coupon.id,
            orderId: order.id,
            customerEmail: cleanEmail || "cliente@aurastudio.com",
            customerPhone: cleanPhone,
            customerDni: cleanDni,
            customerId: validated.customerId,
            discountCents: validated.discountCents,
          });
        }
      }
    } catch (err) {
      console.error("Error al registrar canje de cupón:", err);
    }
  }

  // 5. Descontar stock físico atómico en base de datos (BR-02, BR-40) y registrar telemetría (BR-39)
  for (const item of resolvedItems) {
    if (item.productId) {
      await deps.productRepo.decrementStock(
        item.productId,
        item.colorName,
        item.size,
        item.quantity,
        now * 1000
      );

      // BR-39: Registrar intención de compra consolidada en métricas
      try {
        await trackAnalyticsEvent(
          {
            type: "whatsapp_click",
            productId: item.productId,
          },
          deps.db
        );
      } catch {
        // Telemetría no bloqueante
      }
    }
  }

  // 6. Generar enlace de WhatsApp estructurado con los datos del showroom (BR-42)
  const settings = await getShowroomSettings(deps);
  const adapter = new WhatsAppPaymentAdapter({
    whatsappNumber: settings.whatsappNumber,
    brandName: settings.showroomName,
  });

  const paymentAction = adapter.createOrderPaymentAction(order, {
    brandName: settings.showroomName,
    showroomAddress: settings.address,
  });

  return {
    order,
    whatsappUrl: paymentAction.url,
  };
}

export async function getOrderById(id: number, deps: GlobalAppDeps): Promise<Order> {
  const order = await deps.orderRepo.findById(id);
  if (!order) {
    throw new OrderNotFoundError(id);
  }
  if (deps.orderClaimRepo) {
    const claim = await deps.orderClaimRepo.findByOrderId(order.id);
    order.claim = claim || null;
  }
  return order;
}

export async function getOrderByCode(code: number, deps: GlobalAppDeps): Promise<Order> {
  const order = await deps.orderRepo.findByCode(code);
  if (!order) {
    throw new OrderNotFoundError(formatOrderCode(code));
  }
  if (deps.orderClaimRepo) {
    const claim = await deps.orderClaimRepo.findByOrderId(order.id);
    order.claim = claim || null;
  }
  return order;
}

export async function listOrders(
  optionsOrDeps: { status?: OrderStatus; limit?: number; offset?: number } | GlobalAppDeps = {},
  maybeDeps?: GlobalAppDeps
): Promise<Order[]> {
  const isDepsFirst = Boolean(optionsOrDeps && "orderRepo" in (optionsOrDeps as object));
  const deps = (isDepsFirst ? optionsOrDeps : maybeDeps) as GlobalAppDeps;
  const options = isDepsFirst ? {} : (optionsOrDeps as { status?: OrderStatus; limit?: number; offset?: number });

  const orders = await deps.orderRepo.list(options);
  if (deps.orderClaimRepo && orders.length > 0) {
    try {
      const allClaims = await deps.orderClaimRepo.listAll();
      const claimByOrderId = new Map(allClaims.map((c) => [c.orderId, c]));
      for (const ord of orders) {
        ord.claim = claimByOrderId.get(ord.id) || null;
      }
    } catch {
      // Ignorar si falla hydrate
    }
  }
  return orders;
}

export async function getOrdersSummaryCounts(
  deps: GlobalAppDeps
): Promise<{ total: number; pending: number }> {
  if (typeof deps.orderRepo.getSummaryCounts === "function") {
    return deps.orderRepo.getSummaryCounts();
  }
  const orders = await deps.orderRepo.list({ limit: 100 });
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
  };
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
  deps: GlobalAppDeps
): Promise<Order> {
  const existing = await deps.orderRepo.findById(id);
  if (!existing) {
    throw new OrderNotFoundError(id);
  }

  const now = Math.floor(Date.now() / 1000);

  // Si pasa a CANCELLED y no estaba cancelada antes, restaurar stock de las prendas
  if (status === "CANCELLED" && existing.status !== "CANCELLED") {
    for (const item of existing.items || []) {
      if (item.productId) {
        await deps.productRepo.restoreStock(
          item.productId,
          item.colorName,
          item.size,
          item.quantity,
          now * 1000
        );
      }
    }
  }

  return deps.orderRepo.updateStatus(id, status, now);
}
