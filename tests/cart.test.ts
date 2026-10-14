import { describe, expect, it, beforeEach } from "vitest";
import {
  buildCartItemKey,
  clampCartQuantity,
  countCartItems,
  calculateCartSubtotalCents,
} from "../src/domain/cart/rules";
import { useCartStore } from "../src/stores/cart.store";

describe("Cart Domain & Store (BR-40)", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  describe("Reglas Puras de Carrito (rules.ts)", () => {
    it("genera clave compuesta única normalizada por código, color y talle", () => {
      const key1 = buildCartItemKey(24, "Negro ", " m ");
      const key2 = buildCartItemKey(24, "negro", "M");
      expect(key1).toBe("24__negro__M");
      expect(key1).toBe(key2);
    });

    it("restringe la cantidad elegida al stock físico disponible (clampCartQuantity)", () => {
      // Stock 5: pide 3 -> 3
      expect(clampCartQuantity(3, 5)).toBe(3);
      // Stock 5: pide 10 -> 5 (no supera máximo de inventario)
      expect(clampCartQuantity(10, 5)).toBe(5);
      // Stock 5: pide 0 o negativo -> 1
      expect(clampCartQuantity(0, 5)).toBe(1);
      expect(clampCartQuantity(-2, 5)).toBe(1);
      // Stock 0: agotado -> 0
      expect(clampCartQuantity(1, 0)).toBe(0);
    });

    it("calcula conteo total de unidades y subtotal en centavos", () => {
      const items = [
        {
          key: "1__negro__M",
          productId: 1,
          code: 1,
          formattedCode: "#001",
          title: "Top Lino",
          colorName: "Negro",
          size: "M",
          quantity: 2,
          maxStock: 5,
          unitPriceCents: 2000000, // $20.000
          currency: "ARS",
        },
        {
          key: "2__blanco__S",
          productId: 2,
          code: 2,
          formattedCode: "#002",
          title: "Pantalón",
          colorName: "Blanco",
          size: "S",
          quantity: 1,
          maxStock: 3,
          unitPriceCents: 3500000, // $35.000
          currency: "ARS",
        },
      ];

      expect(countCartItems(items)).toBe(3);
      expect(calculateCartSubtotalCents(items)).toBe(7500000); // 2*20000 + 1*35000 = 75000
    });
  });

  describe("Store de Zustand (useCartStore)", () => {
    it("permite agregar productos al carrito respetando el stock disponible", () => {
      const store = useCartStore.getState();

      store.addItem(
        {
          productId: 10,
          code: 10,
          formattedCode: "#010",
          title: "Vestido Seda",
          colorName: "Negro",
          size: "M",
          maxStock: 3,
          unitPriceCents: 4500000,
          currency: "ARS",
        },
        2
      );

      expect(useCartStore.getState().items.length).toBe(1);
      expect(useCartStore.getState().items[0].quantity).toBe(2);
      expect(useCartStore.getState().isOpen).toBe(true);

      // Intentar agregar 5 más: debe toparse en maxStock = 3
      store.addItem(
        {
          productId: 10,
          code: 10,
          formattedCode: "#010",
          title: "Vestido Seda",
          colorName: "Negro",
          size: "M",
          maxStock: 3,
          unitPriceCents: 4500000,
          currency: "ARS",
        },
        5
      );

      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });

    it("permite actualizar cantidades y eliminar ítems", () => {
      const store = useCartStore.getState();

      store.addItem({
        productId: 20,
        code: 20,
        formattedCode: "#020",
        title: "Camisa Oxford",
        colorName: "Celeste",
        size: "L",
        maxStock: 4,
        unitPriceCents: 3000000,
        currency: "ARS",
      });

      const key = "20__celeste__L";
      expect(useCartStore.getState().items[0].quantity).toBe(1);

      // Incrementar
      store.updateQuantity(key, 3);
      expect(useCartStore.getState().items[0].quantity).toBe(3);

      // Reducir a 0 lo elimina
      store.updateQuantity(key, 0);
      expect(useCartStore.getState().items.length).toBe(0);
    });

    it("permite seleccionar método de entrega", () => {
      const store = useCartStore.getState();
      expect(store.deliveryMethod).toBe("PICKUP");

      store.setDeliveryMethod("HOME_DELIVERY");
      expect(useCartStore.getState().deliveryMethod).toBe("HOME_DELIVERY");

      store.setDeliveryMethod("MOTORCYCLE");
      expect(useCartStore.getState().deliveryMethod).toBe("MOTORCYCLE");
    });
  });
});
