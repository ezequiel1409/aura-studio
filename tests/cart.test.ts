import { describe, expect, it, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  buildCartItemKey,
  clampCartQuantity,
  countCartItems,
  calculateCartSubtotalCents,
} from "../src/domain/cart/rules";
import { useCartStore } from "../src/stores/cart.store";
import { CartStepper } from "../src/components/cart/CartStepper";
import { ProductOrderSection } from "../src/components/catalog/ProductOrderSection";

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
      expect(useCartStore.getState().isOpen).toBe(false);
      expect(useCartStore.getState().toast).not.toBeNull();
      expect(useCartStore.getState().toast?.title).toBe("Vestido Seda");

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

    it("permite descartar el toast de confirmación del carrito", () => {
      const store = useCartStore.getState();
      store.addItem({
        productId: 10,
        code: 10,
        formattedCode: "#010",
        title: "Vestido Seda",
        colorName: "Negro",
        size: "M",
        maxStock: 3,
        unitPriceCents: 4500000,
        currency: "ARS",
      });

      expect(useCartStore.getState().toast).not.toBeNull();
      useCartStore.getState().dismissToast();
      expect(useCartStore.getState().toast).toBeNull();
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

  describe("Componente CartStepper (Accesibilidad y Pasos BR-40, AR-12)", () => {
    it("renderiza navegación de pasos con aria-current='step' en el paso activo", () => {
      const htmlCart = renderToString(React.createElement(CartStepper, { currentStep: "cart" }));
      expect(htmlCart).toContain('aria-label="Progreso del pedido"');
      expect(htmlCart).toContain('aria-current="step"');
      expect(htmlCart).toContain("Tu bolsa");
      expect(htmlCart).toContain("Entrega y Datos");
      expect(htmlCart).toContain("Revisión");

      const htmlShipping = renderToString(React.createElement(CartStepper, { currentStep: "shipping" }));
      expect(htmlShipping).toContain('aria-current="step"');
      expect(htmlShipping).toContain("Entrega y Datos");

      const htmlPayment = renderToString(React.createElement(CartStepper, { currentStep: "payment" }));
      expect(htmlPayment).toContain('aria-current="step"');
      expect(htmlPayment).toContain("Revisión");
    });

    it("deshabilita pasos futuros en el stepper para guiar el flujo secuencial", () => {
      const html = renderToString(React.createElement(CartStepper, { currentStep: "cart" }));
      expect(html).toContain("disabled");
      expect(html).toContain("cursor-not-allowed");
    });
  });

  describe("Componente ProductOrderSection (BR-40, AR-12)", () => {
    it("renderiza botón de agregar a la bolsa y selector de cantidad sin botón directo de WhatsApp", () => {
      const html = renderToString(
        React.createElement(ProductOrderSection, {
          productId: 1,
          code: 101,
          formattedCode: "101",
          title: "Vestido Gala",
          priceCents: 5000000,
          currency: "ARS",
          sizes: ["S", "M", "L"],
          isSoldOut: false,
          isReserved: false,
        })
      );

      // Debe incluir botón principal para agregar a la bolsa
      expect(html).toContain("Agregar a la bolsa");
      // Debe incluir selector de cantidad
      expect(html).toContain("Cantidad:");
      // NO debe tener el botón de WhatsApp directo en la ficha individual
      expect(html).not.toContain("Consultar por WhatsApp");
      expect(html).not.toContain("Comprar por WhatsApp");
    });

    it("muestra estado deshabilitado si la prenda está agotada", () => {
      const html = renderToString(
        React.createElement(ProductOrderSection, {
          productId: 2,
          code: 102,
          formattedCode: "102",
          title: "Blusa Seda",
          priceCents: 3500000,
          currency: "ARS",
          sizes: ["M"],
          isSoldOut: true,
          isReserved: false,
        })
      );

      expect(html).toContain("Pieza Agotada");
      expect(html).toContain("disabled");
    });

    it("ofrece consultar por WhatsApp si el producto no tiene precio asignado (priceCents === null)", () => {
      const html = renderToString(
        React.createElement(ProductOrderSection, {
          productId: 3,
          code: 103,
          formattedCode: "103",
          title: "Prenda Exclusiva",
          priceCents: null,
          currency: "ARS",
          sizes: ["Único"],
          isSoldOut: false,
          isReserved: false,
        })
      );

      expect(html).toContain("Precio a consultar");
      expect(html).toContain("Consultar precio por WhatsApp");
      expect(html).toContain("disabled");
    });
  });
});


