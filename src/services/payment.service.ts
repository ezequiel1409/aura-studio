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
import { Order, OrderTimelineEvent } from "../domain/order/types";
import { appendOrderTimelineEvent } from "../domain/order/rules";
import {
  BankTransferDetails,
  GatewayPaymentDetails,
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
import {
  commitOrderStockDeduction,
  hasOrderDeductedStock,
  notifyOrderPaymentAccepted,
  notifyOrderRefunded,
  updateOrderStatus,
} from "./order.service";
import { getShowroomSettings } from "./settings.service";

const pendingOrderReconciliations = new Map<number, Promise<void>>();

export function getConfiguredMercadoPagoPublicKey(): string | null {
  const env = getEnv();
  const key = process.env.MP_PUBLIC_KEY || env.MP_PUBLIC_KEY;
  if (
    !key ||
    key.startsWith("TEST-00000000") ||
    key.startsWith("test_mock_")
  ) {
    return null;
  }
  return key.trim();
}

function buildMercadoPagoAdapter(baseUrl?: string): MercadoPagoPaymentAdapter {
  const env = getEnv();
  return new MercadoPagoPaymentAdapter({
    accessToken: process.env.MP_ACCESS_TOKEN || env.MP_ACCESS_TOKEN,
    publicKey: process.env.MP_PUBLIC_KEY || env.MP_PUBLIC_KEY,
    webhookSecret: process.env.MP_WEBHOOK_SECRET || env.MP_WEBHOOK_SECRET,
    sandbox: (process.env.MP_SANDBOX ?? env.MP_SANDBOX) !== "false",
    baseUrl,
  });
}

function hasConfiguredRealMercadoPagoToken(): boolean {
  const env = getEnv();
  const activeToken = process.env.MP_ACCESS_TOKEN || env.MP_ACCESS_TOKEN;
  return (
    Boolean(activeToken) &&
    !activeToken.startsWith("TEST-00000000") &&
    !activeToken.startsWith("test_mock_")
  );
}

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

  if (method === "MERCADOPAGO") {
    const adapter = buildMercadoPagoAdapter(options?.baseUrl);

    const result = await adapter.createPaymentPreference(order, {
      ...options,
      brandName: settings.showroomName,
      reservationHours: settings.reservationHours,
      categoryId: settings.businessVertical || "fashion",
      mpSettings: {
        binaryMode: settings.mercadopagoBinaryMode,
        maxInstallments: settings.mercadopagoMaxInstallments,
        excludedPaymentTypes: settings.mercadopagoExcludedPaymentTypes,
        offlineExpirationDays: settings.mercadopagoOfflineExpirationDays,
      },
    });
    const now = Math.floor(Date.now() / 1000);
    if (result.preferenceId && deps.orderRepo.updatePayment) {
      const mergedDetails: GatewayPaymentDetails = {
        ...(order.paymentDetails || { provider: "MERCADOPAGO" }),
        provider: "MERCADOPAGO",
        preferenceId: result.preferenceId,
      };
      await deps.orderRepo.updatePayment(order.id, {
        paymentStatus: "PENDING",
        paymentExternalId: result.preferenceId,
        paymentDetails: mergedDetails,
        updatedAt: now,
      });
    }
    if (typeof deps.orderRepo.updateTimeline === "function") {
      const timeline = appendOrderTimelineEvent(order.timeline, {
        at: now,
        type: "PAYMENT_PREFERENCE_CREATED",
        title: "Preferencia de pago generada en Mercado Pago",
        description: result.preferenceId
          ? `Preferencia ${result.preferenceId} lista para abonar.`
          : "Enlace de pago generado en Mercado Pago.",
        actor: "MERCADOPAGO",
        meta: {
          preferenceId: result.preferenceId || null,
        },
      });
      await deps.orderRepo.updateTimeline(order.id, timeline, now);
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
 * Verifica que el monto informado por la pasarela coincida exactamente con el total de la orden (SRP).
 */
function assertPaymentAmountMatchesOrder(order: Order, reportedAmountCents: number): void {
  if (reportedAmountCents > 0 && reportedAmountCents !== order.totalCents) {
    throw new ValidationError(
      `El importe informado por la pasarela (${reportedAmountCents}) no coincide con el total de la orden (${order.totalCents}).`
    );
  }
}

async function withOrderReconciliationLock(orderId: number, work: () => Promise<void>): Promise<void> {
  const inFlight = pendingOrderReconciliations.get(orderId);
  const nextTask = (inFlight ? inFlight.catch(() => {}) : Promise.resolve()).then(work);
  pendingOrderReconciliations.set(orderId, nextTask);
  try {
    await nextTask;
  } finally {
    if (pendingOrderReconciliations.get(orderId) === nextTask) {
      pendingOrderReconciliations.delete(orderId);
    }
  }
}

function formatGatewayDetailsSummary(details?: GatewayPaymentDetails | null): string | null {
  if (!details) return null;
  const parts: string[] = [];
  if (details.paymentMethodId) {
    parts.push(
      details.cardLastFour
        ? `${details.paymentMethodId.toUpperCase()} ···· ${details.cardLastFour}`
        : details.paymentMethodId.toUpperCase()
    );
  }
  if (details.installments && details.installments > 0) {
    parts.push(
      details.installments === 1
        ? "1 pago"
        : `${details.installments} cuotas`
    );
  }
  if (details.paymentId) {
    parts.push(`ID ${details.paymentId}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Registra el "Pago Aceptado" (AUTHORIZED) proveniente del callback/webhook de la pasarela,
 * descuenta el stock diferido de forma atómica si aún no se debitó, guarda detalles completos y actualiza el timeline (SRP).
 */
async function reconcileAcceptedGatewayPayment(
  result: PaymentVerificationResult,
  deps: GlobalAppDeps,
  source: "WEBHOOK" | "RETURN" = "WEBHOOK"
): Promise<void> {
  if (!result.orderCode) return;

  const initialOrder = await deps.orderRepo.findByCode(result.orderCode);
  if (!initialOrder) return;

  await withOrderReconciliationLock(initialOrder.id, async () => {
    const order = (await deps.orderRepo.findById(initialOrder.id)) || initialOrder;

    assertPaymentAmountMatchesOrder(order, result.amountCents);

    if (order.paymentStatus === "PAID") {
      return;
    }

    if (order.status === "CANCELLED" && hasOrderDeductedStock(order)) {
      return;
    }

    const wasAlreadyAccepted = order.paymentStatus === "AUTHORIZED";
    const now = Math.floor(Date.now() / 1000);
    let nextTimeline: OrderTimelineEvent[] = order.timeline ?? [];

    const mergedDetails: GatewayPaymentDetails = {
      ...(order.paymentDetails || { provider: "MERCADOPAGO" }),
      ...(result.paymentDetails || {}),
      provider: "MERCADOPAGO",
      paymentId: result.paymentDetails?.paymentId || result.externalId,
    };

    const detailsSummary = formatGatewayDetailsSummary(mergedDetails);
    if (!wasAlreadyAccepted) {
      nextTimeline = appendOrderTimelineEvent(nextTimeline, {
        at: now,
        type: source === "RETURN" ? "PAYMENT_GATEWAY_RETURN" : "PAYMENT_WEBHOOK_RECEIVED",
        title:
          source === "RETURN"
            ? "Retorno aprobado verificado con Mercado Pago"
            : "Webhook aprobado recibido de Mercado Pago",
        description: detailsSummary || `Pago ${result.externalId} verificado correctamente.`,
        actor: "MERCADOPAGO",
        meta: {
          paymentId: result.externalId,
          installments: mergedDetails.installments ?? null,
          paymentMethodId: mergedDetails.paymentMethodId ?? null,
        },
      });
    }

    if (!hasOrderDeductedStock(order)) {
      await commitOrderStockDeduction(order, deps, now * 1000);
      if (order.status === "CANCELLED") {
        await deps.orderRepo.updateStatus(order.id, "PENDING", now);
      }
      nextTimeline = appendOrderTimelineEvent(nextTimeline, {
        at: now,
        type: "STOCK_DEDUCTED",
        title: "Stock descontado tras aprobación",
        description: "Las unidades de la orden se descontaron al acreditarse la operación.",
        actor: "SYSTEM",
      });
    }

    if (!wasAlreadyAccepted) {
      nextTimeline = appendOrderTimelineEvent(nextTimeline, {
        at: now,
        type: "PAYMENT_AUTHORIZED",
        title: "Pago aceptado (pendiente de confirmación final)",
        description: detailsSummary,
        actor: "MERCADOPAGO",
      });
    }

    let updatedOrder = order;
    if (deps.orderRepo.updatePayment) {
      updatedOrder = await deps.orderRepo.updatePayment(order.id, {
        paymentStatus: "AUTHORIZED",
        paymentExternalId: result.externalId,
        paymentDetails: mergedDetails,
        updatedAt: now,
      });
    }

    if (!wasAlreadyAccepted) {
      if (deps.emailService && updatedOrder.customerEmail) {
        nextTimeline = appendOrderTimelineEvent(nextTimeline, {
          at: now,
          type: "EMAIL_SENT",
          title: "Correo de Pago Aceptado enviado",
          description: `Notificación enviada a ${updatedOrder.customerEmail}.`,
          actor: "SYSTEM",
        });
      }
      notifyOrderPaymentAccepted({ ...updatedOrder, paymentDetails: mergedDetails }, deps);
    }

    if (
      typeof deps.orderRepo.updateTimeline === "function" &&
      nextTimeline.length > (order.timeline?.length || 0)
    ) {
      await deps.orderRepo.updateTimeline(order.id, nextTimeline, now);
    }
  });
}

/**
 * Registra un rechazo de pago informado por la pasarela sin sobrescribir pagos ya acreditados (SRP).
 */
async function reconcileRejectedGatewayPayment(
  result: PaymentVerificationResult,
  deps: GlobalAppDeps,
  source: "WEBHOOK" | "RETURN" = "WEBHOOK"
): Promise<void> {
  if (!result.orderCode) return;
  const order = await deps.orderRepo.findByCode(result.orderCode);
  if (!order || order.paymentStatus === "PAID") return;

  const now = Math.floor(Date.now() / 1000);
  const mergedDetails: GatewayPaymentDetails = {
    ...(order.paymentDetails || { provider: "MERCADOPAGO" }),
    ...(result.paymentDetails || {}),
    provider: "MERCADOPAGO",
    paymentId: result.paymentDetails?.paymentId || result.externalId,
  };

  if (deps.orderRepo.updatePayment) {
    await deps.orderRepo.updatePayment(order.id, {
      paymentStatus: "REJECTED",
      paymentExternalId: result.externalId,
      paymentDetails: mergedDetails,
      updatedAt: now,
    });
  }

  if (typeof deps.orderRepo.updateTimeline === "function") {
    const timeline = appendOrderTimelineEvent(order.timeline, {
      at: now,
      type: "PAYMENT_REJECTED",
      title:
        source === "RETURN"
          ? "Pago rechazado al volver de Mercado Pago"
          : "Webhook de rechazo recibido",
      description: mergedDetails.statusDetail
        ? `Motivo informado: ${mergedDetails.statusDetail}`
        : `La operación ${result.externalId} fue rechazada.`,
      actor: "MERCADOPAGO",
      meta: {
        paymentId: result.externalId,
        statusDetail: mergedDetails.statusDetail ?? null,
      },
    });
    await deps.orderRepo.updateTimeline(order.id, timeline, now);
  }
}

/**
 * Verifica directamente con la API de Mercado Pago el retorno del cliente tras pagar
 * para conciliar la orden y descontar stock solo cuando la operación resulta aprobada (SRP).
 */
async function verifyAndReconcileMercadoPagoReturn(
  orderCode: number,
  paymentId: string | null,
  paymentStatusParam: string | null,
  deps: GlobalAppDeps
): Promise<void> {
  const isPositiveReturn =
    paymentStatusParam === "approved" || paymentStatusParam === "authorized";

  if (!isPositiveReturn || !paymentId || paymentId === "null" || paymentId.startsWith("mock_pref_")) {
    return;
  }

  if (!hasConfiguredRealMercadoPagoToken()) {
    return;
  }

  const adapter = buildMercadoPagoAdapter();
  const verification = await adapter.verifyPayment(paymentId);

  if (verification.orderCode && verification.orderCode !== orderCode) {
    throw new ValidationError("El pago verificado no corresponde al número de orden indicado.");
  }

  if (verification.status === "AUTHORIZED" || verification.status === "PAID") {
    await reconcileAcceptedGatewayPayment({ ...verification, orderCode }, deps, "RETURN");
  } else if (verification.status === "REJECTED") {
    await reconcileRejectedGatewayPayment({ ...verification, orderCode }, deps, "RETURN");
  }
}

/**
 * Obtiene el resumen de una orden para la pantalla de Checkout Pro Sandbox / Callback (SRP).
 */
export async function getCheckoutSandboxOrderSummary(
  orderCode: number,
  paymentId: string | null,
  deps: GlobalAppDeps,
  options?: { baseUrl?: string; isReturnCallback?: boolean; paymentStatusParam?: string | null }
) {
  let order = await deps.orderRepo.findByCode(orderCode);
  if (!order) {
    throw new OrderNotFoundError(orderCode);
  }

  // En modo sandbox/callback validamos que coincida el paymentExternalId si ya estaba fijado a un mock_pref
  if (
    order.paymentExternalId &&
    order.paymentExternalId.startsWith("mock_pref_") &&
    paymentId &&
    paymentId.startsWith("mock_pref_") &&
    order.paymentExternalId !== paymentId
  ) {
    throw new ValidationError("Identificador de preferencia de pago no válido para esta orden.");
  }

  if (
    options?.isReturnCallback &&
    order.paymentStatus !== "AUTHORIZED" &&
    order.paymentStatus !== "PAID"
  ) {
    try {
      await verifyAndReconcileMercadoPagoReturn(
        orderCode,
        paymentId,
        options.paymentStatusParam ?? null,
        deps
      );
      order = (await deps.orderRepo.findByCode(orderCode)) || order;
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      console.error("[CheckoutPro] Error al verificar retorno directo de Mercado Pago:", err);
    }
  }

  let externalCheckoutUrl: string | null = null;
  const hasRealMpToken = hasConfiguredRealMercadoPagoToken();

  // Si ya hay un MP_ACCESS_TOKEN real configurado y la orden sigue pendiente sin venir de un callback de retorno,
  // generamos la preferencia oficial en Mercado Pago para redirigir directo al link de ellos (sandbox.mercadopago.com.ar).
  if (
    hasRealMpToken &&
    order.paymentStatus === "PENDING" &&
    !options?.isReturnCallback
  ) {
    try {
      const pref = await createOrderPaymentPreference(
        { ...order, paymentMethod: "MERCADOPAGO" },
        deps,
        { baseUrl: options?.baseUrl }
      );
      if (pref.redirectUrl && pref.redirectUrl.startsWith("https://")) {
        externalCheckoutUrl = pref.redirectUrl;
      }
    } catch (err) {
      console.error("[CheckoutPro] Error al generar preferencia externa para orden existente:", err);
    }
  }

  const hydratedItems = await Promise.all(
    (order.items || []).map(async (i) => {
      let photoUrl = i.photoUrl || null;
      if (!photoUrl && deps.productRepo) {
        try {
          const prod = i.productId
            ? await deps.productRepo.findById(i.productId)
            : await deps.productRepo.findByCode(i.productCode);
          photoUrl = prod?.photos?.[0]?.keyThumb || prod?.photos?.[0]?.keyFull || null;
        } catch {
          // Ignorar fallo de lectura de foto
        }
      }
      return {
        productCode: i.productCode,
        productTitle: i.productTitle,
        colorName: i.colorName,
        size: i.size,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        photoUrl,
      };
    })
  );

  return {
    id: order.id,
    code: order.code,
    customerName: order.customerName,
    customerEmail: order.customerEmail || "",
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: order.deliveryAddress || null,
    totalCents: order.totalCents,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    discountCents: order.discountCents,
    paymentDiscountCents: order.paymentDiscountCents || 0,
    paymentMethod: order.paymentMethod || "MERCADOPAGO",
    paymentStatus: order.paymentStatus || "PENDING",
    paymentDetails: order.paymentDetails ?? null,
    status: order.status,
    externalCheckoutUrl,
    items: hydratedItems,
  };
}

/**
 * Cancela una orden de pasarela externa abandonada al volver al checkout sin pagar.
 * Si la orden ya había descontado stock (ej. otro método), lo restaura automáticamente sin enviar correo de cancelación (SRP).
 */
export async function cancelAbandonedGatewayOrder(
  orderCode: number,
  deps: GlobalAppDeps
): Promise<void> {
  const order = await deps.orderRepo.findByCode(orderCode);
  if (!order) return;

  if (
    order.status === "PENDING" &&
    order.paymentStatus !== "PAID" &&
    order.paymentStatus !== "AUTHORIZED"
  ) {
    const now = Math.floor(Date.now() / 1000);
    if (hasOrderDeductedStock(order) && deps.productRepo) {
      for (const item of order.items || []) {
        if (item.productId) {
          await deps.productRepo.restoreStock(
            item.productId,
            item.colorName,
            item.size,
            item.quantity,
            now * 1000
          );
        }
      }
    }

    await deps.orderRepo.updateStatus(order.id, "CANCELLED", now);
    if (deps.orderRepo.updatePayment) {
      await deps.orderRepo.updatePayment(order.id, {
        paymentStatus: "REJECTED",
        updatedAt: now,
      });
    }
    if (typeof deps.orderRepo.updateTimeline === "function") {
      const timeline = appendOrderTimelineEvent(order.timeline, {
        at: now,
        type: "ORDER_CANCELLED",
        title: "Intento de pago abandonado / cancelado",
        description: "El comprador volvió al checkout sin completar el pago en pasarela.",
        actor: "BUYER",
      });
      await deps.orderRepo.updateTimeline(order.id, timeline, now);
    }
  }
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
    const adapter = buildMercadoPagoAdapter();

    const result = await adapter.processWebhook(payload, headers);
    if (result && (result.status === "AUTHORIZED" || result.status === "PAID")) {
      await reconcileAcceptedGatewayPayment(result, deps, "WEBHOOK");
    } else if (result && result.status === "REJECTED") {
      await reconcileRejectedGatewayPayment(result, deps, "WEBHOOK");
    }
    return result;
  }

  return null;
}

/**
 * Ejecuta la cancelación o reembolso total de un cobro desde el Backoffice (incluyendo API de Mercado Pago si aplica),
 * restituye stock si estaba descontado, actualiza el timeline y envía correo de aviso al cliente (SRP).
 */
export async function refundOrCancelOrderPayment(
  orderId: number,
  deps: GlobalAppDeps,
  options?: { reason?: string }
): Promise<Order> {
  const order = await deps.orderRepo.findById(orderId);
  if (!order) {
    throw new OrderNotFoundError(orderId);
  }

  if (order.paymentStatus === "REFUNDED") {
    return order;
  }

  const now = Math.floor(Date.now() / 1000);
  const wasCapturedOrAuthorized =
    order.paymentStatus === "AUTHORIZED" || order.paymentStatus === "PAID";
  let nextTimeline: OrderTimelineEvent[] = order.timeline ?? [];
  let updatedDetails: GatewayPaymentDetails = {
    ...(order.paymentDetails || { provider: order.paymentMethod || "MANUAL" }),
  };

  if (order.paymentMethod === "MERCADOPAGO") {
    const candidatePaymentId =
      order.paymentDetails?.paymentId ||
      (order.paymentExternalId &&
      order.paymentExternalId !== order.paymentDetails?.preferenceId &&
      !order.paymentExternalId.startsWith("mock_pref_")
        ? order.paymentExternalId
        : null);

    if (candidatePaymentId) {
      const adapter = buildMercadoPagoAdapter();
      const idempotencyKey = `refund_ord_${order.code}_${now}`;
      if (wasCapturedOrAuthorized) {
        const refundRes = await adapter.refundPayment(candidatePaymentId, undefined, idempotencyKey);
        updatedDetails = {
          ...updatedDetails,
          provider: "MERCADOPAGO",
          paymentId: candidatePaymentId,
          refundId: refundRes.refundId || updatedDetails.refundId || null,
          refundedAmountCents: refundRes.refundedAmountCents ?? order.totalCents,
          refundedAt: now,
          statusDetail: refundRes.details?.statusDetail || "refunded",
        };
      } else {
        const cancelRes = await adapter.cancelPayment(candidatePaymentId, idempotencyKey);
        updatedDetails = {
          ...updatedDetails,
          provider: "MERCADOPAGO",
          paymentId: candidatePaymentId,
          cancelledAt: now,
          statusDetail: cancelRes.details?.statusDetail || "by_collector",
        };
      }
    } else if (wasCapturedOrAuthorized) {
      updatedDetails = {
        ...updatedDetails,
        refundedAmountCents: order.totalCents,
        refundedAt: now,
        statusDetail: "manual_refund",
      };
    } else {
      updatedDetails = {
        ...updatedDetails,
        cancelledAt: now,
        statusDetail: "cancelled_before_payment",
      };
    }
  } else if (wasCapturedOrAuthorized) {
    updatedDetails = {
      ...updatedDetails,
      refundedAmountCents: order.totalCents,
      refundedAt: now,
      statusDetail: "manual_refund",
    };
  }

  if (wasCapturedOrAuthorized) {
    nextTimeline = appendOrderTimelineEvent(nextTimeline, {
      at: now,
      type: "PAYMENT_REFUNDED",
      title: "Pago reembolsado al comprador",
      description: updatedDetails.refundId
        ? `Reembolso confirmado en Mercado Pago (ID ${updatedDetails.refundId}).`
        : options?.reason || "Devolución total registrada desde el panel administrativo.",
      actor: "ADMIN",
      meta: {
        refundId: updatedDetails.refundId ?? null,
        amountCents: updatedDetails.refundedAmountCents ?? order.totalCents,
      },
    });
  } else {
    nextTimeline = appendOrderTimelineEvent(nextTimeline, {
      at: now,
      type: "PAYMENT_CANCELLED",
      title: "Cobro pendiente cancelado",
      description: options?.reason || "Operación anulada antes de la acreditación.",
      actor: "ADMIN",
    });
  }

  if (hasOrderDeductedStock(order) && deps.productRepo) {
    for (const item of order.items || []) {
      if (item.productId) {
        await deps.productRepo.restoreStock(
          item.productId,
          item.colorName,
          item.size,
          item.quantity,
          now * 1000
        );
      }
    }
    nextTimeline = appendOrderTimelineEvent(nextTimeline, {
      at: now,
      type: "STOCK_RESTORED",
      title: "Stock restituido tras cancelación / reembolso",
      description: "Las prendas de esta orden volvieron al catálogo disponible.",
      actor: "SYSTEM",
    });
  }

  const nextPaymentStatus: PaymentStatus = wasCapturedOrAuthorized ? "REFUNDED" : "REJECTED";
  if (deps.orderRepo.updatePayment) {
    await deps.orderRepo.updatePayment(order.id, {
      paymentStatus: nextPaymentStatus,
      paymentDetails: updatedDetails,
      updatedAt: now,
    });
  }

  if (order.status !== "CANCELLED") {
    await deps.orderRepo.updateStatus(order.id, "CANCELLED", now);
    nextTimeline = appendOrderTimelineEvent(nextTimeline, {
      at: now,
      type: "ORDER_CANCELLED",
      title: "Orden cancelada",
      description: wasCapturedOrAuthorized
        ? "Orden cerrada y marcada como cancelada tras emitir el reembolso."
        : "Orden cancelada desde administración.",
      actor: "ADMIN",
    });
  }

  if (order.customerEmail && deps.emailService) {
    nextTimeline = appendOrderTimelineEvent(nextTimeline, {
      at: now,
      type: "EMAIL_SENT",
      title: wasCapturedOrAuthorized
        ? "Correo de reembolso enviado al cliente"
        : "Correo de cancelación enviado al cliente",
      description: `Notificación enviada a ${order.customerEmail}.`,
      actor: "SYSTEM",
    });
  }

  if (typeof deps.orderRepo.updateTimeline === "function") {
    await deps.orderRepo.updateTimeline(order.id, nextTimeline, now);
  }

  const refreshed = (await deps.orderRepo.findById(order.id))!;

  if (wasCapturedOrAuthorized) {
    notifyOrderRefunded(refreshed, deps);
  } else if (deps.emailService && refreshed.customerEmail) {
    getShowroomSettings(deps)
      .then((settings) =>
        deps.emailService?.sendOrderCancelledEmail?.(refreshed.customerEmail!, {
          orderId: refreshed.id,
          orderCode: refreshed.code,
          formattedCode: `#ORD-${refreshed.code.toString().padStart(3, "0")}`,
          customerName: refreshed.customerName,
          customerEmail: refreshed.customerEmail!,
          customerPhone: refreshed.customerPhone,
          deliveryMethod: refreshed.deliveryMethod,
          deliveryAddress: refreshed.deliveryAddress,
          deliveryNotes: refreshed.deliveryNotes,
          items: (refreshed.items || []).map((i) => ({
            productTitle: i.productTitle,
            productCode: i.productCode,
            colorName: i.colorName,
            size: i.size,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            photoUrl: i.photoUrl,
          })),
          subtotalCents: refreshed.subtotalCents,
          shippingCents: refreshed.shippingCents,
          discountCents: refreshed.discountCents,
          totalCents: refreshed.totalCents,
          currency: refreshed.currency || "ARS",
          paymentMethod: refreshed.paymentMethod || "MERCADOPAGO",
          paymentStatus: refreshed.paymentStatus || "REJECTED",
          paymentDetails: refreshed.paymentDetails ?? null,
          showroomAddress: settings.address,
          brandName: settings.showroomName,
          supportWhatsapp: settings.whatsappNumber,
          emailCustomization: settings.emailCustomization,
        })
      )
      .catch(() => {});
  }

  return refreshed;
}

/**
 * Marca manualmente el estado de pago de una orden desde el Backoffice (ej. al confirmar pago o reembolsar).
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

  if (paymentStatus === "REFUNDED") {
    return refundOrCancelOrderPayment(orderId, deps);
  }

  if (paymentStatus === "PAID") {
    if (order.status !== "PAID" || order.paymentStatus !== "PAID") {
      return updateOrderStatus(order.id, "PAID", deps);
    }
    return order;
  }

  const now = Math.floor(Date.now() / 1000);
  const wasAlreadyAccepted = order.paymentStatus === "AUTHORIZED";

  if (paymentStatus === "AUTHORIZED" && !hasOrderDeductedStock(order)) {
    await commitOrderStockDeduction(order, deps, now * 1000);
  }

  if (deps.orderRepo.updatePayment) {
    await deps.orderRepo.updatePayment(order.id, {
      paymentStatus,
      updatedAt: now,
    });
  }

  if (typeof deps.orderRepo.updateTimeline === "function") {
    const timeline = appendOrderTimelineEvent(order.timeline, {
      at: now,
      type: paymentStatus === "AUTHORIZED" ? "PAYMENT_AUTHORIZED" : paymentStatus === "REJECTED" ? "PAYMENT_REJECTED" : "PAYMENT_WEBHOOK_RECEIVED",
      title:
        paymentStatus === "AUTHORIZED"
          ? "Cobro marcado manualmente como Aceptado"
          : paymentStatus === "REJECTED"
          ? "Cobro marcado manualmente como Rechazado"
          : "Estado de cobro revertido a Pendiente",
      actor: "ADMIN",
    });
    await deps.orderRepo.updateTimeline(order.id, timeline, now);
  }

  const refreshed = (await deps.orderRepo.findById(orderId))!;

  if (paymentStatus === "AUTHORIZED" && !wasAlreadyAccepted) {
    notifyOrderPaymentAccepted(refreshed, deps);
  }

  return refreshed;
}
