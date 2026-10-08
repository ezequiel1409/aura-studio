export interface CheckoutItem {
  code: number;
  formattedCode: string;
  title: string | null;
  priceCents: number | null;
  currency: string;
  selectedSize?: string | null;
}

export interface PaymentAction {
  type: "url" | "redirect";
  url: string;
  label: string;
}

/**
 * BR-14: Interfaz PaymentAdapter desacoplada de catálogo y base de datos.
 * Hoy implementa WhatsApp; mañana Mercado Pago u otros proveedores.
 */
export interface PaymentAdapter {
  createPaymentAction(item: CheckoutItem, options?: Record<string, unknown>): PaymentAction;
}

