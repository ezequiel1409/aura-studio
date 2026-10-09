import { create } from "zustand";

export type BulkActionType = "status" | "category" | "delete" | null;
export type BackofficeModalType =
  | "edit_product"
  | "create_category"
  | "edit_category"
  | "delete_category"
  | null;

export interface BackofficeStoreState {
  // Selección múltiple para acciones en lote (BR-29)
  selectedProductIds: number[];

  // Estado de acción en lote
  isBulkActionOpen: boolean;
  bulkActionType: BulkActionType;
  isBulkProcessing: boolean;

  // Filtros rápidos en memoria
  searchQuery: string;
  activeTab: string;

  // Modales interactivos
  activeModal: BackofficeModalType;
  modalPayload: unknown;

  // Acciones de selección (BR-29)
  toggleProductSelection: (productId: number) => void;
  selectProduct: (productId: number) => void;
  unselectProduct: (productId: number) => void;
  selectAllProducts: (productIds: number[]) => void;
  clearSelection: () => void;
  isProductSelected: (productId: number) => boolean;

  // Acciones en lote
  openBulkAction: (actionType: BulkActionType) => void;
  closeBulkAction: () => void;
  setBulkProcessing: (processing: boolean) => void;

  // Filtros rápidos
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: string) => void;

  // Control de modales
  openModal: (modal: BackofficeModalType, payload?: unknown) => void;
  closeModal: () => void;
}

export const useBackofficeStore = create<BackofficeStoreState>((set, get) => ({
  selectedProductIds: [],
  isBulkActionOpen: false,
  bulkActionType: null,
  isBulkProcessing: false,

  searchQuery: "",
  activeTab: "todas",

  activeModal: null,
  modalPayload: null,

  toggleProductSelection: (productId: number) => {
    set((state) => {
      const exists = state.selectedProductIds.includes(productId);
      const updated = exists
        ? state.selectedProductIds.filter((id) => id !== productId)
        : [...state.selectedProductIds, productId];

      return {
        selectedProductIds: updated,
        isBulkActionOpen: updated.length > 0 ? state.isBulkActionOpen : false,
      };
    });
  },

  selectProduct: (productId: number) => {
    set((state) => {
      if (state.selectedProductIds.includes(productId)) return state;
      return { selectedProductIds: [...state.selectedProductIds, productId] };
    });
  },

  unselectProduct: (productId: number) => {
    set((state) => {
      const updated = state.selectedProductIds.filter((id) => id !== productId);
      return {
        selectedProductIds: updated,
        isBulkActionOpen: updated.length > 0 ? state.isBulkActionOpen : false,
      };
    });
  },

  selectAllProducts: (productIds: number[]) => {
    set({ selectedProductIds: Array.from(new Set(productIds)) });
  },

  clearSelection: () => {
    set({
      selectedProductIds: [],
      isBulkActionOpen: false,
      bulkActionType: null,
    });
  },

  isProductSelected: (productId: number) => {
    return get().selectedProductIds.includes(productId);
  },

  openBulkAction: (actionType: BulkActionType) => {
    set({
      isBulkActionOpen: true,
      bulkActionType: actionType,
    });
  },

  closeBulkAction: () => {
    set({
      isBulkActionOpen: false,
      bulkActionType: null,
    });
  },

  setBulkProcessing: (processing: boolean) => {
    set({ isBulkProcessing: processing });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setActiveTab: (tab: string) => {
    set({ activeTab: tab });
  },

  openModal: (modal: BackofficeModalType, payload?: unknown) => {
    set({
      activeModal: modal,
      modalPayload: payload ?? null,
    });
  },

  closeModal: () => {
    set({
      activeModal: null,
      modalPayload: null,
    });
  },
}));
