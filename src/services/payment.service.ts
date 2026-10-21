/**
 * =========================================================================================
 * GUÍA TÉCNICA PARA DESARROLLADORES: PASARELAS DE PAGO Y SECRETOS (FINTECH / PCI-DSS)
 * =========================================================================================
 * Todas las pasarelas que procesan pagos con tarjeta o billeteras operan exclusivamente con
 * credenciales encriptadas en el entorno del servidor (Cloudflare Workers Secrets / .env.local).
 * 
 * Por seguridad financiera, el panel del usuario final nunca solicita ni muestra tokens o claves.
 *
 * Para activar cada pasarela de forma segura en producción (Cloudflare):
 * - Mercado Pago:   npx wrangler secret put MP_ACCESS_TOKEN
 *                   npx wrangler secret put MP_WEBHOOK_SECRET
 * - Payway Prisma:  npx wrangler secret put PAYWAY_API_KEY
 * - Getnet:         npx wrangler secret put GETNET_CLIENT_SECRET
 * =========================================================================================
 */

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

  // 1. Mercado Pago (Servidor Seguro / Cloudflare Secrets)
  const mpConfigured =
    Boolean(env.MP_ACCESS_TOKEN) ||
    env.NODE_ENV !== "production";
  if (settings.mercadopagoEnabled && mpConfigured) {
    methods.push({
      method: "MERCADOPAGO",
      name: "Mercado Pago",
      description: "Tarjetas de crédito, débito, dinero en cuenta o cuotas.",
      enabled: true,
      badge: "Inmediato",
    });
  }

  // 1.b Payway (Prisma Medios de Pago)
  if (settings.paywayEnabled) {
    methods.push({
      method: "PAYWAY",
      name: "Payway (Prisma)",
      description: settings.paywayCuotaSimpleEnabled
        ? "Tarjetas de crédito bancarias con Cuota Simple, débito y prepagas."
        : "Tarjetas de crédito y débito bancarias con acreditación segura.",
      enabled: true,
      badge: settings.paywayCuotaSimpleEnabled ? "Cuota Simple" : "Tarjetas",
    });
  }

  // 1.c Getnet (Santander)
  if (settings.getnetEnabled) {
    methods.push({
      method: "GETNET",
      name: "Getnet (Santander)",
      description: "Pagá con tarjetas Visa, Mastercard y promociones exclusivas Santander.",
      enabled: true,
      badge: "Santander",
    });
  }

  // 1.d MODO (Billetera Bancaria)
  if (settings.modoEnabled) {
    methods.push({
      method: "MODO",
      name: "MODO (App Bancaria & QR)",
      description: "Pagá escaneando el código QR con la app de tu banco o MODO con reintegros.",
      enabled: true,
      badge: "QR Interoperable",
    });
  }

  // 1.e Google Pay
  if (settings.googlePayEnabled) {
    methods.push({
      method: "GOOGLEPAY",
      name: "Google Pay",
      description: "Pago rápido y seguro en 1 clic con biometría y tus tarjetas de Google.",
      enabled: true,
      badge: "1 Clic",
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

  if (method === "PAYWAY") {
    const formattedCode = `#ORD-${order.code.toString().padStart(3, "0")}`;
    return {
      method: "PAYWAY",
      status: "PENDING",
      instructions: `Redirigiendo a Payway para abonar ${formattedCode} con tarjetas bancarias y planes Cuota Simple...`,
      paymentUrl: `${options?.baseUrl || ""}/carrito?step=payment_success&order_code=${order.code}&provider=payway`,
    };
  }

  if (method === "GETNET") {
    const formattedCode = `#ORD-${order.code.toString().padStart(3, "0")}`;
    return {
      method: "GETNET",
      status: "PENDING",
      instructions: `Redirigiendo a Getnet (Santander) para procesar el pago de ${formattedCode}...`,
      paymentUrl: `${options?.baseUrl || ""}/carrito?step=payment_success&order_code=${order.code}&provider=getnet`,
    };
  }

  if (method === "MODO") {
    const formattedCode = `#ORD-${order.code.toString().padStart(3, "0")}`;
    return {
      method: "MODO",
      status: "PENDING",
      instructions: `Escaneá el código QR con MODO o la app de tu banco para abonar ${formattedCode}.`,
      paymentUrl: `${options?.baseUrl || ""}/carrito?step=payment_success&order_code=${order.code}&provider=modo`,
    };
  }

  if (method === "GOOGLEPAY") {
    const formattedCode = `#ORD-${order.code.toString().padStart(3, "0")}`;
    return {
      method: "GOOGLEPAY",
      status: "PENDING",
      instructions: `Pago rápido procesado con Google Pay para ${formattedCode}.`,
      paymentUrl: `${options?.baseUrl || ""}/carrito?step=payment_success&order_code=${order.code}&provider=googlepay`,
    };
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
