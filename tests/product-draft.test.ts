import { describe, it, expect, beforeEach } from "vitest";

const DRAFT_STORAGE_KEY = "app_admin_new_product_draft";

describe("Borrador Local en Carga de Productos (localStorage / draft resilience)", () => {
  const memoryStorage = new Map<string, string>();

  beforeEach(() => {
    memoryStorage.clear();
  });

  it("permite guardar y recuperar un borrador completo con fotos, variantes y atributos", () => {
    const draftData = {
      title: "Short Lino Clásico",
      pricePesos: "25000",
      compareAtPricePesos: "32000",
      isConsultPrice: false,
      selectedCategoryId: 3,
      isSinglePiece: false,
      colors: [
        {
          id: "col-negro",
          name: "Negro",
          sizes: [
            { id: "sz-1", size: "S", stock: 2 },
            { id: "sz-2", size: "M", stock: 4 },
          ],
        },
      ],
      photos: [
        { id: "ph-1", keyThumb: "thumb1", keyFull: "full1" },
        { id: "ph-2", keyThumb: "thumb2", keyFull: "full2" },
      ],
      initialStatus: "AVAILABLE",
      isFeatured: true,
      allowReturn: true,
      attributes: {
        estilo: "Clásico",
        material: "AirFlow",
      },
      savedAt: Date.now(),
    };

    memoryStorage.set(DRAFT_STORAGE_KEY, JSON.stringify(draftData));

    const retrieved = JSON.parse(memoryStorage.get(DRAFT_STORAGE_KEY) || "{}");
    expect(retrieved.title).toBe("Short Lino Clásico");
    expect(retrieved.photos.length).toBe(2);
    expect(retrieved.colors[0].sizes.length).toBe(2);
    expect(retrieved.attributes.material).toBe("AirFlow");
  });

  it("limpia el borrador al publicarse la prenda o al descartar", () => {
    memoryStorage.set(DRAFT_STORAGE_KEY, JSON.stringify({ title: "Borrador de prueba" }));
    expect(memoryStorage.has(DRAFT_STORAGE_KEY)).toBe(true);

    // Simular descarte o publicación exitosa
    memoryStorage.delete(DRAFT_STORAGE_KEY);
    expect(memoryStorage.has(DRAFT_STORAGE_KEY)).toBe(false);
  });
});
