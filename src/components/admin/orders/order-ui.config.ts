import {
  Banknote,
  Bike,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageCircle,
  QrCode,
  Store,
  Truck,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Order, OrderStatus } from "../../../domain/order/types";
import { PaymentMethod, PaymentStatus } from "../../../domain/payment/types";
import { formatOrderCode } from "../../../domain/order/rules";

export type WhatsAppOrderTemplate = "receipt" | "confirmed" | "ready";

export interface OrderStatusMeta {
  label: string;
  detailLabel: string;
  bg: string;
  text: string;
  border: string;
  quickActiveClass: string;
  icon: LucideIcon;
  description: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusMeta> = {
  PENDING: {
    label: "Pendiente",
    detailLabel: "Pendiente",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-800/80",
    quickActiveClass: "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold",
    icon: Clock,
    description: "Orden recibida. Pendiente de confirmación de pago o retiro.",
  },
  CONFIRMED: {
    label: "Confirmado",
    detailLabel: "Confirmada",
    bg: "bg-sky-950/60",
    text: "text-sky-300",
    border: "border-sky-800/80",
    quickActiveClass: "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold",
    icon: CheckCircle2,
    description: "Pedido confirmado. Preparando paquete para entrega.",
  },
  PAID: {
    label: "Pagado",
    detailLabel: "Pagada",
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/80",
    quickActiveClass:
      "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold",
    icon: CheckCircle2,
    description: "Pago acreditado y registrado con éxito.",
  },
  CANCELLED: {
    label: "Cancelado",
    detailLabel: "Cancelada",
    bg: "bg-zinc-900",
    text: "text-zinc-400",
    border: "border-zinc-700",
    quickActiveClass: "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold",
    icon: XCircle,
    description: "Orden cancelada. Stock restituido al catálogo.",
  },
};

export const ORDER_STATUS_KEYS: readonly OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PAID",
  "CANCELLED",
];

export const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; shortLabel: string; icon: LucideIcon; color: string }
> = {
  TRANSFER: {
    label: "Transferencia Bancaria",
    shortLabel: "Transferencia",
    icon: Building2,
    color: "text-[#d4af37]",
  },
  MERCADOPAGO: {
    label: "Mercado Pago",
    shortLabel: "Mercado Pago",
    icon: CreditCard,
    color: "text-sky-400",
  },
  CASH: {
    label: "Efectivo",
    shortLabel: "Efectivo",
    icon: Banknote,
    color: "text-emerald-400",
  },
  WHATSAPP: {
    label: "WhatsApp Directo",
    shortLabel: "WhatsApp",
    icon: MessageCircle,
    color: "text-[#25D366]",
  },
  STRIPE: {
    label: "Stripe",
    shortLabel: "Stripe",
    icon: CreditCard,
    color: "text-indigo-400",
  },
  PAYWAY: {
    label: "Payway (Prisma)",
    shortLabel: "Payway",
    icon: CreditCard,
    color: "text-indigo-400",
  },
  GETNET: {
    label: "Getnet (Santander)",
    shortLabel: "Getnet",
    icon: CreditCard,
    color: "text-rose-400",
  },
  MODO: {
    label: "MODO (QR / Bancos)",
    shortLabel: "MODO",
    icon: QrCode,
    color: "text-teal-400",
  },
  GOOGLEPAY: {
    label: "Google Pay",
    shortLabel: "Google Pay",
    icon: Wallet,
    color: "text-amber-400",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: "Cobro Pendiente",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-800/80",
  },
  AUTHORIZED: {
    label: "Pago Aceptado",
    bg: "bg-sky-950/60",
    text: "text-sky-300",
    border: "border-sky-800/80",
  },
  PAID: {
    label: "Pago Confirmado",
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-800/80",
  },
  REJECTED: {
    label: "Cobro Rechazado",
    bg: "bg-rose-950/60",
    text: "text-rose-300",
    border: "border-rose-800/80",
  },
  REFUNDED: {
    label: "Reembolsado",
    bg: "bg-zinc-900",
    text: "text-zinc-400",
    border: "border-zinc-700",
  },
};

const DELIVERY_METHOD_MAP: Record<
  string,
  { label: string; shortLabel: string; icon: LucideIcon }
> = {
  PICKUP: { label: "Retiro en Showroom", shortLabel: "Retiro Showroom", icon: Store },
  MOTORCYCLE: { label: "Motomensajería", shortLabel: "Moto Express", icon: Bike },
  HOME_DELIVERY: { label: "Envío a domicilio", shortLabel: "A Domicilio", icon: Truck },
};

export function getDeliveryMethodMeta(method?: string | null) {
  return (method && DELIVERY_METHOD_MAP[method]) || DELIVERY_METHOD_MAP.HOME_DELIVERY;
}

/**
 * Construye mensajes prearmados y URL de WhatsApp para seguimiento de una orden.
 */
export function getOrderWhatsAppMessage(
  order: Pick<Order, "code" | "customerName" | "deliveryMethod">,
  type: WhatsAppOrderTemplate,
  brandName: string
): string {
  const code = formatOrderCode(order.code);
  const firstName = order.customerName.split(" ")[0];

  if (type === "receipt") {
    return `¡Hola ${firstName}! Recibimos tu pedido ${code} en ${brandName}. Te pasamos los datos para coordinar el pago o la entrega.`;
  }
  if (type === "confirmed") {
    return `¡Hola ${firstName}! Tu pedido ${code} ya está confirmado y estamos preparando tus prendas.`;
  }
  if (type === "ready") {
    if (order.deliveryMethod === "PICKUP") {
      return `¡Hola ${firstName}! Tu pedido ${code} ya está listo para retirar en nuestro showroom. ¡Te esperamos!`;
    }
    return `¡Hola ${firstName}! Tu paquete del pedido ${code} ya está listo y en camino a tu domicilio.`;
  }
  return `¡Hola ${firstName}! Te contactamos por tu pedido ${code} en ${brandName}.`;
}

export function getOrderWhatsAppLink(
  order: Pick<Order, "code" | "customerName" | "customerPhone" | "deliveryMethod">,
  type: WhatsAppOrderTemplate,
  brandName: string
): string {
  const cleanPhone = order.customerPhone.replace(/\D/g, "");
  const text = encodeURIComponent(getOrderWhatsAppMessage(order, type, brandName));
  return `https://wa.me/${cleanPhone}?text=${text}`;
}
