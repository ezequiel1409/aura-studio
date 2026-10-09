import {
  generateCategorySlug,
  validateCategoryDepth,
  validateCategoryRename,
  validateParentCanHaveSubcategories,
} from "../domain/category/rules";
import { Category, SYSTEM_UNCATEGORIZED_SLUG } from "../domain/category/types";
import {
  CategoryHierarchyError,
  CategoryNotFoundError,
  ProtectedCategoryError,
  ValidationError,
} from "../domain/errors";
import { ICategoryRepository, IProductRepository } from "../domain/ports/repositories.port";

export interface CategoryServiceDeps {
  categoryRepo: ICategoryRepository;
  productRepo: IProductRepository;
}

export interface CategoryTreeNode extends Category {
  productsCount: number;
  viewsCount: number;
  children: CategoryTreeNode[];
}

export interface CreateCategoryInput {
  name: string;
  parentId?: number | null;
  isHidden?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  parentId?: number | null;
  isHidden?: boolean;
  position?: number;
}

/**
 * BR-15, BR-17, BR-39:
 * Retorna el árbol completo de categorías y subcategorías (máximo 2 niveles),
 * enriquecido con el conteo de prendas y métricas de visitas por sección.
 */
export async function getCategoryTree(
  deps: CategoryServiceDeps
): Promise<CategoryTreeNode[]> {
  const { categoryRepo, productRepo } = deps;

  const allCategories = await categoryRepo.listAllWithStats();

  // Mapear cada categoría con su conteo de productos
  const nodesMap = new Map<number, CategoryTreeNode>();
  for (const cat of allCategories) {
    const productsCount = await productRepo.countByCategoryId(cat.id);
    nodesMap.set(cat.id, {
      ...cat,
      productsCount,
      viewsCount: cat.stats?.viewsCount ?? 0,
      children: [],
    });
  }

  const rootNodes: CategoryTreeNode[] = [];

  for (const cat of allCategories) {
    const node = nodesMap.get(cat.id)!;
    if (cat.parentId === null) {
      rootNodes.push(node);
    } else {
      const parentNode = nodesMap.get(cat.parentId);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // En caso anómalo sin padre, se muestra como raíz
        rootNodes.push(node);
      }
    }
  }

  // Ordenar cada nivel por posición y luego por nombre
  rootNodes.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  for (const root of rootNodes) {
    root.children.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  }

  return rootNodes;
}

/**
 * BR-15, BR-17, BR-18, BR-38:
 * Crea una nueva categoría o subcategoría.
 * - Respeta profundidad máx 2 (BR-15).
 * - Una categoría con prendas directas no puede recibir subcategorías (BR-18).
 * - Genera slug único y permanente (BR-38).
 */
export async function createCategory(
  input: CreateCategoryInput,
  deps: CategoryServiceDeps
): Promise<Category> {
  const { categoryRepo, productRepo } = deps;

  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new ValidationError("El nombre de la categoría es requerido.");
  }

  let parentId: number | null = null;
  if (input.parentId !== undefined && input.parentId !== null) {
    const parent = await categoryRepo.findById(input.parentId);
    if (!parent) {
      throw new CategoryNotFoundError(input.parentId);
    }

    // Validar jerarquía máxima de 2 niveles (BR-15)
    validateCategoryDepth(parent);

    // BR-18: Si el padre tiene prendas directas, no puede recibir subcategorías
    const directProductsCount = await productRepo.countByCategoryId(parent.id);
    validateParentCanHaveSubcategories(directProductsCount, parent.name);

    parentId = parent.id;
  }

  // Generar slug base y garantizar unicidad (BR-38)
  const baseSlug = generateCategorySlug(trimmedName);
  let slug = baseSlug;
  let counter = 1;
  while (await categoryRepo.findBySlug(slug)) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  // Calcular posición (última del nivel)
  const siblings = parentId !== null
    ? await categoryRepo.findSubcategories(parentId)
    : (await categoryRepo.listAll()).filter((c) => c.parentId === null);

  const maxPosition = siblings.reduce((max, s) => Math.max(max, s.position), 0);
  const position = maxPosition + 1;

  return categoryRepo.create({
    parentId,
    name: trimmedName,
    slug,
    position,
    isHidden: Boolean(input.isHidden),
    isSystem: false,
  });
}

/**
 * BR-17, BR-18, BR-19, BR-38:
 * Actualiza una categoría existente (renombrar, cambiar padre, visibilidad, posición).
 * - Al renombrar, el slug NO cambia (BR-38: links estables).
 * - "Sin clasificar" no se puede renombrar (BR-19).
 * - Validaciones de jerarquía y reubicación (BR-15, BR-18).
 */
