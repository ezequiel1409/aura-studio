import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

export interface CartStoreState {
  items: CartItem[];
  isOpen: boolean;
  deliveryMethod: DeliveryMethod;

  // Acciones de UI
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setDeliveryMethod: (method: DeliveryMethod) => void;

  // Acciones de Carrito (BR-40)
  addItem: (item: AddItemInput, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;

  // Selectores calculados
  getTotalItemsCount: () => number;
  getSubtotalCents: () => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      deliveryMethod: "PICKUP",

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setDeliveryMethod: (deliveryMethod: DeliveryMethod) => set({ deliveryMethod }),

      addItem: (itemInput: AddItemInput, quantity = 1) => {
        set((state) => {
          const key = buildCartItemKey(itemInput.code, itemInput.colorName, itemInput.size);
          const existingIndex = state.items.findIndex((i) => i.key === key);

          if (existingIndex >= 0) {
            const existing = state.items[existingIndex];
            const newQty = clampCartQuantity(existing.quantity + quantity, existing.maxStock);
            const updated = [...state.items];
            updated[existingIndex] = { ...existing, quantity: newQty };
            return { items: updated, isOpen: true };
          }

          const clampedQty = clampCartQuantity(quantity, itemInput.maxStock);
          if (clampedQty <= 0) {
            return state;
          }

          const newItem: CartItem = {
            key,
            productId: itemInput.productId,
            code: itemInput.code,
            formattedCode: itemInput.formattedCode,
            title: itemInput.title,
            colorName: itemInput.colorName,
            hexCode: itemInput.hexCode,
            size: itemInput.size,
            quantity: clampedQty,
            maxStock: itemInput.maxStock,
            unitPriceCents: itemInput.unitPriceCents,
            currency: itemInput.currency,
            photoUrl: itemInput.photoUrl,
          };

          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      updateQuantity: (key: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.key !== key) };
          }

          const updated = state.items.map((item) => {
            if (item.key === key) {
              return {
                ...item,
                quantity: clampCartQuantity(quantity, item.maxStock),
              };
            }
            return item;
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
        set({ items: [] });
      },

      getTotalItemsCount: () => {
        return countCartItems(get().items);
      },

      getSubtotalCents: () => {
        return calculateCartSubtotalCents(get().items);
      },
    }),
    {
      name: "aura_cart_storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        items: state.items,
        deliveryMethod: state.deliveryMethod,
      }),
    }
  )
);
