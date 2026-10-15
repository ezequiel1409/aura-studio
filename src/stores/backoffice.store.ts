import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type BulkActionType = "status" | "category" | "delete" | null;
export type BackofficeModalType =
  | "edit_product"
  | "create_category"
  | "edit_category"
  | "delete_category"
  | null;
export type AdminTheme = "light" | "dark";

export interface BackofficeStoreState {
  // Tema UI accesible (Híbrido: claro editorial / oscuro grafito)
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;

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

function applyThemeToDOM(theme: AdminTheme) {
  if (typeof document !== "undefined") {
    const root = document.getElementById("admin-layout-root");
    if (root) {
      root.setAttribute("data-theme", theme);
    }
    document.documentElement.setAttribute("data-admin-theme", theme);
    try {
      localStorage.setItem("aura_admin_theme", theme);
    } catch {}
  }
}

export const useBackofficeStore = create<BackofficeStoreState>()(
  devtools(
    (set, get) => ({
  theme: "light",
  setTheme: (theme: AdminTheme) => {
    applyThemeToDOM(theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const next: AdminTheme = state.theme === "light" ? "dark" : "light";
      applyThemeToDOM(next);
      return { theme: next };
    });
  },

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
}),
    { name: "AuraBackofficeStore", enabled: true }
  )
);

if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).useBackofficeStore = useBackofficeStore;
}
