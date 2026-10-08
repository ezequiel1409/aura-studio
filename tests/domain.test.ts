import { describe, expect, it } from "vitest";
import {
  calculateSoldOutAt,
  canTransitionStatus,
  formatProductCode,
  parseProductCode,
  validateStatusTransition,
} from "../src/domain/product/rules";
import {
  validateCategoryDeletion,
  validateCategoryDepth,
  validateCategoryRename,
} from "../src/domain/category/rules";
import {
  CategoryHierarchyError,
  InvalidStatusTransitionError,
  ProtectedCategoryError,
} from "../src/domain/errors";
import { Category, SYSTEM_UNCATEGORIZED_SLUG } from "../src/domain/category/types";

describe("Product Code Rules (BR-01, BR-24)", () => {
  it("formatea códigos numéricos con padding (#001, #024)", () => {
    expect(formatProductCode(1)).toBe("#001");
    expect(formatProductCode(24)).toBe("#024");
    expect(formatProductCode(105)).toBe("#105");
  });

  it("arroja error si el código no es un entero positivo", () => {
    expect(() => formatProductCode(0)).toThrow();
    expect(() => formatProductCode(-5)).toThrow();
  });

  it("parsea códigos desde distintos formatos (#023, 023, 23) para búsqueda directa (BR-24)", () => {
    expect(parseProductCode("#023")).toBe(23);
    expect(parseProductCode("023")).toBe(23);
    expect(parseProductCode("23")).toBe(23);
    expect(parseProductCode("#1")).toBe(1);
    expect(parseProductCode("remera")).toBeNull();
    expect(parseProductCode("")).toBeNull();
  });
});

describe("Status Transitions Rules (BR-02, BR-03)", () => {
  it("permite transiciones válidas según BR-02", () => {
    // AVAILABLE ↔ RESERVED
    expect(canTransitionStatus("AVAILABLE", "RESERVED")).toBe(true);
    expect(canTransitionStatus("RESERVED", "AVAILABLE")).toBe(true);

    // AVAILABLE | RESERVED → SOLD_OUT
    expect(canTransitionStatus("AVAILABLE", "SOLD_OUT")).toBe(true);
    expect(canTransitionStatus("RESERVED", "SOLD_OUT")).toBe(true);

    // SOLD_OUT → AVAILABLE (reactivación)
    expect(canTransitionStatus("SOLD_OUT", "AVAILABLE")).toBe(true);
  });

  it("rechaza transiciones inválidas arrojando InvalidStatusTransitionError (BR-02)", () => {
    // SOLD_OUT → RESERVED no está permitido
    expect(canTransitionStatus("SOLD_OUT", "RESERVED")).toBe(false);
    expect(() => validateStatusTransition("SOLD_OUT", "RESERVED")).toThrow(
      InvalidStatusTransitionError
    );
  });

  it("gestiona sold_out_at: asigna ahora en SOLD_OUT y null en reactivación (BR-03)", () => {
    const now = 1700000000000;

    // Al pasar a SOLD_OUT
    expect(calculateSoldOutAt("AVAILABLE", "SOLD_OUT", now)).toBe(now);
    expect(calculateSoldOutAt("RESERVED", "SOLD_OUT", now)).toBe(now);

    // Al reactivar de SOLD_OUT a AVAILABLE se limpia
    expect(calculateSoldOutAt("SOLD_OUT", "AVAILABLE", now)).toBeNull();
  });
});

describe("Category Domain Rules (BR-15, BR-18, BR-19)", () => {
  it("valida la profundidad máxima de 2 niveles (Categoría → Subcategoría) (BR-15)", () => {
    const rootCategory: Category = {
      id: 1,
      parentId: null,
      name: "Prendas",
      slug: "prendas",
      position: 1,
      isHidden: false,
      isSystem: false,
    };

    const subCategory: Category = {
      id: 2,
      parentId: 1,
      name: "Remeras",
      slug: "remeras",
      position: 1,
      isHidden: false,
      isSystem: false,
    };

    // Subcategoría bajo raíz es válido
    expect(() => validateCategoryDepth(rootCategory)).not.toThrow();

    // Intentar agregar una sub-subcategoría bajo una que ya tiene parentId lanza error
    expect(() =>
      validateCategoryDepth(subCategory)
    ).toThrow(CategoryHierarchyError);
  });

  it("impide eliminar categorías con productos o subcategorías (BR-18)", () => {
    const cat: Category = {
      id: 5,
      parentId: 1,
      name: "Vestidos",
      slug: "vestidos",
      position: 1,
      isHidden: false,
      isSystem: false,
    };

    // Si tiene productos
    expect(() => validateCategoryDeletion(cat, 3, 0)).toThrow(ProtectedCategoryError);

    // Si tiene subcategorías
    expect(() => validateCategoryDeletion(cat, 0, 2)).toThrow(ProtectedCategoryError);

    // Vacía se permite
    expect(() => validateCategoryDeletion(cat, 0, 0)).not.toThrow();
  });

  it("impide eliminar o renombrar la categoría de sistema 'Sin clasificar' (BR-19)", () => {
    const uncategorized: Category = {
      id: 99,
      parentId: null,
      name: "Sin clasificar",
      slug: SYSTEM_UNCATEGORIZED_SLUG,
      position: 999,
      isHidden: false,
      isSystem: true,
    };

    expect(() => validateCategoryDeletion(uncategorized, 0, 0)).toThrow(
      ProtectedCategoryError
    );

    expect(() => validateCategoryRename(uncategorized, "Otro nombre")).toThrow(
      ProtectedCategoryError
    );

    expect(() => validateCategoryRename(uncategorized, "Sin clasificar")).not.toThrow();
  });
});
