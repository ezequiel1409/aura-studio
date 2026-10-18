export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

export interface Coupon {
  id: number;
  code: string;
  description?: string | null;
  type: CouponType;
  value: number;
  minOrderCents?: number | null;
  maxDiscountCents?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  maxUsesPerEmail?: number | null; // Tope por email/usuario (ej: 1, o null para ilimitado)
  isActive: boolean;
  startsAt?: number | null;
  expiresAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface CouponRedemption {
  id: number;
  couponId: number;
  orderId?: number | null;
  customerEmail: string;
  customerPhone?: string | null;
  customerDni?: string | null;
  customerId?: number | null;
  discountCents: number;
  createdAt: number;
}

export interface ValidateCouponInput {
  code: string;
  email?: string | null;
  phone?: string | null;
  dni?: string | null;
  subtotalCents: number;
  shippingCents?: number;
}

export interface ValidateCouponResult {
  valid: boolean;
  code: string;
  type?: CouponType;
  value?: number;
  discountCents: number;
  freeShipping?: boolean;
  message: string;
  couponId?: number;
}
