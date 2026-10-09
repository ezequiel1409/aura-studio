import { CategoryNotFoundError, ProductNotFoundError } from "../domain/errors";
import {
  ICategoryRepository,
  ICounterRepository,
  IProductRepository,
  ISettingsRepository,
  IStatusHistoryRepository,
} from "../domain/ports/repositories.port";
import {
  calculateSoldOutAt,
  calculateTotalStock,
  deriveStatusFromStock,
  validateStatusTransition,
} from "../domain/product/rules";
import {
  CreateProductInput,
  ListProductsFilter,
  PaginatedResult,
  Product,
  ProductStatus,
  StatusSource,
  UpdateProductInput,
} from "../domain/product/types";
import { SYSTEM_UNCATEGORIZED_SLUG } from "../domain/category/types";
import { parseProductText, parseSizesList } from "../lib/parser/product-parser";
import { sanitizePlainText } from "../lib/parser/sanitize";

export interface ProductServiceDeps {
  productRepo: IProductRepository;
  categoryRepo: ICategoryRepository;
  statusHistoryRepo: IStatusHistoryRepository;
  counterRepo: ICounterRepository;
  settingsRepo?: ISettingsRepository;
}

export interface ChangeProductStatusInput {
  productId: number;
  newStatus: ProductStatus;
  source?: StatusSource;
  reservationHours?: number;
}

/**
 * BR-01, BR-05, BR-06, BR-19, BR-20, BR-26, BR-33, BR-39
 * Crea un nuevo producto con código único correlativo atómico, texto crudo original,
 * enriquecimiento mediante parser (sin bloquear), y categoría por defecto "Sin clasificar".
 */
export async function createProduct(
  input: CreateProductInput,
  deps: ProductServiceDeps
): Promise<Product> {
  const { productRepo, categoryRepo, statusHistoryRepo, counterRepo } = deps;

  // 1. Sanitizar texto de entrada y preservar texto crudo (BR-05, BR-06)
  const sanitizedRaw = sanitizePlainText(input.rawText);

  // 2. Parseo para proponer campos si no fueron provistos manualmente (BR-05, BR-26)
  const parsed = parseProductText(sanitizedRaw);

  const manualFields: string[] = [];

  const title = input.title !== undefined
    ? (manualFields.push("title"), input.title)
    : parsed.title;

  const priceCents = input.priceCents !== undefined
    ? (manualFields.push("priceCents"), input.priceCents)
    : parsed.priceCents;

  const currency = input.currency || parsed.currency || "ARS";

  const size = input.size !== undefined
    ? (manualFields.push("size"), input.size)
    : parsed.size;

  // 3. Resolución de categoría (BR-19: "Sin clasificar" por defecto)
  let categoryId = input.categoryId;
  if (categoryId !== undefined) {
    manualFields.push("categoryId");
    const existingCategory = await categoryRepo.findById(categoryId);
    if (!existingCategory) {
      throw new CategoryNotFoundError(categoryId);
    }
  } else if (parsed.suggestedCategorySlug) {
    const suggested = await categoryRepo.findBySlug(parsed.suggestedCategorySlug);
    if (suggested) {
      categoryId = suggested.id;
    }
  }

  // Si aún no tiene categoría, asignar "Sin clasificar" (BR-19)
  if (!categoryId) {
    const uncategorized = await categoryRepo.findBySlug(SYSTEM_UNCATEGORIZED_SLUG);
    if (!uncategorized) {
      throw new Error("La categoría del sistema 'Sin clasificar' no está inicializada (BR-19).");
    }
    categoryId = uncategorized.id;
  }

  // 4. Preparación de colores y talles con stock (BR-05, BR-20)
  let colorsData = input.colors;
  if (!colorsData || colorsData.length === 0) {
    const rawSizes = size || parsed.size;
    const sizesList = parseSizesList(rawSizes);
    const resolvedSizes = sizesList.length > 0 ? sizesList : ["ÚNICO"];
    colorsData = [
      {
        name: "Único",
        hexCode: null,
        position: 0,
        sizes: resolvedSizes.map((s) => ({
          size: s,
          stock: 1,
          reservedStock: 0,
        })),
      },
    ];
  }

  // 5. Generación atómica del código correlativo (BR-01)
  const nextCode = await counterRepo.getNextSequence("product_code");

  const now = Date.now();

  // Calcular stock total para determinar estado inicial si corresponde
  const totalStock = calculateTotalStock(colorsData);
  const initialStatus: ProductStatus = totalStock === 0 ? "SOLD_OUT" : "AVAILABLE";
  const initialSoldOutAt = initialStatus === "SOLD_OUT" ? now : null;

  // 6. Creación del producto en base de datos
  const photosData = (input.photos || []).map((p, idx) => ({
    keyThumb: p.keyThumb,
    keyFull: p.keyFull,
    productColorId: p.productColorId || null,
    position: p.position ?? idx,
  }));

  const created = await productRepo.create({
    code: nextCode,
    rawText: input.rawText, // texto crudo original garantizado
    title,
    priceCents,
    currency,
    size,
    categoryId,
    status: initialStatus,
    isFeatured: Boolean(input.isFeatured),
    soldOutAt: initialSoldOutAt,
    reservedUntil: null,
    manualFields,
    createdAt: now,
    updatedAt: now,
    colors: colorsData.map((c, idx) => ({
      name: c.name,
      hexCode: c.hexCode || null,
      position: c.position ?? idx,
      sizes: (c.sizes || []).map((s) => ({
        size: s.size,
        stock: s.stock ?? 0,
        reservedStock: s.reservedStock ?? 0,
      })),
    })),
    photos: photosData,
  });

  // 7. Auditoría de estado inicial en status_history (BR-28)
  await statusHistoryRepo.record({
    productId: created.id,
    productCode: created.code,
    fromStatus: null,
    toStatus: initialStatus,
    at: now,
    source: input.source || "web",
  });

  return created;
}

