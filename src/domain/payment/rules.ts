import { BankTransferDetails, PaymentMethod, PaymentStatus } from "./types";
import { ValidationError } from "../errors";

export const VALID_PAYMENT_METHODS: PaymentMethod[] = [
  "MERCADOPAGO",
  "TRANSFER",
  "CASH",
  "STRIPE",
  "WHATSAPP",
];

export function isValidPaymentMethod(method: unknown): method is PaymentMethod {
  return typeof method === "string" && VALID_PAYMENT_METHODS.includes(method as PaymentMethod);
}

/**
 * Calcula el descuento por método de pago (ej. 10% OFF en transferencia)
 * Se aplica sobre el subtotal elegible en centavos.
 */
export function calculatePaymentDiscount(
  subtotalCents: number,
  discountPercent: number
): number {
  if (!discountPercent || discountPercent <= 0) return 0;
  if (discountPercent > 100) {
    throw new ValidationError("El porcentaje de descuento no puede superar el 100%.");
  }
  const discount = Math.round((subtotalCents * discountPercent) / 100);
  return Math.max(0, Math.min(subtotalCents, discount));
}

/**
 * Valida transiciones permitidas del estado de pago
 */
export function isValidPaymentStatusTransition(
  from: PaymentStatus,
  to: PaymentStatus
): boolean {
  if (from === to) return true;
  switch (from) {
    case "PENDING":
      return ["AUTHORIZED", "PAID", "REJECTED"].includes(to);
    case "AUTHORIZED":
      return ["PAID", "REJECTED"].includes(to);
    case "PAID":
      return ["REFUNDED"].includes(to);
    case "REJECTED":
    case "REFUNDED":
      return false;
    default:
      return false;
  }
}

/**
 * Genera el texto estructurado de instrucciones para transferencia bancaria
 */
export function formatTransferInstructions(
  details: BankTransferDetails,
  finalAmountCents: number,
  orderCode: number
): string {
  const formattedCode = `#ORD-${orderCode.toString().padStart(3, "0")}`;
  const amountStr = `$${(finalAmountCents / 100).toLocaleString("es-AR")}`;

  const lines = [
    `¡Gracias por tu compra! Para completar tu pedido ${formattedCode}, realizá la transferencia por el total de ${amountStr}:`,
  ];

  if (details.bankName) lines.push(`• Banco: ${details.bankName}`);
  if (details.accountHolder) lines.push(`• Titular: ${details.accountHolder}`);
  if (details.cuit) lines.push(`• CUIT: ${details.cuit}`);
  if (details.cbu) lines.push(`• CBU/CVU: ${details.cbu}`);
  if (details.alias) lines.push(`• Alias: ${details.alias}`);

  lines.push(`• Referencia / Concepto: ${formattedCode}`);
  lines.push(
    `Una vez realizada, envianos el comprobante por WhatsApp para despachar tu paquete de inmediato.`
  );

  return lines.join("\n");
}
