import { Order } from "../../order/types";
import {
  GatewayActionResult,
  PaymentMethod,
  PaymentPreferenceResult,
  PaymentVerificationResult,
} from "../types";

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

  /**
   * Cancela un pago pendiente/no capturado en la pasarela.
   */
  cancelPayment?(paymentId: string, idempotencyKey?: string): Promise<GatewayActionResult>;

  /**
   * Reembolsa total o parcialmente un pago acreditado/autorizado en la pasarela.
   */
  refundPayment?(
    paymentId: string,
    amountCents?: number,
    idempotencyKey?: string
  ): Promise<GatewayActionResult>;
}
