import { describe, expect, it } from "vitest";
import {
  calculatePaymentDiscount,
  formatTransferInstructions,
  isValidPaymentMethod,
  isValidPaymentStatusTransition,
} from "../src/domain/payment/rules";
import { validateCreateOrderInput } from "../src/domain/order/rules";
import { CreateOrderInput } from "../src/domain/order/types";

describe("Payment Domain Rules (BR-14, BR-47, AR-16)", () => {
  describe("isValidPaymentMethod", () => {
    it("reconoce métodos de pago válidos", () => {
      expect(isValidPaymentMethod("MERCADOPAGO")).toBe(true);
      expect(isValidPaymentMethod("TRANSFER")).toBe(true);
      expect(isValidPaymentMethod("CASH")).toBe(true);
      expect(isValidPaymentMethod("STRIPE")).toBe(true);
      expect(isValidPaymentMethod("WHATSAPP")).toBe(true);
    });

    it("rechaza métodos no reconocidos", () => {
      expect(isValidPaymentMethod("CRYPTO")).toBe(false);
      expect(isValidPaymentMethod("PAYPAL")).toBe(false);
      expect(isValidPaymentMethod("")).toBe(false);
      expect(isValidPaymentMethod(null)).toBe(false);
    });
  });

  describe("calculatePaymentDiscount", () => {
    it("calcula descuento porcentual correctamente (ej: 10% en $50.000)", () => {
      const discount = calculatePaymentDiscount(5000000, 10);
      expect(discount).toBe(500000); // $5.000 ARS en centavos
    });

    it("devuelve 0 si el porcentaje es 0 o negativo", () => {
      expect(calculatePaymentDiscount(5000000, 0)).toBe(0);
      expect(calculatePaymentDiscount(5000000, -5)).toBe(0);
    });

    it("arroja error si el porcentaje supera el 100%", () => {
      expect(() => calculatePaymentDiscount(5000000, 105)).toThrow();
    });

    it("no excede el subtotal", () => {
      const discount = calculatePaymentDiscount(10000, 100);
      expect(discount).toBe(10000);
    });
  });

  describe("isValidPaymentStatusTransition", () => {
    it("permite transiciones lógicas desde PENDING", () => {
      expect(isValidPaymentStatusTransition("PENDING", "AUTHORIZED")).toBe(true);
      expect(isValidPaymentStatusTransition("PENDING", "PAID")).toBe(true);
      expect(isValidPaymentStatusTransition("PENDING", "REJECTED")).toBe(true);
      expect(isValidPaymentStatusTransition("PENDING", "PENDING")).toBe(true);
      expect(isValidPaymentStatusTransition("PENDING", "REFUNDED")).toBe(false);
    });

    it("permite transición de PAID a REFUNDED pero no a PENDING", () => {
      expect(isValidPaymentStatusTransition("PAID", "REFUNDED")).toBe(true);
      expect(isValidPaymentStatusTransition("PAID", "PENDING")).toBe(false);
    });

    it("estados finales no transicionan", () => {
      expect(isValidPaymentStatusTransition("REJECTED", "PAID")).toBe(false);
      expect(isValidPaymentStatusTransition("REFUNDED", "PAID")).toBe(false);
    });
  });

  describe("formatTransferInstructions", () => {
    it("genera instrucciones claras y formateadas con código correlativo", () => {
      const instructions = formatTransferInstructions(
        {
          bankName: "Banco Galicia",
          accountHolder: "Aura Studio S.A.",
          cuit: "30-71234567-9",
          cbu: "0070000000000000000000",
          alias: "AURA.STUDIO.PAGOS",
          discountPercent: 10,
        },
        4500000, // $45.000
        24
      );

      expect(instructions).toContain("#ORD-024");
      expect(instructions).toContain("Banco Galicia");
      expect(instructions).toContain("Aura Studio S.A.");
      expect(instructions).toContain("AURA.STUDIO.PAGOS");
      expect(instructions).toContain("$45.000");
    });
  });

  describe("Order Integration with Payment Methods (BR-47)", () => {
    const baseInput: CreateOrderInput = {
      customerName: "Camila Beltrán",
      customerPhone: "1198765432",
      customerEmail: "camila@example.com",
      customerDni: "38123456",
      deliveryMethod: "HOME_DELIVERY",
      deliveryAddress: "Av. Santa Fe 1234",
      items: [
        {
          productCode: 1,
          productTitle: "Vestido Lino",
          colorName: "Arena",
          size: "M",
          quantity: 1,
          unitPriceCents: 1000000, // $10.000
        },
      ],
    };

    it("asigna método WHATSAPP por defecto si no se especifica", () => {
      const validated = validateCreateOrderInput(baseInput);
      expect(validated.paymentMethod).toBe("WHATSAPP");
      expect(validated.paymentDiscountCents).toBe(0);
      expect(validated.totalCents).toBe(1000000);
    });

    it("asigna método TRANSFER y descuenta bonificación del total", () => {
      const validated = validateCreateOrderInput({
        ...baseInput,
        paymentMethod: "TRANSFER",
        paymentDiscountCents: 100000, // $1.000 de descuento (10%)
        shippingCents: 350000, // $3.500 de envío
      });

      expect(validated.paymentMethod).toBe("TRANSFER");
      expect(validated.paymentDiscountCents).toBe(100000);
      // Subtotal: 10.000 - 1.000 (descuento) + 3.500 (envío) = 12.500
      expect(validated.totalCents).toBe(1250000);
    });

    it("asigna método MERCADOPAGO sin alterar total si no hay bonificación", () => {
      const validated = validateCreateOrderInput({
        ...baseInput,
        paymentMethod: "MERCADOPAGO",
      });

      expect(validated.paymentMethod).toBe("MERCADOPAGO");
      expect(validated.totalCents).toBe(1000000);
    });
  });
});
