import { OrderClaim } from "../claim/types";
import { GatewayPaymentDetails, PaymentMethod, PaymentStatus } from "../payment/types";

export type DeliveryMethod = "HOME_DELIVERY" | "MOTORCYCLE" | "PICKUP";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED";

export type OrderTimelineEventType =
  | "ORDER_CREATED"
  | "PAYMENT_PREFERENCE_CREATED"
  | "PAYMENT_GATEWAY_RETURN"
  | "PAYMENT_WEBHOOK_RECEIVED"
  | "PAYMENT_AUTHORIZED"
  | "PAYMENT_PAID"
  | "PAYMENT_REJECTED"
  | "ORDER_CONFIRMED"
  | "STOCK_DEDUCTED"
  | "STOCK_RESTORED"
  | "PAYMENT_CANCELLED"
  | "PAYMENT_REFUNDED"
  | "ORDER_CANCELLED"
  | "EMAIL_SENT"
  | "CLAIM_UPDATED";

export interface OrderTimelineEvent {
  id: string;
  at: number;
  type: OrderTimelineEventType;
  title: string;
  description?: string | null;
  actor?: "BUYER" | "ADMIN" | "MERCADOPAGO" | "SYSTEM";
  meta?: Record<string, string | number | boolean | null | undefined>;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productCode: number;
  productTitle: string;
  colorName: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  photoUrl?: string | null;
}

export interface Order {
  id: number;
  code: number;
  customerName: string;
  customerFirstName?: string | null;
  customerLastName?: string | null;
  customerPhone: string;
  customerEmail: string;
  customerDni: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string | null;
  postalCode?: string | null;
  deliveryNotes?: string | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  couponCode?: string | null;
  status: OrderStatus;
  paymentMethod?: PaymentMethod | null;
  paymentStatus?: PaymentStatus | null;
  paymentExternalId?: string | null;
  paymentDetails?: GatewayPaymentDetails | null;
  paymentDiscountCents?: number;
  timeline?: OrderTimelineEvent[];
  customerId?: number | null;
  commerceId?: number | null;
  transferReceiptUrl?: string | null;
  transferReceiptUploadedAt?: number | null;
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
  items?: OrderItem[];
  claim?: OrderClaim | null;
}

export interface CreateOrderItemInput {
  productId?: number | null;
  productCode: number;
  productTitle: string;
  colorName: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
  photoUrl?: string | null;
}

export interface CreateOrderInput {
  customerName?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone: string;
  customerEmail: string;
  customerDni: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string | null;
  postalCode?: string | null;
  deliveryNotes?: string | null;
  shippingCents?: number;
  discountCents?: number;
  paymentMethod?: PaymentMethod;
  paymentDiscountCents?: number;
  transferReceiptUrl?: string | null;
  transferReceiptUploadedAt?: number | null;
  couponCode?: string | null;
  customerId?: number | null;
  commerceId?: number | null;
  baseUrl?: string;
  idempotencyKey?: string | null;
  notes?: string | null;
  items: CreateOrderItemInput[];
}