export async function updateCategory(
  id: number,
  input: UpdateCategoryInput,
  deps: CategoryServiceDeps
): Promise<Category> {
  const { categoryRepo, productRepo } = deps;

  const category = await categoryRepo.findById(id);
  if (!category) {
    throw new CategoryNotFoundError(id);
  }

  const updateData: Partial<Omit<Category, "id">> = {};

  // 1. Renombrar
  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new ValidationError("El nombre de la categoría no puede estar vacío.");
    }
    // BR-19: La categoría del sistema no se puede renombrar
    validateCategoryRename(category, trimmedName);
    updateData.name = trimmedName;
    // Nota BR-38: updateData.slug NUNCA se modifica para garantizar URLs estables
  }

  // 2. Mover a otro padre
  if (input.parentId !== undefined) {
    if (input.parentId === category.id) {
      throw new CategoryHierarchyError("Una categoría no puede ser su propio padre.");
    }

    if (input.parentId === null) {
      updateData.parentId = null;
    } else {
      // Si la categoría tiene subcategorías, no puede pasar a ser hija (crearía nivel 3, BR-15)
      const subcategories = await categoryRepo.findSubcategories(category.id);
      if (subcategories.length > 0) {
        throw new CategoryHierarchyError(
          "Una categoría con subcategorías no puede convertirse en subcategoría (BR-15: máximo 2 niveles)."
        );
      }

      const targetParent = await categoryRepo.findById(input.parentId);
      if (!targetParent) {
        throw new CategoryNotFoundError(input.parentId);
      }

      validateCategoryDepth(targetParent);

      // BR-18: Si el padre de destino tiene prendas directas, no puede recibir subcategorías
      const targetProductsCount = await productRepo.countByCategoryId(targetParent.id);
      validateParentCanHaveSubcategories(targetProductsCount, targetParent.name);

      updateData.parentId = targetParent.id;
    }
  }

  // 3. Visibilidad
  if (input.isHidden !== undefined) {
    updateData.isHidden = Boolean(input.isHidden);
  }

  // 4. Posición
  if (input.position !== undefined) {
    updateData.position = input.position;
  }

  return categoryRepo.update(id, updateData);
}

/**
 * BR-18, BR-19:
 * Elimina una categoría de forma protegida.
 * - No se puede eliminar si es la categoría del sistema "Sin clasificar" (BR-19).
 * - No se puede eliminar si tiene subcategorías (BR-18).
 * - Si tiene prendas y no se especifica reasignación, se rechaza ofreciendo moverlas (BR-18).
 * - Si se especifica reassignToCategoryId, todas sus prendas se reasignan atómicamente antes de borrar.
 */
export async function deleteCategory(
  id: number,
  reassignToCategoryId: number | undefined,
  deps: CategoryServiceDeps
): Promise<{ deletedId: number; reassignedProductsCount: number }> {
  const { categoryRepo, productRepo } = deps;

  const category = await categoryRepo.findById(id);
  if (!category) {
    throw new CategoryNotFoundError(id);
  }

  // BR-19: Protección de categoría de sistema
  if (category.isSystem || category.slug === SYSTEM_UNCATEGORIZED_SLUG) {
    throw new ProtectedCategoryError(
      "La categoría del sistema 'Sin clasificar' no puede ser eliminada (BR-19)."
    );
  }

  // BR-18: Protección contra subcategorías
  const subcategories = await categoryRepo.findSubcategories(id);
  if (subcategories.length > 0) {
    throw new ProtectedCategoryError(
      `No se puede eliminar la categoría '${category.name}' porque contiene ${subcategories.length} subcategoría(s). Elimine o mueva las subcategorías primero (BR-18).`
    );
  }

  // BR-18: Protección contra prendas directas
  const productsCount = await productRepo.countByCategoryId(id);
  let reassignedCount = 0;

  if (productsCount > 0) {
    if (!reassignToCategoryId) {
      throw new ProtectedCategoryError(
        `No se puede eliminar la categoría '${category.name}' porque contiene ${productsCount} prenda(s). Reasigne las prendas a otra categoría primero (BR-18).`
      );
    }

    if (reassignToCategoryId === id) {
      throw new ValidationError("No puede reasignar las prendas a la misma categoría que desea eliminar.");
    }

    const destinationCategory = await categoryRepo.findById(reassignToCategoryId);
    if (!destinationCategory) {
      throw new CategoryNotFoundError(reassignToCategoryId);
    }

    // BR-15: Las prendas solo pueden asignarse a nodos hoja
    const destSubcategories = await categoryRepo.findSubcategories(destinationCategory.id);
    if (destSubcategories.length > 0) {
      throw new CategoryHierarchyError(
        `La categoría de destino '${destinationCategory.name}' contiene subcategorías. Las prendas solo pueden asignarse a subcategorías u hojas (BR-15).`
      );
    }

    // Reasignar prendas a la categoría destino
    reassignedCount = await productRepo.reassignCategory(id, destinationCategory.id);
  }

  // Eliminar la categoría
  await categoryRepo.delete(id);

  return {
    deletedId: id,
    reassignedProductsCount: reassignedCount,
  };
}

/**
 * BR-17:
 * Reordena una lista de categorías actualizando sus posiciones.
 */
export async function reorderCategories(
  orderedItems: Array<{ id: number; position: number }>,
  deps: CategoryServiceDeps
): Promise<void> {
  const { categoryRepo } = deps;

  for (const item of orderedItems) {
    await categoryRepo.update(item.id, { position: item.position });
  }
}
