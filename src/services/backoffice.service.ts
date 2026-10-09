import { SYSTEM_UNCATEGORIZED_SLUG } from "../domain/category/types";
import { ProductNotFoundError } from "../domain/errors";
import { BackofficeSummaryCounts } from "../domain/ports/repositories.port";
import { Product, StatusHistoryEntry, StatusSource } from "../domain/product/types";
import { changeProductStatus, ProductServiceDeps } from "./product.service";

/**
 * BR-36: Obtiene los contadores del resumen de Backoffice:
 * disponibles, reservadas, agotadas, por vencer, sin clasificar y sin precio.
 */
export async function getBackofficeSummary(
  deps: ProductServiceDeps,
  now: number = Date.now()
): Promise<BackofficeSummaryCounts> {
  const { productRepo, categoryRepo } = deps;

  let uncategorizedCategoryId = 0;
  const uncategorized = await categoryRepo.findBySlug(SYSTEM_UNCATEGORIZED_SLUG);
  if (uncategorized) {
    uncategorizedCategoryId = uncategorized.id;
  }

  return productRepo.getSummaryCounts(uncategorizedCategoryId, now);
}

/**
 * BR-28: Deshace el cambio de estado más reciente de una prenda volviendo
 * a su estado anterior y registrando la reversión en el historial de auditoría.
 */
export async function undoProductStatusChange(
  productId: number,
  source: StatusSource = "web",
  deps: ProductServiceDeps
): Promise<Product> {
  const { productRepo, statusHistoryRepo } = deps;

  const product = await productRepo.findById(productId);
  if (!product) {
    throw new ProductNotFoundError(productId);
  }

  const history = await statusHistoryRepo.listByProductId(productId);
  if (!history || history.length === 0) {
    throw new Error("No hay registros en el historial para este producto.");
  }

  const latestEntry = history[0];
  const previousStatus = latestEntry.fromStatus;

  if (!previousStatus) {
    throw new Error("No hay un estado previo al cual revertir esta prenda.");
  }

  // Ejecuta la transición de reversión mediante el servicio oficial
  return changeProductStatus(
    {
      productId,
      newStatus: previousStatus,
      source,
    },
    deps
  );
}

/**
 * BR-28: Obtiene el historial completo de cambios de estado de una prenda.
 */
export async function getProductStatusHistory(
  productId: number,
  deps: ProductServiceDeps
): Promise<StatusHistoryEntry[]> {
  const { statusHistoryRepo } = deps;
  return statusHistoryRepo.listByProductId(productId);
}
