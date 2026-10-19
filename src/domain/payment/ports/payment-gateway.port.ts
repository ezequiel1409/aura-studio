import { Order } from "../../order/types";
import { PaymentMethod, PaymentPreferenceResult, PaymentVerificationResult } from "../types";

/**
 * AR-16: Puerto de Dominio Hexagonal para Pasarelas y Métodos de Pago.
 * Desacopla la lógica de órdenes de las implementaciones concretas de proveedores.
 */
export interface PaymentGatewayPort {
  readonly method: PaymentMethod;

  /**
   * Genera la acción, preferencia o instrucciones de pago para la orden.
   */
  createPaymentPreference(
    order: Order,
    options?: Record<string, unknown>
  ): Promise<PaymentPreferenceResult>;

  /**
   * Consulta el estado de una transacción ante el proveedor.
   */
  verifyPayment(externalId: string): Promise<PaymentVerificationResult>;

  /**
   * Procesa la notificación asíncrona (webhook / IPN) del proveedor.
   */
  processWebhook?(
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<PaymentVerificationResult | null>;
}