/**
 * BR-16, BR-21, BR-23, BR-24
 * Lista productos con filtros, orden y paginación.
 * Si se filtra por categoría padre, incluye automáticamente todas sus subcategorías (BR-16).
 */
export async function listProducts(
  filter: ListProductsFilter,
  deps: ProductServiceDeps
): Promise<PaginatedResult<Product>> {
  const { productRepo, categoryRepo } = deps;

  let categoryIdsToInclude: number[] | undefined = undefined;

  if (filter.categoryId) {
    const subcategories = await categoryRepo.findSubcategories(filter.categoryId);
    if (subcategories.length > 0) {
      // BR-16: Padre incluye hijas
      categoryIdsToInclude = [
        filter.categoryId,
        ...subcategories.map((s) => s.id),
      ];
    } else {
      categoryIdsToInclude = [filter.categoryId];
    }
  }

  return productRepo.list(filter, categoryIdsToInclude);
}

/**
 * BR-02, BR-03, BR-28, BR-30
 * Modifica el estado de un producto validando transiciones de dominio,
 * gestionando fechas de agotado/reactivación y registrando en el historial de auditoría.
 */
export async function changeProductStatus(
  input: ChangeProductStatusInput,
  deps: ProductServiceDeps
): Promise<Product> {
  const { productRepo, statusHistoryRepo, settingsRepo } = deps;

  const product = await productRepo.findById(input.productId);
  if (!product) {
    throw new ProductNotFoundError(input.productId);
  }

  // 1. Validar transición de estado (BR-02)
  validateStatusTransition(product.status, input.newStatus);

  const now = Date.now();

  // 2. Calcular sold_out_at (BR-03)
  const soldOutAt = calculateSoldOutAt(product.status, input.newStatus, now);

  // 3. Calcular reserved_until (BR-30)
  let reservedUntil: number | null = null;
  if (input.newStatus === "RESERVED") {
    let hours = input.reservationHours;
    if (!hours && settingsRepo) {
      const stored = await settingsRepo.get("reservation_hours");
      if (stored) hours = parseInt(stored, 10);
    }
    const finalHours = hours && !Number.isNaN(hours) ? hours : 48;
    reservedUntil = now + finalHours * 60 * 60 * 1000;
  }

  // 4. Actualizar producto
  const updated = await productRepo.update(product.id, {
    status: input.newStatus,
    soldOutAt,
    reservedUntil,
    updatedAt: now,
  });

  // 5. Registrar en historial de auditoría (BR-28)
  await statusHistoryRepo.record({
    productId: product.id,
    productCode: product.code,
    fromStatus: product.status,
    toStatus: input.newStatus,
    at: now,
    source: input.source || "web",
  });

  return updated;
}

/**
 * BR-02, BR-03, BR-15, BR-20, BR-28, BR-33
 * Edición completa de una prenda.
 * Al editar el texto crudo se vuelve a interpretar, pero NO se pisan los datos corregidos a mano (manualFields).
 */
