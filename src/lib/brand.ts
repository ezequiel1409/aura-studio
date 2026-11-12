export const DEFAULT_NEUTRAL_BRAND = "Mi Tienda";

export function getDefaultBrandName(): string {
  const raw =
    (typeof process !== "undefined" ? process.env.COMMERCE_NAME : undefined) ||
    (typeof process !== "undefined" ? process.env.DEFAULT_BRAND_NAME : undefined) ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_COMMERCE_NAME : undefined);
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_NEUTRAL_BRAND;
}

export function getPlatformOperatorName(): string | null {
  const raw =
    (typeof process !== "undefined" ? process.env.PLATFORM_OPERATOR_NAME : undefined) ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_PLATFORM_OPERATOR_NAME : undefined);
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function formatStatementDescriptor(brandName?: string | null): string {
  const source = (brandName?.trim() || getDefaultBrandName())
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return (source || "MI TIENDA").slice(0, 22);
}
