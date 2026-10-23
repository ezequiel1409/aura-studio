import { describe, it, expect } from "vitest";
import {
  ResendEmailAdapter,
  extractEmailAddress,
  formatSender,
} from "../src/infra/email/resend.adapter";
import {
  generateOrderCancelledTemplate,
  generateOrderCreatedTemplate,
  generateOrderDeliveredTemplate,
  generateOrderPaidTemplate,
  generateOrderShippedTemplate,
} from "../src/lib/email/order-templates";
import { OrderEmailData, SendEmailOptions, SendEmailResult } from "../src/domain/ports/email.port";

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

  it("generateOrderDeliveredTemplate incluye felicitación y gratitud por la compra entregada", () => {
    const template = generateOrderDeliveredTemplate(sampleOrder);
    expect(template.subject.toLowerCase()).toContain("disfrutes tu compra");
    expect(template.html.toLowerCase()).toContain("entregado con éxito");
    expect(template.html).toContain("Valentina Rossi");
    expect(template.html).toContain("#000101");
  });

  it("generateOrderCancelledTemplate informa la cancelación y liberación del stock", () => {
    const template = generateOrderCancelledTemplate(sampleOrder);
    expect(template.subject.toLowerCase()).toContain("aviso sobre tu pedido");
    expect(template.html.toLowerCase()).toContain("pedido cancelado");
    expect(template.html).toContain("stock disponible");
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

  it("extractEmailAddress y formatSender adaptan el remitente dinámicamente al nombre de la tienda", () => {
    expect(extractEmailAddress("Aura Studio <onboarding@resend.dev>")).toBe("onboarding@resend.dev");
    expect(extractEmailAddress("pedidos@mitienda.com")).toBe("pedidos@mitienda.com");

    expect(formatSender("Boutique Sofía", "Aura Studio <onboarding@resend.dev>")).toBe(
      "Boutique Sofía <onboarding@resend.dev>"
    );
    expect(formatSender("Calzados Luna", "pedidos@mitienda.com")).toBe(
      "Calzados Luna <pedidos@mitienda.com>"
    );

    const adapter = new ResendEmailAdapter({
      apiKey: "re_test_key_1234567890abcdef",
      fromEmail: "Aura Studio <onboarding@resend.dev>",
    });

    expect(adapter.getFromEmail()).toBe("Aura Studio <onboarding@resend.dev>");
    expect(adapter.getFromEmail("Boutique Sofía")).toBe("Boutique Sofía <onboarding@resend.dev>");
  });

  it("sendPasswordResetEmail adopta el nombre dinámico de la marca en asunto y remitente", async () => {
    const adapter = new ResendEmailAdapter({ apiKey: "" });
    let capturedOptions: SendEmailOptions | undefined;
    adapter.sendEmail = async (options: SendEmailOptions): Promise<SendEmailResult> => {
      capturedOptions = options;
      return { success: true, messageId: "test-123" };
    };

    await adapter.sendPasswordResetEmail(
      "admin@ejemplo.com",
      "https://example.com/reset",
      "Ezequiel",
      "Boutique Sofía"
    );

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions?.fromName).toBe("Boutique Sofía");
    expect(capturedOptions?.subject).toContain("Boutique Sofía");
    expect(capturedOptions?.html).toContain("BOUTIQUE SOFÍA");
    expect(capturedOptions?.html).toContain("en Boutique Sofía");
  });

  it("aplica personalización de marca en el layout general: logo, saludo, pie de página y color", () => {
    const customOrder: OrderEmailData = {
      ...sampleOrder,
      brandName: "Maison Lumière",
      emailCustomization: {
        layout: {
          logoUrl: "https://example.com/logo-lumiere.png",
          brandColor: "#7C3AED",
          headerGreeting: "Haute Couture & Elegance",
          footerText: "Gracias por ser parte de nuestra exclusiva comunidad.",
          showSocialLinks: true,
          showAddress: true,
        },
        events: [],
      },
    };

    const template = generateOrderCreatedTemplate(customOrder);
    expect(template.html).toContain("https://example.com/logo-lumiere.png");
    expect(template.html).toContain("Haute Couture & Elegance");
    expect(template.html).toContain("Gracias por ser parte de nuestra exclusiva comunidad.");
    expect(template.html).toContain("#7C3AED");
  });

  it("aplica plantilla personalizada de evento interpolando variables de cliente y pedido", () => {
    const customOrder: OrderEmailData = {
      ...sampleOrder,
      brandName: "Atelier Chic",
      receiptUrl: "https://atelierchic.com/pedidos/000101",
      emailCustomization: {
        layout: {
          brandColor: "#059669",
        },
        events: [
          {
            id: "order_created",
            trigger: "order_created",
            name: "Compra Realizada",
            description: "",
            enabled: true,
            subject: "¡{{nombre}}, recibimos tu orden {{codigo_pedido}} en {{nombre_tienda}}!",
            headline: "¡Hola {{nombre}}, tu selección está en marcha!",
            bodyText: "Hemos reservado tus piezas por un total de {{total}}. Revisa tu pedido en {{link_pedido}}.",
            buttonText: "Rastrear {{codigo_pedido}}",
            buttonUrl: "{{link_pedido}}",
            triggerCondition: "",
            availableVariables: [],
          },
        ],
      },
    };

    const template = generateOrderCreatedTemplate(customOrder);
    expect(template.subject).toBe("¡Valentina Rossi, recibimos tu orden #000101 en Atelier Chic!");
    expect(template.html).toContain("¡Hola Valentina Rossi, tu selección está en marcha!");
    expect(template.html).toContain("Hemos reservado tus piezas");
    expect(template.html).toContain("Rastrear #000101");
  });

  it("omite el envío cuando un evento está pausado por la comerciante", async () => {
    const adapter = new ResendEmailAdapter({ apiKey: "" });
    const orderWithDisabledEvent: OrderEmailData = {
      ...sampleOrder,
      emailCustomization: {
        layout: {},
        events: [
          {
            id: "order_created",
            trigger: "order_created",
            name: "Compra Realizada",
            description: "",
            enabled: false, // PAUSADA
            subject: "Asunto",
            headline: "Titular",
            bodyText: "Cuerpo",
            triggerCondition: "",
            availableVariables: [],
          },
        ],
      },
    };

    const result = await adapter.sendOrderCreatedEmail(orderWithDisabledEvent);
    expect(result.success).toBe(true);
    expect(result.messageId).toBe("skipped-disabled-order_created");
  });
});
