import { Category } from "../../../../domain/category/types";
import { Product } from "../../../../domain/product/types";
import { PhotoPreview } from "../new/MediaUploaderStep";
import { ColorState } from "../new/StockVariantsStep";

export function parsePricePesosToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed.replace(/,/g, "."));
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export function parseCompareAtPesosToCents(raw: string): number | null {
  const parsed = parsePricePesosToCents(raw);
  return parsed !== null && parsed > 0 ? parsed : null;
}

export function filterLeafCategories(categories: Category[]): Category[] {
  return categories.filter(
    (cat) => !categories.some((child) => child.parentId === cat.id)
  );
}

export function serializeAttributesPayload(
  attributes: Record<string, string>
): Record<string, string[]> {
  const clean: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(attributes)) {
    const trimmed = val?.trim();
    if (trimmed) {
      clean[key] = [trimmed];
    }
  }
  return clean;
}

export function serializeColorsPayload(colors: ColorState[]) {
  return colors.map((col, idx) => ({
    name: col.name.trim() || "Único",
    hexCode: col.hexCode || null,
    position: idx,
    sizes: col.sizes.map((sz) => ({
      size: sz.size.trim() || "ÚNICO",
      stock: Number.isNaN(Number(sz.stock))
        ? 0
        : Math.max(0, Math.trunc(Number(sz.stock))),
    })),
  }));
}

export function serializePhotosPayload(photos: PhotoPreview[]) {
  return photos.map((photo, idx) => ({
    keyThumb: photo.keyThumb,
    keyFull: photo.keyFull,
    position: idx,
  }));
}

export function collectUniqueSizesCsv(colors: ColorState[]): string {
  return Array.from(
    new Set(
      colors.flatMap((col) =>
        col.sizes.map((sz) => sz.size.trim().toUpperCase()).filter(Boolean)
      )
    )
  ).join(", ");
}

export function isSinglePieceVariant(colors: ColorState[]): boolean {
  if (colors.length !== 1) return false;
  const first = colors[0];
  return (
    first.name.trim().toLowerCase() === "único" &&
    (first.sizes?.length ?? 0) <= 1
  );
}

export function productToFormDefaults(product: Product, categories: Category[]) {
  const leafCategories = filterLeafCategories(categories);
  const selectedCategoryId =
    product.categoryId || leafCategories[0]?.id || categories[0]?.id || 1;

  const colors: ColorState[] =
    product.colors && product.colors.length > 0
      ? product.colors.map((c, cIdx) => ({
          id: `c-${c.id || cIdx}`,
          name: c.name,
          hexCode: c.hexCode,
          sizes: (c.sizes || []).map((s, sIdx) => ({
            id: `s-${s.id || sIdx}`,
            size: s.size,
            stock: s.stock,
          })),
        }))
      : [
          {
            id: "default-col",
            name: "Único",
            sizes: [{ id: "default-sz", size: "ÚNICO", stock: 1 }],
          },
        ];

  const photos: PhotoPreview[] = (product.photos || []).map((p, idx) => ({
    id: `photo-${p.id || idx}`,
    keyThumb: p.keyThumb,
    keyFull: p.keyFull,
  }));

  const attributes: Record<string, string> = {};
  for (const [k, v] of Object.entries(product.attributes || {})) {
    attributes[k] = Array.isArray(v) ? v[0] || "" : String(v || "");
  }

  const rawPublishedAt = product.publishedAt || product.createdAt;
  const publishedAtDate = rawPublishedAt
    ? typeof rawPublishedAt === "number"
      ? new Date(rawPublishedAt).toISOString().slice(0, 10)
      : String(rawPublishedAt).slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    rawText: product.rawText || "",
    title: product.title || "",
    pricePesos: product.priceCents !== null ? String(product.priceCents / 100) : "",
    compareAtPricePesos:
      product.compareAtPriceCents && product.compareAtPriceCents > 0
        ? String(product.compareAtPriceCents / 100)
        : "",
    isConsultPrice: product.priceCents === null,
    selectedCategoryId,
    colors,
    photos,
    status: product.status,
    isFeatured: product.isFeatured ?? false,
    allowReturn: product.allowReturn ?? true,
    publishedAtDate,
    attributes,
    isSinglePiece: isSinglePieceVariant(colors),
  };
}
