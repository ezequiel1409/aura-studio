import { CartItem } from "./types";

/**
 * Genera una clave única compuesta para una variante de producto en el carrito (BR-40)
 */
export function buildCartItemKey(productCode: number, colorName: string, size: string): string {
  const normColor = (colorName || "único").trim().toLowerCase();
  const normSize = (size || "único").trim().toUpperCase();
  return `${productCode}__${normColor}__${normSize}`;
}

/**
 * Limita la cantidad requerida al stock máximo existente en inventario (BR-40)
 * Nunca permite menos de 1 ni más que maxStock (salvo que maxStock sea 0).
 * Seguro contra undefined, null o NaN en stock o cantidad.
 */
export function clampCartQuantity(desiredQty: number, maxStock: number): number {
  const stock = typeof maxStock === "number" && !Number.isNaN(maxStock) ? maxStock : 99;
  if (stock <= 0) return 0;
  const qty = typeof desiredQty === "number" && !Number.isNaN(desiredQty) ? desiredQty : 1;
  if (qty < 1) return 1;
  return Math.min(qty, stock);
}

/**
 * Suma total de unidades en el carrito
 */
export function countCartItems(items: CartItem[]): number {
  return items.reduce((acc, item) => {
    const qty = typeof item.quantity === "number" && !Number.isNaN(item.quantity) ? item.quantity : 1;
    return acc + Math.max(0, qty);
  }, 0);
}

/**
 * Subtotal en centavos del carrito
 */
export function calculateCartSubtotalCents(items: CartItem[]): number {
  return items.reduce((acc, item) => {
    const qty = typeof item.quantity === "number" && !Number.isNaN(item.quantity) ? item.quantity : 1;
    const unitPrice = typeof item.unitPriceCents === "number" && !Number.isNaN(item.unitPriceCents) ? item.unitPriceCents : 0;
    if (unitPrice > 0) {
      return acc + qty * unitPrice;
    }
    return acc;
  }, 0);
}
