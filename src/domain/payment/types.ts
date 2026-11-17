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

export interface GatewayPaymentDetails {
  provider: string;
  preferenceId?: string | null;
  paymentId?: string | null;
  paymentMethodId?: string | null;
  paymentTypeId?: string | null;
  installments?: number | null;
  installmentAmountCents?: number | null;
  transactionAmountCents?: number | null;
  totalPaidCents?: number | null;
  cardLastFour?: string | null;
  cardFirstSix?: string | null;
  statusDetail?: string | null;
  dateApproved?: string | null;
  refundId?: string | null;
  refundedAmountCents?: number | null;
  refundedAt?: number | null;
  cancelledAt?: number | null;
}

export interface GatewayActionResult {
  externalId: string;
  status: PaymentStatus;
  refundId?: string | null;
  refundedAmountCents?: number | null;
  details?: GatewayPaymentDetails;
}

export interface PaymentVerificationResult {
  orderCode?: number;
  externalId: string;
  status: PaymentStatus;
  amountCents: number;
  paymentDate?: number;
  paymentDetails?: GatewayPaymentDetails;
  details?: Record<string, unknown>;
}
