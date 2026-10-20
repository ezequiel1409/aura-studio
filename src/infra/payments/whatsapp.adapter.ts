import { CheckoutItem, PaymentAction, PaymentAdapter } from "./payment-adapter.interface";

export interface WhatsAppAdapterOptions {
  whatsappNumber: string;
  brandName?: string;
}

/**
 * BR-13: El botón "Consultar / Reservar" abre WhatsApp con un mensaje
 * pre-armado y codificado con el código y título de la prenda.
 */
export class WhatsAppPaymentAdapter implements PaymentAdapter {
  constructor(private readonly defaultOptions: WhatsAppAdapterOptions) {}

  createPaymentAction(item: CheckoutItem, options?: Partial<WhatsAppAdapterOptions>): PaymentAction {
    const number = (options?.whatsappNumber || this.defaultOptions.whatsappNumber).replace(
      /[^0-9]/g,
      ""
    );
    const brand = options?.brandName || this.defaultOptions.brandName || "Aura Studio";

    const titlePart = item.title ? ` (${item.title})` : "";
    let colorPart = "";
    if (item.selectedColor) {
      const lower = item.selectedColor.toLowerCase();
      if (lower !== "único" && lower !== "unico") {
        colorPart = ` en color ${item.selectedColor}`;
      }
    }
    let sizePart = "";
    if (item.selectedSize) {
      const upper = item.selectedSize.toUpperCase();
      const isUnico = upper === "ÚNICO" || upper === "UNICO";
      if (colorPart) {
        sizePart = isUnico ? ", talle único" : `, talle ${item.selectedSize}`;
      } else {
        sizePart = isUnico ? " en talle único" : ` en talle ${item.selectedSize}`;
      }
    }
    const cleanCode = item.formattedCode.startsWith("#")
      ? item.formattedCode
      : `#${item.formattedCode}`;
    const rawMessage = `¡Hola! Me gustaría consultar por el producto ${cleanCode}${titlePart}${colorPart}${sizePart} de ${brand}. ¿Sigue disponible?`;

    const encodedMessage = encodeURIComponent(rawMessage);
    const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;

    return {
      type: "url",
      url: whatsappUrl,
      label: "Consultar por WhatsApp",
    };
  }

  /**
   * BR-42: Genera un mensaje de WhatsApp estructurado con el resumen completo
   * de la orden de compra multi-producto y método logístico.
   */
  createOrderPaymentAction(
    order: {
      code: number;
      customerName: string;
      customerPhone: string;
      deliveryMethod: string;
      deliveryAddress?: string | null;
      deliveryNotes?: string | null;
      subtotalCents: number;
      discountCents: number;
      shippingCents: number;
      totalCents: number;
      currency: string;
      couponCode?: string | null;
      items?: Array<{
        productCode: number;
        productTitle: string;
        colorName: string;
        size: string;
        quantity: number;
        unitPriceCents: number;
        subtotalCents: number;
      }>;
    },
    options?: Partial<WhatsAppAdapterOptions> & { showroomAddress?: string | null }
  ): PaymentAction {
    const number = (options?.whatsappNumber || this.defaultOptions.whatsappNumber).replace(
      /[^0-9]/g,
      ""
    );
    const brand = options?.brandName || this.defaultOptions.brandName || "Aura Studio";

    const formattedCode = `#ORD-${order.code.toString().padStart(3, "0")}`;

    const itemsLines = (order.items || [])
      .map((item) => {
        const codeStr = `#${item.productCode.toString().padStart(3, "0")}`;
        const colorPart = item.colorName && item.colorName.toLowerCase() !== "único" ? `, Color: ${item.colorName}` : "";
        const sizePart = item.size ? `, Talle: ${item.size}` : "";
        const priceStr = `$${(item.subtotalCents / 100).toLocaleString("es-AR")}`;
        return `• ${codeStr} ${item.productTitle} (${item.quantity}u${colorPart}${sizePart}) - ${priceStr}`;
      })
      .join("\n");

    let deliveryDesc = "";
    if (order.deliveryMethod === "HOME_DELIVERY") {
      deliveryDesc = `Envío a domicilio (${order.deliveryAddress || "A coordinar"})`;
    } else if (order.deliveryMethod === "MOTORCYCLE") {
      deliveryDesc = `Motomensajería Express (${order.deliveryAddress || "A coordinar"})`;
    } else {
      const showroomPart = options?.showroomAddress ? ` en ${options.showroomAddress}` : "";
      deliveryDesc = `Retiro / Entrega en el Showroom${showroomPart}`;
    }

    const subtotalStr = `$${(order.subtotalCents / 100).toLocaleString("es-AR")}`;
    const shippingStr = order.shippingCents > 0
      ? `$${(order.shippingCents / 100).toLocaleString("es-AR")}`
      : "A convenir / Bonificado";
    const totalStr = `$${(order.totalCents / 100).toLocaleString("es-AR")}`;

    let discountPart = "";
    if (order.discountCents > 0) {
      const couponTag = order.couponCode ? ` (Cupón ${order.couponCode})` : "";
      discountPart = `\nDescuento${couponTag}: -$${(order.discountCents / 100).toLocaleString("es-AR")}`;
    }

    const orderAny = order as { paymentMethod?: string; paymentDiscountCents?: number };
    let paymentDiscountPart = "";
    if (orderAny.paymentDiscountCents && orderAny.paymentDiscountCents > 0) {
      paymentDiscountPart = `\nDescuento transferencia: -$${(orderAny.paymentDiscountCents / 100).toLocaleString("es-AR")}`;
    }

    const paymentMethodLabel =
      orderAny.paymentMethod === "TRANSFER"
        ? "Transferencia bancaria"
        : orderAny.paymentMethod === "MERCADOPAGO"
        ? "Mercado Pago"
        : orderAny.paymentMethod === "CASH"
        ? "Efectivo"
        : "A coordinar";

    let notesPart = "";
    if (order.deliveryNotes) {
      notesPart = `\nNotas: ${order.deliveryNotes}`;
    }

    const closingLine =
      orderAny.paymentMethod === "TRANSFER"
        ? "Ya tengo los datos de transferencia, ¿me confirmás la recepción del comprobante? ¡Muchas gracias!"
        : "¿Me indicás los pasos a seguir para completar la compra? ¡Muchas gracias!";

    const message = `¡Hola! Quiero confirmar mi pedido ${formattedCode} en ${brand}:

🛍️ Productos:
${itemsLines || "• Detalle de prendas"}

Subtotal: ${subtotalStr}${discountPart}${paymentDiscountPart}
Logística: ${deliveryDesc} (${shippingStr})
Método de pago: ${paymentMethodLabel}
Total a abonar: ${totalStr}

👤 Comprador:
Nombre: ${order.customerName}
Teléfono: ${order.customerPhone}${notesPart}

${closingLine}`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${number}?text=${encoded}`;

    return {
      type: "url",
      url: whatsappUrl,
      label: "Confirmar Pedido por WhatsApp",
    };
  }
}

