import { ValidationError } from "../errors";
import { CreateOrderInput, DeliveryMethod, OrderStatus } from "./types";

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
 * Normaliza y valida una orden de compra antes de ser persistida (BR-40, BR-41, BR-42)
 */
export function validateCreateOrderInput(input: CreateOrderInput): {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  deliveryNotes: string | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponCode: string | null;
  customerId: number | null;
  commerceId: number | null;
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
  const totalCents = Math.max(0, subtotal - discountCents + shippingCents);

  return {
    customerName,
    customerPhone,
    customerEmail: input.customerEmail?.trim() || null,
    deliveryMethod: input.deliveryMethod,
    deliveryAddress,
    deliveryNotes: input.deliveryNotes?.trim() || null,
    subtotalCents: subtotal,
    discountCents,
    shippingCents,
    totalCents,
    couponCode: input.couponCode?.trim().toUpperCase() || null,
    customerId: input.customerId ?? null,
    commerceId: input.commerceId ?? null,
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
