import { beforeEach, describe, expect, it } from "vitest";
import {
  createCategory,
  deleteCategory,
  getCategoryTree,
  reorderCategories,
  updateCategory,
} from "../src/services/category.service";
import { createProduct } from "../src/services/product.service";
import { createTestEnvironment } from "./setup-db";
import {
  CategoryHierarchyError,
  ProtectedCategoryError,
} from "../src/domain/errors";

describe("Servicios de Categorías (BR-15, BR-17, BR-18, BR-19, BR-38, BR-39)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  it("obtiene el árbol de categorías con conteo de prendas y visitas (BR-15, BR-39)", async () => {
    const { deps } = env;

    const tree = await getCategoryTree(deps);
    expect(tree.length).toBeGreaterThan(0);

    // Debe contener las raíces sembradas (ej. Prendas, Calzado, Accesorios, Sin clasificar)
    const garmentsRoot = tree.find((c) => c.slug === "prendas");
    expect(garmentsRoot).toBeDefined();
    expect(garmentsRoot!.parentId).toBeNull();
    expect(garmentsRoot!.children.length).toBeGreaterThan(0);

    // Las subcategorías deben tener parentId === garmentsRoot.id
    for (const sub of garmentsRoot!.children) {
      expect(sub.parentId).toBe(garmentsRoot!.id);
      expect(sub.children.length).toBe(0); // Máximo 2 niveles (BR-15)
    }
  });

  it("crea una nueva categoría raíz con slug generado y orden posicional (BR-15, BR-38)", async () => {
    const { deps } = env;

    const created = await createCategory(
      {
        name: "Lencería & Pijamas",
        isHidden: false,
      },
      deps
    );

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Lencería & Pijamas");
    expect(created.slug).toBe("lenceria-pijamas"); // Normalizado sin tildes ni caracteres especiales
    expect(created.parentId).toBeNull();
    expect(created.position).toBeGreaterThan(0);
  });

  it("crea una subcategoría bajo un padre raíz y respeta BR-15 (máx 2 niveles)", async () => {
    const { deps } = env;

    const calzado = await deps.categoryRepo.findBySlug("calzado");
    expect(calzado).toBeDefined();

    const sub = await createCategory(
      {
        name: "Zapatillas Urbanas",
        parentId: calzado!.id,
      },
      deps
    );

    expect(sub.parentId).toBe(calzado!.id);
    expect(sub.slug).toBe("zapatillas-urbanas");

    // Intentar crear una subcategoría debajo de la subcategoría recién creada debe arrojar CategoryHierarchyError
    await expect(
      createCategory(
        {
          name: "Zapatillas Bajas",
          parentId: sub.id,
        },
        deps
      )
    ).rejects.toThrow(CategoryHierarchyError);
  });

  it("impide agregar subcategorías a una categoría que tiene prendas directas (BR-18)", async () => {
    const { deps } = env;

    // Crear una categoría raíz sin subcategorías
    const joyeria = await createCategory(
      {
        name: "Joyería Fina",
      },
      deps
    );

    // Asignarle una prenda directa
    await createProduct(
      {
        rawText: "Collar oro 18k $120.000",
        title: "Collar Oro",
        priceCents: 12000000,
        categoryId: joyeria.id,
      },
      deps
    );

    // Intentar crearle una subcategoría debe fallar según BR-18
    await expect(
      createCategory(
        {
          name: "Anillos",
          parentId: joyeria.id,
        },
        deps
      )
    ).rejects.toThrow(ProtectedCategoryError);
  });

  it("renombra una categoría sin modificar su slug garantizando links estables (BR-38)", async () => {
    const { deps } = env;

    const cat = await createCategory(
      {
        name: "Carteras y Bolsos",
      },
      deps
    );
    expect(cat.slug).toBe("carteras-y-bolsos");

    const updated = await updateCategory(
      cat.id,
      {
        name: "Carteras, Bolsos y Mochilas",
      },
      deps
    );

    expect(updated.name).toBe("Carteras, Bolsos y Mochilas");
    expect(updated.slug).toBe("carteras-y-bolsos"); // ¡El slug NO cambia! (BR-38)
  });

  it("impide renombrar o eliminar la categoría del sistema 'Sin clasificar' (BR-19)", async () => {
    const { deps } = env;

    const uncategorized = await deps.categoryRepo.findBySlug("sin-clasificar");
    expect(uncategorized).toBeDefined();

    // Renombrar debe fallar
    await expect(
      updateCategory(
        uncategorized!.id,
        {
          name: "General",
        },
        deps
      )
    ).rejects.toThrow(ProtectedCategoryError);

    // Eliminar debe fallar
    await expect(
      deleteCategory(uncategorized!.id, undefined, deps)
    ).rejects.toThrow(ProtectedCategoryError);
  });

  it("impide eliminar una categoría con subcategorías (BR-18)", async () => {
    const { deps } = env;

    const garments = await deps.categoryRepo.findBySlug("prendas");
    expect(garments).toBeDefined();

    await expect(
      deleteCategory(garments!.id, undefined, deps)
    ).rejects.toThrow(ProtectedCategoryError);
  });

  it("impide eliminar una categoría con prendas si no se especifica reasignación (BR-18)", async () => {
    const { deps } = env;

    const cat = await createCategory(
      {
        name: "Bufandas",
      },
      deps
    );

    await createProduct(
      {
        rawText: "Bufanda lana $15.000",
        categoryId: cat.id,
      },
      deps
    );

    await expect(
      deleteCategory(cat.id, undefined, deps)
    ).rejects.toThrow(ProtectedCategoryError);
  });

  it("elimina una categoría reasignando sus prendas a otra categoría válida (BR-18, BR-15)", async () => {
    const { deps } = env;

    const catOrigen = await createCategory({ name: "Cinturones" }, deps);
    const catDestino = await createCategory({ name: "Billeteras" }, deps);

    // Crear prenda en categoría de origen
    const product = await createProduct(
      {
        rawText: "Cinturón cuero $20.000",
        categoryId: catOrigen.id,
      },
      deps
    );
    expect(product.categoryId).toBe(catOrigen.id);

    // Eliminar con reasignación
    const result = await deleteCategory(catOrigen.id, catDestino.id, deps);
    expect(result.deletedId).toBe(catOrigen.id);
    expect(result.reassignedProductsCount).toBe(1);

    // Verificar que la prenda ahora pertenezca a la categoría de destino
    const updatedProduct = await deps.productRepo.findById(product.id);
    expect(updatedProduct!.categoryId).toBe(catDestino.id);

    // Verificar que la categoría de origen ya no existe
    const deletedCat = await deps.categoryRepo.findById(catOrigen.id);
    expect(deletedCat).toBeNull();
  });

  it("reordena posiciones de categorías (BR-17)", async () => {
    const { deps } = env;

    const c1 = await createCategory({ name: "Alfa" }, deps);
    const c2 = await createCategory({ name: "Beta" }, deps);

    await reorderCategories(
      [
        { id: c1.id, position: 20 },
        { id: c2.id, position: 10 },
      ],
      deps
    );

    const refetched1 = await deps.categoryRepo.findById(c1.id);
    const refetched2 = await deps.categoryRepo.findById(c2.id);

    expect(refetched1!.position).toBe(20);
    expect(refetched2!.position).toBe(10);
  });
});
