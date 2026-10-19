import { OrderNotFoundError, ValidationError } from "../domain/errors";
import { Order } from "../domain/order/types";
import {
  BankTransferDetails,
  PaymentMethod,
  PaymentMethodConfig,
  PaymentPreferenceResult,
  PaymentStatus,
  PaymentVerificationResult,
} from "../domain/payment/types";
import { GlobalAppDeps } from "../infra/db/connection";
import { BankTransferPaymentAdapter } from "../infra/payments/bank-transfer/bank-transfer.adapter";
import { CashOnDeliveryPaymentAdapter } from "../infra/payments/cash/cash-on-delivery.adapter";
import { MercadoPagoPaymentAdapter } from "../infra/payments/mercadopago/mercadopago.adapter";
import { getEnv } from "../lib/env";
import { getShowroomSettings } from "./settings.service";

/**
 * Obtiene la lista de métodos de pago activos y configurados para el comercio (BR-47).
 */
export async function getAvailablePaymentMethods(
  deps: GlobalAppDeps
): Promise<PaymentMethodConfig[]> {
  const settings = await getShowroomSettings(deps);
  const env = getEnv();

  const methods: PaymentMethodConfig[] = [];

  // 1. Mercado Pago
  const mpHasToken = Boolean(env.MP_ACCESS_TOKEN) || env.NODE_ENV !== "production";
  if (settings.mercadopagoEnabled && mpHasToken) {
    methods.push({
      method: "MERCADOPAGO",
      name: "Mercado Pago",
      description: "Tarjetas de crédito, débito, dinero en cuenta o cuotas.",
      enabled: true,
      badge: "Inmediato",
    });
  }

  // 2. Transferencia Bancaria
  if (settings.transferEnabled) {
    const discount = settings.transferDiscountPercent || 0;
    methods.push({
      method: "TRANSFER",
      name: "Transferencia Bancaria",
      description: `Aboná por CBU/CVU o Alias directo al comercio.${
        discount > 0 ? ` ¡${discount}% de descuento!` : ""
      }`,
      enabled: true,
      discountPercent: discount,
      badge: discount > 0 ? `${discount}% OFF` : undefined,
    });
  }

  // 3. Efectivo
  if (settings.cashEnabled) {
    methods.push({
      method: "CASH",
      name: "Efectivo al retirar / recibir",
      description: settings.cashNotes || "Aboná en efectivo al momento de recibir o retirar tu compra.",
      enabled: true,
    });
  }

  // 4. WhatsApp
  if (settings.whatsappPaymentEnabled) {
    methods.push({
      method: "WHATSAPP",
      name: "Coordinar por WhatsApp",
      description: "Asistencia directa con el showroom para coordinar tu pago.",
      enabled: true,
    });
  }

  return methods;
}

/**
 * Genera la preferencia o instrucciones de pago para una orden (BR-14, BR-47, AR-16).
 */
export async function createOrderPaymentPreference(
  order: Order,
  deps: GlobalAppDeps,
  options?: { baseUrl?: string }
): Promise<PaymentPreferenceResult> {
  const method = order.paymentMethod || "WHATSAPP";
  const settings = await getShowroomSettings(deps);
  const env = getEnv();

  if (method === "MERCADOPAGO") {
    const adapter = new MercadoPagoPaymentAdapter({
      accessToken: env.MP_ACCESS_TOKEN,
      publicKey: env.MP_PUBLIC_KEY,
      baseUrl: options?.baseUrl,
    });

    const result = await adapter.createPaymentPreference(order, options);
    if (result.preferenceId && deps.orderRepo.updatePayment) {
      await deps.orderRepo.updatePayment(order.id, {
        paymentStatus: "PENDING",
        paymentExternalId: result.preferenceId,
        updatedAt: Math.floor(Date.now() / 1000),
      });
    }
    return result;
  }

  if (method === "TRANSFER") {
    const bankDetails: BankTransferDetails = {
      bankName: settings.transferBankName,
      accountHolder: settings.transferAccountHolder,
      cbu: settings.transferCbu,
      alias: settings.transferAlias,
      cuit: settings.transferCuit,
      discountPercent: settings.transferDiscountPercent,
    };

    const adapter = new BankTransferPaymentAdapter({ bankDetails });
    return adapter.createPaymentPreference(order);
  }

  if (method === "CASH") {
    const adapter = new CashOnDeliveryPaymentAdapter({
      instructions: settings.cashNotes,
    });
    return adapter.createPaymentPreference(order);
  }

  // Fallback: WhatsApp
  return {
    method: "WHATSAPP",
    status: "PENDING",
    instructions: `Coordiná el pago de tu pedido #${order.code} directamente por WhatsApp.`,
  };
}

/**
 * Procesa la notificación (webhook) de una pasarela de pago y concilia la orden (AR-16).
 */
export async function processPaymentWebhook(
  provider: string,
  payload: unknown,
  headers: Record<string, string>,
  deps: GlobalAppDeps
): Promise<PaymentVerificationResult | null> {
  if (provider.toLowerCase() === "mercadopago") {
    const env = getEnv();
    const adapter = new MercadoPagoPaymentAdapter({
      accessToken: env.MP_ACCESS_TOKEN,
      publicKey: env.MP_PUBLIC_KEY,
    });

    const result = await adapter.processWebhook(payload, headers);
    if (result && result.status === "PAID" && result.orderCode) {
      const order = await deps.orderRepo.findByCode(result.orderCode);
      if (order) {
        const now = Math.floor(Date.now() / 1000);
        // Actualizar estado de pago y estado de la orden a PAID
        if (deps.orderRepo.updatePayment) {
          await deps.orderRepo.updatePayment(order.id, {
            paymentStatus: "PAID",
            paymentExternalId: result.externalId,
            updatedAt: now,
          });
        }
        await deps.orderRepo.updateStatus(order.id, "PAID", now);
      }
    }
    return result;
  }

  return null;
}

/**
 * Marca manualmente el estado de pago de una orden desde el Backoffice (ej. al verificar transferencia).
 */
export async function markOrderPaymentManually(
  orderId: number,
  paymentStatus: PaymentStatus,
  deps: GlobalAppDeps
): Promise<Order> {
  const order = await deps.orderRepo.findById(orderId);
  if (!order) {
    throw new OrderNotFoundError(orderId);
  }

  const now = Math.floor(Date.now() / 1000);
  if (deps.orderRepo.updatePayment) {
    await deps.orderRepo.updatePayment(order.id, {
      paymentStatus,
      updatedAt: now,
    });
  }

  if (paymentStatus === "PAID" && order.status !== "PAID") {
    return deps.orderRepo.updateStatus(order.id, "PAID", now);
  }

  const refreshed = await deps.orderRepo.findById(orderId);
  return refreshed!;
}
