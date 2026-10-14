import { CartItem } from "./types";

/**
 * Genera una clave única compuesta para una variante de producto en el carrito (BR-40)
 */
export function buildCartItemKey(productCode: number, colorName: string, size: string): string {
  const normColor = colorName.trim().toLowerCase();
  const normSize = size.trim().toUpperCase();
  return `${productCode}__${normColor}__${normSize}`;
}

/**
 * Limita la cantidad requerida al stock máximo existente en inventario (BR-40)
 * Nunca permite menos de 1 ni más que maxStock (salvo que maxStock sea 0).
 */
export function clampCartQuantity(desiredQty: number, maxStock: number): number {
  if (maxStock <= 0) return 0;
  if (desiredQty < 1) return 1;
  return Math.min(desiredQty, maxStock);
}

/**
 * Suma total de unidades en el carrito
 */
export function countCartItems(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity, 0);
}

/**
 * Subtotal en centavos del carrito
 */
export function calculateCartSubtotalCents(items: CartItem[]): number {
  return items.reduce((acc, item) => {
    if (item.unitPriceCents && item.unitPriceCents > 0) {
      return acc + item.quantity * item.unitPriceCents;
    }
    return acc;
  }, 0);
}
