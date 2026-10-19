import { Order } from "../../../domain/order/types";
import { PaymentGatewayPort } from "../../../domain/payment/ports/payment-gateway.port";
import {
  formatTransferInstructions,
} from "../../../domain/payment/rules";
import {
  BankTransferDetails,
  PaymentPreferenceResult,
  PaymentVerificationResult,
} from "../../../domain/payment/types";

export interface BankTransferAdapterConfig {
  bankDetails: BankTransferDetails;
}

/**
 * Adaptador de pagos para Transferencia Bancaria Directa (CBU/CVU/Alias).
 * Genera instrucciones inmediatas con código correlativo de referencia y descuento.
 */
export class BankTransferPaymentAdapter implements PaymentGatewayPort {
  readonly method = "TRANSFER" as const;

  constructor(private readonly config: BankTransferAdapterConfig) {}

  async createPaymentPreference(
    order: Order,
    options?: Record<string, unknown>
  ): Promise<PaymentPreferenceResult> {
    const details = (options?.bankDetails as BankTransferDetails) || this.config.bankDetails;
    const instructions = formatTransferInstructions(details, order.totalCents, order.code);

    return {
      method: "TRANSFER",
      status: "PENDING",
      instructions,
      bankDetails: details,
      discountCents: order.paymentDiscountCents || 0,
    };
  }

  async verifyPayment(externalId: string): Promise<PaymentVerificationResult> {
    return {
      externalId,
      status: "PENDING",
      amountCents: 0,
    };
  }
}
