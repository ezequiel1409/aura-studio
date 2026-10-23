import { describe, it, expect } from "vitest";
import { ResendEmailAdapter } from "../src/infra/email/resend.adapter";
import {
  generateOrderCreatedTemplate,
  generateOrderPaidTemplate,
  generateOrderShippedTemplate,
} from "../src/lib/email/order-templates";
import { OrderEmailData } from "../src/domain/ports/email.port";

describe("ResendEmailAdapter & Email Templates", () => {
  const sampleOrder: OrderEmailData = {
    orderId: 101,
    orderCode: 101,
    formattedCode: "#000101",
    customerName: "Valentina Rossi",
    customerEmail: "valentina@example.com",
    customerPhone: "+5491112345678",
    deliveryMethod: "PICKUP",
    deliveryAddress: null,
    deliveryNotes: null,
    items: [
      {
        productTitle: "Vestido Lino Arena",
        productCode: 50,
        colorName: "Arena",
        size: "M",
        quantity: 1,
        unitPriceCents: 4500000,
        photoUrl: "https://example.com/vestido.jpg",
      },
    ],
    subtotalCents: 4500000,
    shippingCents: 0,
    discountCents: 0,
    totalCents: 4500000,
    currency: "ARS",
    paymentMethod: "TRANSFER",
    paymentStatus: "PENDING",
    bankDetails: {
      bankName: "Banco Galicia",
      accountHolder: "Aura Studio SRL",
      cbu: "0070000000000000000001",
      alias: "AURA.STUDIO.GALICIA",
      cuit: "30-12345678-9",
    },
    showroomAddress: "Palermo Soho, Gurruchaga 1750, CABA",
    brandName: "Aura Studio",
  };

  it("generateOrderCreatedTemplate incluye datos clave del pedido y datos bancarios para transferencia", () => {
    const template = generateOrderCreatedTemplate(sampleOrder);
    expect(template.subject).toContain("#000101");
    expect(template.html).toContain("#000101");
    expect(template.html).toContain("Valentina Rossi");
    expect(template.html).toContain("Vestido Lino Arena");
    expect(template.html).toContain("Banco Galicia");
    expect(template.html).toContain("AURA.STUDIO.GALICIA");
    expect(template.html).toContain("Palermo Soho");
  });

  it("generateOrderPaidTemplate incluye felicitaciones y confirmación de pago", () => {
    const template = generateOrderPaidTemplate(sampleOrder);
    expect(template.subject.toLowerCase()).toContain("pago acreditado");
    expect(template.html.toLowerCase()).toContain("pago acreditado");
    expect(template.html).toContain("#000101");
  });

  it("generateOrderShippedTemplate incluye aviso de retiro en local o despacho de envío", () => {
    const template = generateOrderShippedTemplate(sampleOrder);
    expect(template.subject.toLowerCase()).toContain("listo para retirar");
    expect(template.html.toLowerCase()).toContain("listo para retirar");
    expect(template.html).toContain("Palermo Soho");
  });

  it("ResendEmailAdapter opera en modo simulación seguro cuando no hay API key", async () => {
    const adapter = new ResendEmailAdapter({
      apiKey: "",
      fromEmail: "Aura Studio <onboarding@resend.dev>",
    });

    const status = adapter.getStatus();
    expect(status.configured).toBe(false);
    expect(status.keyMasked).toBeNull();

    const result = await adapter.sendOrderCreatedEmail(sampleOrder);
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.messageId?.startsWith("mock-")).toBe(true);
  });

  it("ResendEmailAdapter enmascara la API Key correctamente sin exponer secretos", () => {
    const adapter = new ResendEmailAdapter({
      apiKey: "re_live_secret_1234567890abcdef",
      fromEmail: "pedidos@aurastudio.com",
    });

    const status = adapter.getStatus();
    expect(status.configured).toBe(true);
    expect(status.keyMasked).not.toBe("re_live_secret_1234567890abcdef");
    expect(status.keyMasked?.startsWith("re_")).toBe(true);
    expect(status.keyMasked?.endsWith("cdef")).toBe(true);
    expect(status.keyMasked).toContain("••••");
  });
});
