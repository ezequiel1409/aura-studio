import { Order } from "../../../domain/order/types";
import { PaymentGatewayPort } from "../../../domain/payment/ports/payment-gateway.port";
import {
  PaymentPreferenceResult,
  PaymentVerificationResult,
} from "../../../domain/payment/types";

export interface CashPaymentAdapterConfig {
  instructions?: string | null;
}

/**
 * Adaptador de pagos para Efectivo / Contra entrega / Pago en Showroom.
 */
export class CashOnDeliveryPaymentAdapter implements PaymentGatewayPort {
  readonly method = "CASH" as const;

  constructor(private readonly config: CashPaymentAdapterConfig = {}) {}

  async createPaymentPreference(
    order: Order,
    options?: Record<string, unknown>
  ): Promise<PaymentPreferenceResult> {
    const defaultInstructions =
      order.deliveryMethod === "PICKUP"
        ? `Podés abonar en efectivo al momento de retirar tu pedido por el Showroom.`
        : `Podés abonar en efectivo al cadete al momento de recibir tu paquete.`;

    const instructions =
      (options?.instructions as string) || this.config.instructions || defaultInstructions;

    return {
      method: "CASH",
      status: "PENDING",
      instructions,
      discountCents: 0,
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
