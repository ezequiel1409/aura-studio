import { CategoryHierarchyError, ProtectedCategoryError } from "../errors";
import { Category, SYSTEM_UNCATEGORIZED_SLUG } from "./types";

/**
 * BR-15: Jerarquía de dos niveles: Categoría → Subcategoría.
 * Valida que una subcategoría no pueda ser padre de otra categoría (profundidad máx 2).
 */
export function validateCategoryDepth(
  targetParent: Category | null
): void {
  if (!targetParent) return; // Nivel raíz, permitido

  // Si el padre ya tiene un parentId, sería un tercer nivel
  if (targetParent.parentId !== null) {
    throw new CategoryHierarchyError(
      "La jerarquía máxima permitida es de 2 niveles: Categoría → Subcategoría (BR-15)"
    );
  }
}

/**
 * BR-18: No se puede eliminar una categoría que tenga prendas o subcategorías.
 */
export function validateCategoryDeletion(
  category: Category,
  productsCount: number,
  subcategoriesCount: number
): void {
  if (category.isSystem || category.slug === SYSTEM_UNCATEGORIZED_SLUG) {
    throw new ProtectedCategoryError(
      "La categoría del sistema 'Sin clasificar' no puede ser eliminada (BR-19)"
    );
  }

  if (productsCount > 0) {
    throw new ProtectedCategoryError(
      `No se puede eliminar la categoría '${category.name}' porque contiene ${productsCount} prenda(s)/producto(s). Reasigne los productos primero (BR-18).`
    );
  }

  if (subcategoriesCount > 0) {
    throw new ProtectedCategoryError(
      `No se puede eliminar la categoría '${category.name}' porque contiene ${subcategoriesCount} subcategoría(s). Elimine o mueva las subcategorías primero (BR-18).`
    );
  }
}

/**
 * BR-19: Valida que no se intente renombrar la categoría del sistema.
 */
export function validateCategoryRename(category: Category, newName: string): void {
  if (category.isSystem && category.name !== newName) {
    throw new ProtectedCategoryError(
      "La categoría del sistema 'Sin clasificar' no puede ser renombrada (BR-19)"
    );
  }
}

/**
 * BR-18: Una categoría con prendas directas no puede recibir subcategorías hasta reasignar esas prendas.
 */
export function validateParentCanHaveSubcategories(
  parentProductsCount: number,
  parentName: string
): void {
  if (parentProductsCount > 0) {
    throw new ProtectedCategoryError(
      `La categoría '${parentName}' tiene ${parentProductsCount} prenda(s) directa(s). Reasigne esas prendas antes de asignarle subcategorías (BR-18).`
    );
  }
}

/**
 * BR-38: Genera un slug normalizado para una categoría.
 * El slug se genera al crear y no cambia al renombrar.
 */
export function generateCategorySlug(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "categoria";
}
