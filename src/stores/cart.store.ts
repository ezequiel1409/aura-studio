import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { CartItem } from "../domain/cart/types";
import { buildCartItemKey, clampCartQuantity, countCartItems, calculateCartSubtotalCents } from "../domain/cart/rules";
import { DeliveryMethod } from "../domain/order/types";

export interface AddItemInput {
  productId: number;
  code: number;
  formattedCode: string;
  title: string | null;
  colorName: string;
  hexCode?: string | null;
  size: string;
  maxStock: number;
  unitPriceCents: number | null;
  currency: string;
  photoUrl?: string | null;
}

export interface CartToastState {
  id: number;
  title: string | null;
  formattedCode: string;
  colorName: string;
  size: string;
  quantity: number;
  photoUrl?: string | null;
}

export interface CartStoreState {
  items: CartItem[];
  isOpen: boolean;
  deliveryMethod: DeliveryMethod;
  toast: CartToastState | null;

  // Acciones de UI
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  dismissToast: () => void;

  // Acciones de Carrito (BR-40)
  addItem: (item: AddItemInput, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  syncStock: (stockMap: Record<string, number>) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;

  // Selectores calculados
  getTotalItemsCount: () => number;
  getSubtotalCents: () => number;
}

export const useCartStore = create<CartStoreState>()(
  devtools(
    persist(
      (set, get) => ({
      items: [],
      isOpen: false,
      deliveryMethod: "PICKUP",
      toast: null,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setDeliveryMethod: (deliveryMethod: DeliveryMethod) => set({ deliveryMethod }),
      dismissToast: () => set({ toast: null }),

      addItem: (itemInput: AddItemInput, quantity = 1) => {
        set((state) => {
          const safeColor = (itemInput.colorName || "Único").trim();
          const safeSize = (itemInput.size || "ÚNICO").trim().toUpperCase();
          const safePrice =
            itemInput.unitPriceCents != null && Number.isFinite(Number(itemInput.unitPriceCents))
              ? Math.round(Number(itemInput.unitPriceCents))
              : null;
          const safeMaxStock =
            Number.isFinite(Number(itemInput.maxStock)) && Number(itemInput.maxStock) > 0
              ? Math.floor(Number(itemInput.maxStock))
              : 1;
          const safeQty =
            Number.isFinite(Number(quantity)) && Number(quantity) > 0
              ? Math.floor(Number(quantity))
              : 1;

          const key = buildCartItemKey(itemInput.code, safeColor, safeSize);
          const existingIndex = state.items.findIndex((i) => i.key === key);

          const toastData: CartToastState = {
            id: Date.now(),
            title: itemInput.title,
            formattedCode: itemInput.formattedCode,
            colorName: safeColor,
            size: safeSize,
            quantity: safeQty,
            photoUrl: itemInput.photoUrl,
          };

          if (existingIndex >= 0) {
            const existing = state.items[existingIndex];
            const currentQty =
              Number.isFinite(existing.quantity) && existing.quantity > 0
                ? existing.quantity
                : 1;
            const effectiveMax =
              Number.isFinite(existing.maxStock) && existing.maxStock > 0
                ? existing.maxStock
                : safeMaxStock;
            const newQty = clampCartQuantity(currentQty + safeQty, effectiveMax);
            const updated = [...state.items];
            updated[existingIndex] = { ...existing, quantity: newQty, maxStock: effectiveMax };
            return { items: updated, toast: toastData };
          }

          const clampedQty = clampCartQuantity(safeQty, safeMaxStock);
          if (clampedQty <= 0) {
            return state;
          }

          const newItem: CartItem = {
            key,
            productId: itemInput.productId,
            code: itemInput.code,
            formattedCode: itemInput.formattedCode,
            title: itemInput.title,
            colorName: safeColor,
            hexCode: itemInput.hexCode,
            size: safeSize,
            quantity: clampedQty,
            maxStock: safeMaxStock,
            unitPriceCents: safePrice,
            currency: itemInput.currency || "ARS",
            photoUrl: itemInput.photoUrl,
          };

          return { items: [...state.items, newItem], toast: toastData };
        });
      },

      updateQuantity: (key: string, quantity: number) => {
        set((state) => {
          if (!Number.isFinite(quantity) || quantity <= 0) {
            return { items: state.items.filter((i) => i.key !== key) };
          }

          const updated = state.items.map((item) => {
            if (item.key === key) {
              const safeMax =
                Number.isFinite(item.maxStock) && item.maxStock > 0 ? item.maxStock : 99;
              return {
                ...item,
                quantity: clampCartQuantity(quantity, safeMax),
              };
            }
            return item;
          });

          return { items: updated };
        });
      },

      syncStock: (stockMap: Record<string, number>) => {
        set((state) => {
          const updated = state.items.map((item) => {
            const currentQty =
              Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
            if (item.key in stockMap) {
              const rawStock = stockMap[item.key];
              const newMax = Number.isFinite(rawStock) ? Math.max(0, rawStock) : 0;
              return {
                ...item,
                maxStock: newMax,
                quantity: newMax <= 0 ? 1 : clampCartQuantity(currentQty, newMax),
              };
            }
            return {
              ...item,
              quantity: currentQty,
            };
          });
          return { items: updated };
        });
      },

      removeItem: (key: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.key !== key),
        }));
      },

      clearCart: () => {
        set({ items: [], deliveryMethod: "PICKUP" });
      },

      getTotalItemsCount: () => {
        return countCartItems(get().items);
      },

      getSubtotalCents: () => {
        return calculateCartSubtotalCents(get().items);
      },
    }),
    {
      name: "app_cart_storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.items)) {
          state.items = state.items.map((item) => {
            const rawPrice = item.unitPriceCents;
            const safePrice =
              typeof rawPrice === "number" && Number.isFinite(rawPrice)
                ? Math.round(rawPrice)
                : rawPrice != null && !Number.isNaN(Number(rawPrice))
                ? Math.round(Number(rawPrice))
                : null;
            const rawQty = item.quantity;
            const safeQty =
              typeof rawQty === "number" && Number.isFinite(rawQty) && rawQty > 0
                ? Math.floor(rawQty)
                : 1;
            const rawStock = item.maxStock;
            const safeMaxStock =
              typeof rawStock === "number" && Number.isFinite(rawStock) && rawStock > 0
                ? Math.floor(rawStock)
                : 1;
            return {
              ...item,
              size: (item.size || "ÚNICO").trim().toUpperCase(),
              colorName: (item.colorName || "Único").trim(),
              quantity: safeQty,
              maxStock: safeMaxStock,
              unitPriceCents: safePrice,
            };
          });
        }
      },
    }),
    { name: "CartStore", enabled: true }
  )
);

if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).useCartStore = useCartStore;
}