export async function updateProduct(
  id: number,
  input: UpdateProductInput,
  deps: ProductServiceDeps
): Promise<Product> {
  const { productRepo, categoryRepo, statusHistoryRepo } = deps;

  const existing = await productRepo.findById(id);
  if (!existing) {
    throw new ProductNotFoundError(id);
  }

  const manualFields = new Set<string>(existing.manualFields || []);

  let rawText = existing.rawText;
  let parsed = null;

  if (input.rawText !== undefined) {
    const sanitizedRaw = sanitizePlainText(input.rawText);
    rawText = sanitizedRaw;
    parsed = parseProductText(sanitizedRaw);
  }

  // Título: Si se pasa explícito en input, es manual.
  // Si no se pasa explícito pero se editó rawText: si NO era manual, adopta parsed.title
  let title = existing.title;
  if (input.title !== undefined) {
    manualFields.add("title");
    title = input.title;
  } else if (parsed && !manualFields.has("title") && parsed.title) {
    title = parsed.title;
  }

  // Precio: Si se pasa explícito en input, es manual.
  // Si no se pasa explícito pero se editó rawText: si NO era manual, adopta parsed.priceCents
  let priceCents = existing.priceCents;
  if (input.priceCents !== undefined) {
    manualFields.add("priceCents");
    priceCents = input.priceCents;
  } else if (parsed && !manualFields.has("priceCents") && parsed.priceCents !== null) {
    priceCents = parsed.priceCents;
  }

  const currency = input.currency || existing.currency || "ARS";

  // Talle: Si se pasa explícito en input, es manual.
  let size = existing.size;
  if (input.size !== undefined) {
    manualFields.add("size");
    size = input.size;
  } else if (parsed && !manualFields.has("size") && parsed.size) {
    size = parsed.size;
  }

  // Categoría: Si se pasa explícito en input, validar y es manual.
  let categoryId = existing.categoryId;
  if (input.categoryId !== undefined) {
    manualFields.add("categoryId");
    const cat = await categoryRepo.findById(input.categoryId);
    if (!cat) {
      throw new CategoryNotFoundError(input.categoryId);
    }
    // BR-15: Las prendas deben pertenecer a un nodo hoja
    const subcategories = await categoryRepo.findSubcategories(cat.id);
    if (subcategories.length > 0) {
      throw new Error(
        `La categoría '${cat.name}' contiene subcategorías. Las prendas solo pueden asignarse a subcategorías o nodos hoja (BR-15).`
      );
    }
    categoryId = cat.id;
  } else if (parsed && !manualFields.has("categoryId") && parsed.suggestedCategorySlug) {
    const suggested = await categoryRepo.findBySlug(parsed.suggestedCategorySlug);
    if (suggested) {
      const subcategories = await categoryRepo.findSubcategories(suggested.id);
      if (subcategories.length === 0) {
        categoryId = suggested.id;
      }
    }
  }

  const now = Date.now();

  // Colores y talles con cálculo de stock total
  let colorsData = undefined;
  let totalStock = 0;
  if (input.colors !== undefined) {
    colorsData = input.colors.map((c, idx) => ({
      name: c.name,
      hexCode: c.hexCode || null,
      position: c.position ?? idx,
      sizes: (c.sizes || []).map((s) => ({
        size: s.size,
        stock: s.stock ?? 0,
        reservedStock: s.reservedStock ?? 0,
      })),
    }));
    totalStock = calculateTotalStock(colorsData);
  } else {
    totalStock = calculateTotalStock(existing.colors);
  }

  // Estado: derivación automática por stock o transición explícita
  let targetStatus = existing.status;
  if (input.status !== undefined) {
    targetStatus = input.status;
  } else if (input.colors !== undefined) {
    targetStatus = deriveStatusFromStock(totalStock, existing.status);
  }

  let soldOutAt = existing.soldOutAt;
  let reservedUntil = existing.reservedUntil;

  if (targetStatus !== existing.status) {
    validateStatusTransition(existing.status, targetStatus);
    soldOutAt = calculateSoldOutAt(existing.status, targetStatus, now);
    if (targetStatus !== "RESERVED") {
      reservedUntil = null;
    }

    await statusHistoryRepo.record({
      productId: existing.id,
      productCode: existing.code,
      fromStatus: existing.status,
      toStatus: targetStatus,
      at: now,
      source: input.source || "web",
    });
  }

  // Fotos
  let photosData = undefined;
  if (input.photos !== undefined) {
    photosData = input.photos.map((p, idx) => ({
      keyThumb: p.keyThumb,
      keyFull: p.keyFull,
      position: p.position ?? idx,
      productColorId: p.productColorId || null,
    }));
  }

  const updated = await productRepo.update(id, {
    rawText,
    title,
    priceCents,
    currency,
    size,
    categoryId,
    status: targetStatus,
    isFeatured: input.isFeatured !== undefined ? Boolean(input.isFeatured) : undefined,
    soldOutAt,
    reservedUntil,
    manualFields: Array.from(manualFields),
    updatedAt: now,
    colors: colorsData,
    photos: photosData,
  });

  return updated;
}

