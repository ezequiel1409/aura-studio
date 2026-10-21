import { OrderClaim } from "../claim/types";
import { PaymentMethod, PaymentStatus } from "../payment/types";

export type DeliveryMethod = "HOME_DELIVERY" | "MOTORCYCLE" | "PICKUP";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED";

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
  customerPhone: string;
  customerEmail: string;
  customerDni: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string | null;
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
  paymentDiscountCents?: number;
  customerId?: number | null;
  commerceId?: number | null;
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
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerDni: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  shippingCents?: number;
  discountCents?: number;
  paymentMethod?: PaymentMethod;
  paymentDiscountCents?: number;
  couponCode?: string | null;
  customerId?: number | null;
  commerceId?: number | null;
  baseUrl?: string;
  idempotencyKey?: string | null;
  notes?: string | null;
  items: CreateOrderItemInput[];
}

