import { InvalidStatusTransitionError } from "../errors";
import { ProductStatus } from "./types";

/**
 * BR-01: Cada prenda recibe un código único y correlativo (#001, #002...).
 */
export function formatProductCode(code: number): string {
  if (code < 1) {
    throw new Error("El código del producto debe ser un entero positivo.");
  }
  return `#${code.toString().padStart(3, "0")}`;
}

/**
 * BR-24: Búsqueda por código. Escribir #023 (o 023 o 23) extrae el código numérico.
 */
export function parseProductCode(input: string): number | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^#?(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return Number.isNaN(num) || num <= 0 ? null : num;
}

/**
 * BR-02: Transiciones de estado permitidas:
 * - AVAILABLE ↔ RESERVED
 * - AVAILABLE | RESERVED → SOLD_OUT
 * - SOLD_OUT → AVAILABLE (reactivación)
 */
export function canTransitionStatus(from: ProductStatus, to: ProductStatus): boolean {
  if (from === to) return true;

  if (from === "AVAILABLE") {
    return to === "RESERVED" || to === "SOLD_OUT";
  }

  if (from === "RESERVED") {
    return to === "AVAILABLE" || to === "SOLD_OUT";
  }

  if (from === "SOLD_OUT") {
    return to === "AVAILABLE";
  }

  return false;
}

/**
 * Valida la transición según BR-02 y arroja InvalidStatusTransitionError si es inválida.
 */
export function validateStatusTransition(from: ProductStatus, to: ProductStatus): void {
  if (!canTransitionStatus(from, to)) {
    throw new InvalidStatusTransitionError(from, to);
  }
}

/**
 * BR-03: Fecha de agotado.
 * Al pasar a SOLD_OUT se guarda sold_out_at = ahora.
 * Al reactivar (a AVAILABLE), se limpia (null).
 */
export function calculateSoldOutAt(
  from: ProductStatus,
  to: ProductStatus,
  now: number
): number | null {
  if (to === "SOLD_OUT") {
    return now;
  }
  if (from === "SOLD_OUT" && to === "AVAILABLE") {
    return null;
  }
  return null;
}

/**
 * BR-02, BR-20: Calcula el stock total sumando todas las combinaciones de color y talle.
 */
export function calculateTotalStock(colors?: Array<{ sizes?: Array<{ stock: number }> }>): number {
  if (!colors || colors.length === 0) return 0;
  return colors.reduce((accColor, color) => {
    const colorTotal = (color.sizes || []).reduce((accSize, s) => accSize + (s.stock || 0), 0);
    return accColor + colorTotal;
  }, 0);
}

/**
 * BR-02: Deriva el estado en base al stock disponible.
 * Si el stock llega a 0, el producto pasa a SOLD_OUT.
 * Si tiene stock y estaba SOLD_OUT, se reactiva a AVAILABLE.
 */
export function deriveStatusFromStock(
  totalStock: number,
  currentStatus: ProductStatus = "AVAILABLE"
): ProductStatus {
  if (totalStock <= 0) {
    return "SOLD_OUT";
  }
  if (currentStatus === "SOLD_OUT" && totalStock > 0) {
    return "AVAILABLE";
  }
  return currentStatus;
}

/**
 * Obtiene la lista ordenada de talles únicos de un conjunto de colores.
 */
export function getDistinctSizes(colors?: Array<{ sizes?: Array<{ size: string }> }>): string[] {
  if (!colors || colors.length === 0) return [];
  const set = new Set<string>();
  for (const color of colors) {
    for (const size of color.sizes || []) {
      if (size.size) set.add(size.size.trim().toUpperCase());
    }
  }
  return Array.from(set);
}