/**
 * BR-34: Eliminación manual de una prenda y sus datos asociados.
 * El código correlativo nunca se reutiliza (BR-01).
 */
export async function deleteProduct(
  id: number,
  deps: ProductServiceDeps
): Promise<void> {
  const { productRepo } = deps;
  const existing = await productRepo.findById(id);
  if (!existing) {
    throw new ProductNotFoundError(id);
  }
  await productRepo.delete(id);
}

/**
 * BR-29: Acciones en lote - Marcar estado de múltiples prendas.
 */
export async function bulkChangeProductStatus(
  input: { productIds: number[]; newStatus: ProductStatus; source?: StatusSource },
  deps: ProductServiceDeps
): Promise<{ updatedCount: number; errors: Array<{ productId: number; error: string }> }> {
  let updatedCount = 0;
  const errors: Array<{ productId: number; error: string }> = [];

  for (const id of input.productIds) {
    try {
      await changeProductStatus(
        {
          productId: id,
          newStatus: input.newStatus,
          source: input.source || "web",
        },
        deps
      );
      updatedCount += 1;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar estado";
      errors.push({ productId: id, error: msg });
    }
  }

  return { updatedCount, errors };
}

/**
 * BR-29: Acciones en lote - Mover múltiples prendas a una categoría de destino.
 */
export async function bulkMoveProductCategory(
  input: { productIds: number[]; targetCategoryId: number },
  deps: ProductServiceDeps
): Promise<{ updatedCount: number }> {
  const { productRepo, categoryRepo } = deps;

  const targetCategory = await categoryRepo.findById(input.targetCategoryId);
  if (!targetCategory) {
    throw new CategoryNotFoundError(input.targetCategoryId);
  }

  // BR-15: Solo a categorías hoja
  const subcategories = await categoryRepo.findSubcategories(targetCategory.id);
  if (subcategories.length > 0) {
    throw new Error(
      `La categoría '${targetCategory.name}' contiene subcategorías. Las prendas solo pueden asignarse a subcategorías o nodos hoja (BR-15).`
    );
  }

  await productRepo.bulkUpdateCategory(input.productIds, targetCategory.id, Date.now());

  return { updatedCount: input.productIds.length };
}

/**
 * BR-29, BR-34: Acciones en lote - Eliminar múltiples prendas con confirmación.
 */
export async function bulkDeleteProducts(
  input: { productIds: number[] },
  deps: ProductServiceDeps
): Promise<{ deletedCount: number }> {
  const { productRepo } = deps;

  await productRepo.bulkDelete(input.productIds);

  return { deletedCount: input.productIds.length };
}

/**
 * Alternar el estado de destacado de una prenda (para catálogo y backoffice).
 */
export async function toggleProductFeatured(
  productId: number,
  deps: ProductServiceDeps
): Promise<Product> {
  const { productRepo } = deps;
  const product = await productRepo.findById(productId);
  if (!product) {
    throw new ProductNotFoundError(productId);
  }
  return productRepo.update(productId, {
    isFeatured: !product.isFeatured,
    updatedAt: Date.now(),
  });
}

/**
 * Acciones en lote - Marcar/desmarcar prendas como destacadas.
 */
export async function bulkSetProductFeatured(
  input: { productIds: number[]; isFeatured: boolean },
  deps: ProductServiceDeps
): Promise<{ updatedCount: number; errors: Array<{ productId: number; error: string }> }> {
  let updatedCount = 0;
  const errors: Array<{ productId: number; error: string }> = [];

  for (const id of input.productIds) {
    try {
      await deps.productRepo.update(id, {
        isFeatured: input.isFeatured,
        updatedAt: Date.now(),
      });
      updatedCount++;
    } catch (err: unknown) {
      errors.push({
        productId: id,
        error: err instanceof Error ? err.message : "Error al actualizar",
      });
    }
  }

  return { updatedCount, errors };
}

// Aliases para compatibilidad con nomenclaturas del roadmap
export const createGarment = createProduct;
export const listGarments = listProducts;
export const changeStatus = changeProductStatus;
export const updateGarment = updateProduct;
export const deleteGarment = deleteProduct;

