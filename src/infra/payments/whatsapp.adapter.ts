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
    const rawMessage = `¡Hola! Me gustaría consultar por la prenda ${item.formattedCode}${titlePart}${colorPart}${sizePart} de ${brand}. ¿Sigue disponible?`;

    const encodedMessage = encodeURIComponent(rawMessage);
    const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;

    return {
      type: "url",
      url: whatsappUrl,
      label: "Consultar por WhatsApp",
    };
  }
}

