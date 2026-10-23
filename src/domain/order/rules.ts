import { ValidationError } from "../errors";
import { CreateOrderInput, DeliveryMethod, OrderStatus } from "./types";
import { isValidPaymentMethod, PaymentMethod } from "../payment";

/**
 * Formatea el código correlativo de orden: ej 1 -> "#ORD-001"
 */
export function formatOrderCode(code: number): string {
  return `#ORD-${code.toString().padStart(3, "0")}`;
}

/**
 * Parsea un código de orden textual o numérico: ej "#ORD-001", "ORD-001", "001", "1" -> 1
 */
export function parseOrderCode(input: string): number | null {
  if (!input) return null;
  const trimmed = input.trim();
  const match = trimmed.match(/^#?(?:ORD-?)?(\d+)$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return Number.isNaN(num) || num <= 0 ? null : num;
}

/**
 * Normaliza y valida una orden de compra antes de ser persistida (BR-40, BR-41, BR-42, BR-47)
 */
export function validateCreateOrderInput(input: CreateOrderInput): {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerDni: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  deliveryNotes: string | null;
  subtotalCents: number;
  discountCents: number;
  paymentDiscountCents: number;
  shippingCents: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  couponCode: string | null;
  customerId: number | null;
  commerceId: number | null;
  transferReceiptUrl?: string | null;
  transferReceiptUploadedAt?: number | null;
  idempotencyKey?: string | null;
  notes: string | null;
} {
  const customerName = input.customerName?.trim();
  if (!customerName || customerName.length < 2) {
    throw new ValidationError("El nombre del comprador es obligatorio.");
  }

  const customerPhone = input.customerPhone?.trim();
  const digits = customerPhone ? customerPhone.replace(/\D/g, "") : "";
  if (!digits || digits.length < 6) {
    throw new ValidationError("Ingresá un número de teléfono o WhatsApp válido.");
  }

  const customerEmail = input.customerEmail?.trim().toLowerCase();
  if (!customerEmail || !customerEmail.includes("@") || customerEmail.length < 5) {
    throw new ValidationError("El email de contacto es obligatorio y debe tener un formato válido.");
  }

  const cleanDni = input.customerDni ? input.customerDni.replace(/\D/g, "") : "";
  if (!cleanDni || cleanDni.length < 6) {
    throw new ValidationError("El DNI del titular es obligatorio y debe tener al menos 6 dígitos.");
  }

  const validMethods: DeliveryMethod[] = ["HOME_DELIVERY", "MOTORCYCLE", "PICKUP"];
  if (!validMethods.includes(input.deliveryMethod)) {
    throw new ValidationError("El método de entrega seleccionado no es válido.");
  }

  const deliveryAddress = input.deliveryAddress?.trim() || null;
  if ((input.deliveryMethod === "HOME_DELIVERY" || input.deliveryMethod === "MOTORCYCLE") && !deliveryAddress) {
    throw new ValidationError("La dirección de entrega es obligatoria para envíos a domicilio o motomensajería.");
  }

  if (!input.items || input.items.length === 0) {
    throw new ValidationError("El carrito debe contener al menos un producto para generar la orden.");
  }

  let subtotal = 0;
  for (const item of input.items) {
    if (!item.quantity || item.quantity <= 0) {
      throw new ValidationError(`La cantidad para ${item.productTitle} debe ser al menos 1.`);
    }
    if (item.unitPriceCents < 0) {
      throw new ValidationError(`El precio para ${item.productTitle} no puede ser negativo.`);
    }
    subtotal += item.quantity * item.unitPriceCents;
  }

  const shippingCents = Math.max(0, input.shippingCents || 0);
  const discountCents = Math.max(0, input.discountCents || 0);
  const paymentDiscountCents = Math.max(0, input.paymentDiscountCents || 0);
  const totalCents = Math.max(0, subtotal - discountCents - paymentDiscountCents + shippingCents);

  let paymentMethod: PaymentMethod = "WHATSAPP";
  if (input.paymentMethod && isValidPaymentMethod(input.paymentMethod)) {
    paymentMethod = input.paymentMethod;
  }

  let transferReceiptUrl: string | null = null;
  let transferReceiptUploadedAt: number | null = null;
  if (input.transferReceiptUrl && input.transferReceiptUrl.trim()) {
    let clean = input.transferReceiptUrl.trim();
    if (clean.startsWith("data:")) {
      if (!clean.startsWith("data:application/pdf;base64,")) {
        throw new ValidationError("Solo se admiten comprobantes en formato PDF.");
      }
      clean = clean.replace("data:application/pdf;base64,", "");
    }
    const binarySize = Math.floor((clean.length * 3) / 4);
    if (binarySize > 10 * 1024 * 1024) {
      throw new ValidationError("El comprobante PDF supera el tamaño máximo permitido de 10 MB.");
    }
    transferReceiptUrl = input.transferReceiptUrl.startsWith("data:")
      ? input.transferReceiptUrl.trim()
      : `data:application/pdf;base64,${clean}`;
    transferReceiptUploadedAt = input.transferReceiptUploadedAt || Math.floor(Date.now() / 1000);
  }

  return {
    customerName,
    customerPhone,
    customerEmail,
    customerDni: cleanDni,
    deliveryMethod: input.deliveryMethod,
    deliveryAddress,
    deliveryNotes: input.deliveryNotes?.trim() || null,
    subtotalCents: subtotal,
    discountCents,
    paymentDiscountCents,
    shippingCents,
    totalCents,
    paymentMethod,
    couponCode: input.couponCode?.trim().toUpperCase() || null,
    customerId: input.customerId ?? null,
    commerceId: input.commerceId ?? null,
    transferReceiptUrl,
    transferReceiptUploadedAt,
    idempotencyKey: input.idempotencyKey?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

/**
 * Valida transiciones de estado de orden
 */
export function isValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  if (from === "CANCELLED") return false;
  if (from === "PAID" && to !== "CANCELLED") return false;
  return true;
}

/**
 * Sanitiza una orden antes de responderla al cliente o serializarla en JSON.
 * Si el comprobante de transferencia contiene un Base64 pesado, lo reemplaza
 * por la URL limpia del endpoint de descarga (/api/orders/:id/receipt).
 */
export function sanitizeOrderForResponse(order: Order): Order {
  if (!order.transferReceiptUrl) return order;
  if (order.transferReceiptUrl.startsWith("data:") || order.transferReceiptUrl.length > 500) {
    return {
      ...order,
      transferReceiptUrl: `/api/orders/${order.id}/receipt`,
    };
  }
  return order;
}
