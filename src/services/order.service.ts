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
  for (const item of input.items) {
    if (item.productId) {
      const product = await deps.productRepo.findById(item.productId);
      if (!product) {
        throw new ProductNotFoundError(item.productCode);
      }
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
  }

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
    items: input.items.map((i) => ({
      productId: i.productId ?? null,
      productCode: i.productCode,
      productTitle: i.productTitle,
      colorName: i.colorName,
      size: i.size,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      photoUrl: i.photoUrl ?? null,
    })),
  });

  // 5. Descontar stock físico atómico en base de datos (BR-02, BR-40) y registrar telemetría (BR-39)
  for (const item of input.items) {
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
  return order;
}

export async function getOrderByCode(code: number, deps: GlobalAppDeps): Promise<Order> {
  const order = await deps.orderRepo.findByCode(code);
  if (!order) {
    throw new OrderNotFoundError(formatOrderCode(code));
  }
  return order;
}

export async function listOrders(
  options: { status?: OrderStatus; limit?: number; offset?: number } = {},
  deps: GlobalAppDeps
): Promise<Order[]> {
  return deps.orderRepo.list(options);
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
