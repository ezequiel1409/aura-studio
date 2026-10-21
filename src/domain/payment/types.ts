export type PaymentMethod =
  | "MERCADOPAGO"
  | "PAYWAY"
  | "GETNET"
  | "MODO"
  | "GOOGLEPAY"
  | "TRANSFER"
  | "CASH"
  | "STRIPE"
  | "WHATSAPP";

export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "REJECTED" | "REFUNDED";

export interface BankTransferDetails {
  bankName?: string | null;
  accountHolder?: string | null;
  cbu?: string | null;
  alias?: string | null;
  cuit?: string | null;
  discountPercent: number; // e.g. 10 para 10% OFF
}

export interface CashPaymentDetails {
  instructions?: string | null;
  discountPercent?: number;
}

export interface PaymentMethodConfig {
  method: PaymentMethod;
  name: string;
  description: string;
  enabled: boolean;
  discountPercent?: number;
  badge?: string;
}

export interface PaymentPreferenceResult {
  method: PaymentMethod;
  status: PaymentStatus;
  preferenceId?: string;
  paymentUrl?: string;
  redirectUrl?: string;
  instructions?: string;
  bankDetails?: BankTransferDetails;
  discountCents?: number;
}

export interface PaymentVerificationResult {
  orderCode?: number;
  externalId: string;
  status: PaymentStatus;
  amountCents: number;
  paymentDate?: number;
  details?: Record<string, unknown>;
}
