import { beforeEach, describe, expect, it } from "vitest";
import { useBackofficeStore } from "../src/stores/backoffice.store";

describe("Tienda Global Zustand useBackofficeStore (AR-10, BR-29)", () => {
  beforeEach(() => {
    useBackofficeStore.getState().clearSelection();
    useBackofficeStore.getState().closeModal();
    useBackofficeStore.getState().closeBulkAction();
    useBackofficeStore.getState().setSearchQuery("");
    useBackofficeStore.getState().setActiveTab("todas");
  });

  it("permite seleccionar y deseleccionar prendas de forma reactiva (BR-29)", () => {
    const store = useBackofficeStore.getState();

    expect(store.selectedProductIds).toEqual([]);
    expect(store.isProductSelected(1)).toBe(false);

    // Seleccionar prenda 1
    store.toggleProductSelection(1);
    expect(useBackofficeStore.getState().selectedProductIds).toEqual([1]);
    expect(useBackofficeStore.getState().isProductSelected(1)).toBe(true);

    // Seleccionar prenda 2
    store.toggleProductSelection(2);
    expect(useBackofficeStore.getState().selectedProductIds).toEqual([1, 2]);

    // Deseleccionar prenda 1
    store.toggleProductSelection(1);
    expect(useBackofficeStore.getState().selectedProductIds).toEqual([2]);
    expect(useBackofficeStore.getState().isProductSelected(1)).toBe(false);
  });

  it("permite seleccionar todas y limpiar la selección (BR-29)", () => {
    const store = useBackofficeStore.getState();

    store.selectAllProducts([10, 20, 30]);
    expect(useBackofficeStore.getState().selectedProductIds).toEqual([10, 20, 30]);

    store.clearSelection();
    expect(useBackofficeStore.getState().selectedProductIds).toEqual([]);
    expect(useBackofficeStore.getState().isBulkActionOpen).toBe(false);
  });

  it("controla el estado de acciones en lote y procesamiento", () => {
    const store = useBackofficeStore.getState();

    store.openBulkAction("status");
    expect(useBackofficeStore.getState().isBulkActionOpen).toBe(true);
    expect(useBackofficeStore.getState().bulkActionType).toBe("status");

    store.setBulkProcessing(true);
    expect(useBackofficeStore.getState().isBulkProcessing).toBe(true);

    store.closeBulkAction();
    expect(useBackofficeStore.getState().isBulkActionOpen).toBe(false);
    expect(useBackofficeStore.getState().bulkActionType).toBeNull();
  });

  it("gestiona el estado de modales con payload", () => {
    const store = useBackofficeStore.getState();

    store.openModal("edit_category", { id: 5, name: "Vestidos" });
    expect(useBackofficeStore.getState().activeModal).toBe("edit_category");
    expect(useBackofficeStore.getState().modalPayload).toEqual({ id: 5, name: "Vestidos" });

    store.closeModal();
    expect(useBackofficeStore.getState().activeModal).toBeNull();
    expect(useBackofficeStore.getState().modalPayload).toBeNull();
  });

  it("mantiene filtros de búsqueda y pestaña en memoria", () => {
    const store = useBackofficeStore.getState();

    store.setSearchQuery("lino");
    store.setActiveTab("disponibles");

    expect(useBackofficeStore.getState().searchQuery).toBe("lino");
    expect(useBackofficeStore.getState().activeTab).toBe("disponibles");
  });
});
