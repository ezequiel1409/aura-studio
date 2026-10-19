import { OrderClaim } from "../claim/types";

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
  customerEmail?: string | null;
  customerDni?: string | null;
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
  customerEmail?: string | null;
  customerDni?: string | null;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  shippingCents?: number;
  discountCents?: number;
  couponCode?: string | null;
  customerId?: number | null;
  commerceId?: number | null;
  notes?: string | null;
  items: CreateOrderItemInput[];
}
