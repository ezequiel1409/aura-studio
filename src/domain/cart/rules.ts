import { CartItem, CartPriceChangeNotice, CartServerItemSnapshot } from "./types";

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

/**
 * Sincroniza silenciosamente el estado local del carrito contra el snapshot vigente del servidor.
 * Optimizado en memoria: si ningún ítem cambió de stock, cantidad, título ni precio,
 * preserva la misma referencia de array (`updatedItems === items`) evitando re-renders e I/O en localStorage.
 */
export function reconcileCartWithServer(
  items: CartItem[],
  snapshots: Record<string, number | CartServerItemSnapshot>
): {
  updatedItems: CartItem[];
  priceChanges: CartPriceChangeNotice[];
  hasChanges: boolean;
} {
  if (items.length === 0) {
    return { updatedItems: items, priceChanges: [], hasChanges: false };
  }

  let clonedItems: CartItem[] | null = null;
  const priceChanges: CartPriceChangeNotice[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const currentQty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
    const entry = snapshots[item.key];

    if (entry === undefined) {
      if (currentQty !== item.quantity) {
        if (!clonedItems) clonedItems = items.slice(0, i);
        clonedItems.push({ ...item, quantity: currentQty });
      } else if (clonedItems) {
        clonedItems.push(item);
      }
      continue;
    }

    const isNumericEntry = typeof entry === "number";
    const rawStock = isNumericEntry ? entry : entry.remainingStock;
    const newMax = Number.isFinite(rawStock) ? Math.max(0, rawStock) : 0;
    const newQty = newMax <= 0 ? 1 : clampCartQuantity(currentQty, newMax);

    const rawServerPrice = isNumericEntry ? undefined : entry.unitPriceCents;
    const hasServerPrice =
      rawServerPrice !== undefined &&
      rawServerPrice !== null &&
      Number.isFinite(rawServerPrice) &&
      rawServerPrice > 0;
    const newPrice = hasServerPrice ? Math.round(rawServerPrice!) : item.unitPriceCents;
    const newTitle = !isNumericEntry && entry.title ? entry.title : item.title;

    const priceChanged = hasServerPrice && item.unitPriceCents !== newPrice;
    if (priceChanged) {
      priceChanges.push({
        key: item.key,
        code: item.code,
        formattedCode: item.formattedCode,
        title: newTitle,
        previousPriceCents: item.unitPriceCents,
        currentPriceCents: newPrice!,
      });
    }

    const itemMutated =
      item.maxStock !== newMax ||
      item.quantity !== newQty ||
      item.unitPriceCents !== newPrice ||
      item.title !== newTitle;

    if (itemMutated) {
      if (!clonedItems) clonedItems = items.slice(0, i);
      clonedItems.push({
        ...item,
        title: newTitle,
        maxStock: newMax,
        quantity: newQty,
        unitPriceCents: newPrice,
      });
    } else if (clonedItems) {
      clonedItems.push(item);
    }
  }

  return {
    updatedItems: clonedItems ?? items,
    priceChanges,
    hasChanges: clonedItems !== null,
  };
}
