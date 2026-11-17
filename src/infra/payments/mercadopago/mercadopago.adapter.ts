import {
  MercadoPagoConfig,
  MerchantOrder,
  Payment,
  PaymentRefund,
  Preference,
} from "mercadopago";
import type { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";
import { ValidationError } from "../../../domain/errors";
import { Order } from "../../../domain/order/types";
import { PaymentGatewayPort } from "../../../domain/payment/ports/payment-gateway.port";
import {
  GatewayActionResult,
  GatewayPaymentDetails,
  PaymentPreferenceResult,
  PaymentStatus,
  PaymentVerificationResult,
} from "../../../domain/payment/types";
import { formatStatementDescriptor } from "../../../lib/brand";
import { getEnv } from "../../../lib/env";
import { timingSafeEqualStrings } from "../../auth/session";

export interface MercadoPagoAdapterConfig {
  accessToken?: string | null;
  publicKey?: string | null;
  webhookSecret?: string | null;
  sandbox?: boolean;
  baseUrl?: string | null;
  brandName?: string | null;
}

export interface MercadoPagoPreferenceSettings {
  binaryMode?: boolean;
  maxInstallments?: number | null;
  excludedPaymentTypes?: string[];
  offlineExpirationDays?: number | null;
}

/**
 * Extrae calle, altura y código postal estructurados para `payer.address` y `shipments.receiver_address`.
 */
function parseStructuredAddress(address?: string | null, postalCode?: string | null) {
  const cleanAddress = address?.trim();
  const cleanZip = postalCode?.trim();
  if (!cleanAddress && !cleanZip) return undefined;

  let streetName = cleanAddress || undefined;
  let streetNumber: string | undefined;

  if (cleanAddress) {
    const match = cleanAddress.match(/^(.*?)\s+(\d+[A-Za-z]?)$/);
    if (match && match[1].trim().length >= 2) {
      streetName = match[1].trim();
      streetNumber = match[2].trim();
    }
  }

  return {
    ...(streetName ? { street_name: streetName } : {}),
    ...(streetNumber ? { street_number: streetNumber } : {}),
    ...(cleanZip ? { zip_code: cleanZip } : {}),
  };
}

/**
 * Resuelve nombre y apellido del comprador para el objeto `payer` de Mercado Pago.
 */
function resolveOrderPayerNames(order: Order): { firstName?: string; lastName?: string } {
  const explicitFirst = order.customerFirstName?.trim();
  const explicitLast = order.customerLastName?.trim();
  if (explicitFirst || explicitLast) {
    return {
      firstName: explicitFirst || order.customerName.trim(),
      lastName: explicitLast || undefined,
    };
  }

  const parts = order.customerName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: parts[0] || undefined, lastName: undefined };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

/**
 * Verificador criptográfico de firmas HMAC-SHA256 para Webhooks de Mercado Pago (POO / SRP).
 */
export class MercadoPagoWebhookVerifier {
  /**
   * Extrae los componentes `ts` y `v1` de la cabecera `x-signature`.
   */
  parseSignatureHeader(signatureHeader?: string): { ts: string; v1: string } | null {
    if (!signatureHeader) return null;
    let ts = "";
    let v1 = "";
    for (const part of signatureHeader.split(",")) {
      const [rawKey, rawVal] = part.split("=");
      const key = rawKey?.trim();
      const val = rawVal?.trim();
      if (key === "ts" && val) ts = val;
      if (key === "v1" && val) v1 = val;
    }
    if (!ts || !v1) return null;
    return { ts, v1 };
  }

  /**
   * Construye el manifiesto canónico oficial de Mercado Pago (`id:...;request-id:...;ts:...;`).
   * Conforme a la especificación oficial, normaliza `data.id` alfanumérico a minúsculas.
   */
  buildManifest(dataId: string, requestId: string | undefined, ts: string): string {
    const cleanId = dataId.trim().toLowerCase();
    const cleanReqId = requestId?.trim();
    if (cleanReqId) {
      return `id:${cleanId};request-id:${cleanReqId};ts:${ts};`;
    }
    return `id:${cleanId};ts:${ts};`;
  }

  /**
   * Calcula el digest HMAC-SHA256 en formato hexadecimal usando Web Crypto API.
   */
  async computeHmacSha256Hex(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
    return Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Verifica la firma `x-signature` de un webhook entrante en tiempo constante.
   */
  async verify(
    dataId: string,
    headers: Record<string, string> | undefined,
    secret: string
  ): Promise<boolean> {
    const sigHeader = headers?.["x-signature"] || headers?.["X-Signature"];
    const requestId = headers?.["x-request-id"] || headers?.["X-Request-Id"];
    const parsed = this.parseSignatureHeader(sigHeader);
    if (!parsed) return false;

    const manifest = this.buildManifest(dataId, requestId, parsed.ts);
    const expectedHex = await this.computeHmacSha256Hex(manifest, secret);
    return timingSafeEqualStrings(parsed.v1.toLowerCase(), expectedHex.toLowerCase());
  }
}

/**
 * Adaptador oficial de Mercado Pago Checkout Pro basado en el SDK oficial `mercadopago` (POO / SRP).
 * Opera en modo Sandbox por defecto cuando tiene credenciales configuradas por variable de entorno.
 */
export class MercadoPagoPaymentAdapter implements PaymentGatewayPort {
  readonly method = "MERCADOPAGO" as const;
  private readonly webhookVerifier = new MercadoPagoWebhookVerifier();

  constructor(private readonly config: MercadoPagoAdapterConfig = {}) {}

  private createClient(accessToken: string): MercadoPagoConfig {
    return new MercadoPagoConfig({ accessToken, options: { timeout: 12000 } });
  }

  /**
   * Determina si el adaptador debe operar en modo Sandbox (no productivo).
   */
  isSandboxMode(): boolean {
    if (typeof this.config.sandbox === "boolean") {
      return this.config.sandbox;
    }
    const rawSandbox = process.env.MP_SANDBOX ?? getEnv().MP_SANDBOX;
    return rawSandbox !== "false";
  }

  /**
   * Identifica si el token corresponde a las credenciales de desarrollo por defecto o entorno de test sin red.
   */
  private isSimulatedToken(accessToken?: string | null): boolean {
    return (
      !accessToken ||
      accessToken.startsWith("test_mock_") ||
      accessToken.startsWith("TEST-00000000")
    );
  }

  /**
   * Selecciona la URL de redirección priorizando `sandbox_init_point` cuando está en modo Sandbox.
   */
  resolveCheckoutRedirectUrl(data: { init_point?: string; sandbox_init_point?: string }): string {
    if (this.isSandboxMode()) {
      return data.sandbox_init_point || data.init_point || "";
    }
    return data.init_point || data.sandbox_init_point || "";
  }

  /**
   * Extrae el código de orden embebido en un ID de preferencia simulada (`mock_pref_<code_num>_<ts>`).
   */
  extractSimulatedOrderCode(externalId: string): number | undefined {
    const match = /^mock_pref_(\d+)_/.exec(externalId);
    if (!match) return undefined;
    const parsed = parseInt(match[1], 10);
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : undefined;
  }

  /**
   * Determina si la URL base es un origen HTTPS público apto para `notification_url` e imágenes públicas.
   */
  private isPublicHttpsOrigin(baseUrl: string): boolean {
    return (
      baseUrl.startsWith("https://") &&
      !baseUrl.includes("localhost") &&
      !baseUrl.includes("127.0.0.1")
    );
  }

  /**
   * Construye las URLs de retorno de Mercado Pago hacia el flujo de confirmación de compra.
   */
  private buildPreferenceBackUrls(baseUrl: string, orderCode: number) {
    const httpsBase = baseUrl.replace(/^http:\/\//i, "https://");
    return {
      success: `${httpsBase}/carrito?step=payment_success&payment_status=approved&order_code=${orderCode}`,
      pending: `${httpsBase}/carrito?step=payment_success&payment_status=pending&order_code=${orderCode}`,
      failure: `${httpsBase}/carrito?step=payment_success&payment_status=failure&order_code=${orderCode}`,
    };
  }

  /**
   * Resuelve una URL de imagen pública HTTPS para la miniatura de la prenda en Mercado Pago.
   */
  private resolveGatewayItemPictureUrl(
    photoUrl: string | null | undefined,
    baseUrl: string
  ): string | undefined {
    if (photoUrl && photoUrl.startsWith("https://")) {
      return photoUrl;
    }
    if (photoUrl && photoUrl.startsWith("/") && this.isPublicHttpsOrigin(baseUrl)) {
      return `${baseUrl.replace(/\/$/, "")}${photoUrl}`;
    }
    if (this.isSandboxMode()) {
      return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80";
    }
    return undefined;
  }

  /**
   * Construye los ítems de la preferencia ajustando descuentos globales si los hubiera
   * para que la suma + shipments coincida exactamente con `order.totalCents`.
   */
  private buildPreferenceItems(
    order: Order,
    baseUrl: string,
    categoryId: string
  ): NonNullable<PreferenceRequest["items"]> {
    const items = order.items || [];
    const netGoodsCents = Math.max(0, order.totalCents - order.shippingCents);
    const grossGoodsCents = order.subtotalCents > 0 ? order.subtotalCents : netGoodsCents;
    const hasDiscount = netGoodsCents < grossGoodsCents && grossGoodsCents > 0;
    const discountRatio = hasDiscount ? netGoodsCents / grossGoodsCents : 1;

    return items.map((item) => {
      const adjustedUnitCents = hasDiscount
        ? Math.max(1, Math.round(item.unitPriceCents * discountRatio))
        : item.unitPriceCents;
      return {
        id: String(item.productCode),
        title: `${item.productTitle} (${item.colorName} - ${item.size})`,
        description: `Color: ${item.colorName} | Talle: ${item.size} | Cant: ${item.quantity}`,
        category_id: categoryId,
        quantity: item.quantity,
        unit_price: Number((adjustedUnitCents / 100).toFixed(2)),
        currency_id: order.currency || "ARS",
        picture_url: this.resolveGatewayItemPictureUrl(item.photoUrl, baseUrl),
      };
    });
  }

  /**
   * Traduce el estado de Mercado Pago al estado de dominio.
   */
  mapGatewayPaymentStatus(mpStatus: string): PaymentStatus {
    if (mpStatus === "approved" || mpStatus === "authorized") {
      return "AUTHORIZED";
    }
    if (mpStatus === "rejected" || mpStatus === "cancelled" || mpStatus === "failure") {
      return "REJECTED";
    }
    if (mpStatus === "refunded" || mpStatus === "charged_back") {
      return "REFUNDED";
    }
    return "PENDING";
  }

  async createPaymentPreference(
    order: Order,
    options?: Record<string, unknown>
  ): Promise<PaymentPreferenceResult> {
    const accessToken = this.config.accessToken;
    const baseUrl =
      (typeof options?.baseUrl === "string" && options.baseUrl) ||
      this.config.baseUrl ||
      "http://localhost:3000";
    const formattedCode = `#ORD-${order.code.toString().padStart(3, "0")}`;
    const externalRefCode = `ORD-${order.code.toString().padStart(3, "0")}`;

    if (this.isSimulatedToken(accessToken)) {
      const mockPrefId = `mock_pref_${order.code}_${Date.now()}`;
      const mockUrl = `${baseUrl}/carrito?step=payment_success&order_code=${order.code}&payment_id=${mockPrefId}&sandbox=${this.isSandboxMode() ? "1" : "0"}`;
      return {
        method: "MERCADOPAGO",
        status: "PENDING",
        preferenceId: mockPrefId,
        paymentUrl: mockUrl,
        redirectUrl: mockUrl,
        instructions: `Redirigiendo a Mercado Pago para abonar ${formattedCode}...`,
      };
    }

    const mpSettings = (options?.mpSettings as MercadoPagoPreferenceSettings | undefined) || undefined;
    const categoryId =
      typeof options?.categoryId === "string" && options.categoryId.trim()
        ? options.categoryId.trim()
        : "fashion";
    const reservationHours =
      typeof options?.reservationHours === "number" && options.reservationHours > 0
        ? options.reservationHours
        : 48;

    const structuredAddress = parseStructuredAddress(order.deliveryAddress, order.postalCode);
    const { firstName, lastName } = resolveOrderPayerNames(order);
    const cleanPhone = order.customerPhone.replace(/\D/g, "");
    const cleanDni = order.customerDni ? order.customerDni.replace(/\D/g, "") : "";
    const cleanEmail = order.customerEmail?.trim();

    const nowMs = Date.now();
    const expiresAtMs = nowMs + reservationHours * 60 * 60 * 1000;

    const paymentMethodsConfig: PreferenceRequest["payment_methods"] = {};
    if (mpSettings?.maxInstallments && mpSettings.maxInstallments > 0) {
      paymentMethodsConfig.installments = mpSettings.maxInstallments;
    }
    if (mpSettings?.excludedPaymentTypes && mpSettings.excludedPaymentTypes.length > 0) {
      paymentMethodsConfig.excluded_payment_types = mpSettings.excludedPaymentTypes.map((id) => ({
        id,
      }));
    }

    const body: PreferenceRequest = {
      items: this.buildPreferenceItems(order, baseUrl, categoryId),
      payer: {
        ...(firstName ? { name: firstName } : {}),
        ...(lastName ? { surname: lastName } : {}),
        ...(cleanEmail && cleanEmail.includes("@") ? { email: cleanEmail } : {}),
        ...(cleanPhone ? { phone: { number: cleanPhone } } : {}),
        ...(cleanDni ? { identification: { type: "DNI", number: cleanDni } } : {}),
        ...(structuredAddress ? { address: structuredAddress } : {}),
      },
      external_reference: externalRefCode,
      back_urls: this.buildPreferenceBackUrls(baseUrl, order.code),
      auto_return: "approved",
      statement_descriptor: formatStatementDescriptor(
        typeof options?.brandName === "string" ? options.brandName : this.config.brandName
      ),
      expires: true,
      expiration_date_from: new Date(nowMs).toISOString(),
      expiration_date_to: new Date(expiresAtMs).toISOString(),
      ...(mpSettings?.binaryMode ? { binary_mode: true } : {}),
      ...(Object.keys(paymentMethodsConfig).length > 0
        ? { payment_methods: paymentMethodsConfig }
        : {}),
      ...(mpSettings?.offlineExpirationDays && mpSettings.offlineExpirationDays > 0
        ? {
            date_of_expiration: new Date(
              nowMs + mpSettings.offlineExpirationDays * 24 * 60 * 60 * 1000
            ).toISOString(),
          }
        : {}),
    };

    if (order.shippingCents > 0) {
      body.shipments = {
        mode: "not_specified",
        local_pickup: false,
        cost: Number((order.shippingCents / 100).toFixed(2)),
        ...(structuredAddress ? { receiver_address: structuredAddress } : {}),
      };
    } else if (order.deliveryMethod === "PICKUP") {
      body.shipments = {
        mode: "not_specified",
        local_pickup: true,
      };
    }

    if (this.isPublicHttpsOrigin(baseUrl)) {
      body.notification_url = `${baseUrl.replace(/\/$/, "")}/api/payments/webhook/mercadopago`;
    }

    try {
      const client = this.createClient(accessToken!);
      const preference = new Preference(client);
      const data = await preference.create({ body });
      const redirectUrl = this.resolveCheckoutRedirectUrl(data);

      return {
        method: "MERCADOPAGO",
        status: "PENDING",
        preferenceId: data.id || "",
        paymentUrl: redirectUrl,
        redirectUrl,
        instructions: `Aboná tu orden ${formattedCode} de forma segura con Mercado Pago${this.isSandboxMode() ? " (Sandbox)" : ""}.`,
      };
    } catch (err) {
      console.error("Error al crear preferencia de Mercado Pago:", err);
      throw err;
    }
  }

  async verifyPayment(externalId: string): Promise<PaymentVerificationResult> {
    const accessToken = this.config.accessToken;
    if (this.isSimulatedToken(accessToken)) {
      return {
        externalId,
        orderCode: this.extractSimulatedOrderCode(externalId),
        status: "AUTHORIZED",
        amountCents: 0,
        paymentDetails: {
          provider: "MERCADOPAGO",
          paymentId: externalId,
          statusDetail: "simulated",
        },
      };
    }

    try {
      const client = this.createClient(accessToken!);
      const paymentClient = new Payment(client);
      const data = await paymentClient.get({ id: externalId });

      const mappedStatus = this.mapGatewayPaymentStatus(data.status || "pending");
      const orderCode = data.external_reference
        ? parseInt(data.external_reference.replace(/\D/g, ""), 10)
        : undefined;

      const transactionAmountCents =
        typeof data.transaction_amount === "number" ? Math.round(data.transaction_amount * 100) : 0;
      const totalPaidRaw = data.transaction_details?.total_paid_amount;
      const installmentAmountRaw = data.transaction_details?.installment_amount;

      const paymentDetails: GatewayPaymentDetails = {
        provider: "MERCADOPAGO",
        paymentId: data.id !== undefined ? String(data.id) : externalId,
        paymentMethodId: data.payment_method_id || null,
        paymentTypeId: data.payment_type_id || null,
        installments: typeof data.installments === "number" ? data.installments : null,
        installmentAmountCents:
          typeof installmentAmountRaw === "number" ? Math.round(installmentAmountRaw * 100) : null,
        transactionAmountCents: transactionAmountCents || null,
        totalPaidCents:
          typeof totalPaidRaw === "number"
            ? Math.round(totalPaidRaw * 100)
            : transactionAmountCents || null,
        cardLastFour: data.card?.last_four_digits || null,
        cardFirstSix: data.card?.first_six_digits || null,
        statusDetail: data.status_detail || null,
        dateApproved: data.date_approved || null,
      };

      return {
        externalId: paymentDetails.paymentId || externalId,
        orderCode: !Number.isNaN(orderCode) ? orderCode : undefined,
        status: mappedStatus,
        amountCents: transactionAmountCents,
        paymentDetails,
        details: data as unknown as Record<string, unknown>,
      };
    } catch (err) {
      console.error("Error al consultar pago MP:", err);
      throw err;
    }
  }

  async cancelPayment(paymentId: string, idempotencyKey?: string): Promise<GatewayActionResult> {
    const accessToken = this.config.accessToken;
    const now = Math.floor(Date.now() / 1000);

    if (this.isSimulatedToken(accessToken)) {
      return {
        externalId: paymentId,
        status: "REJECTED",
        details: {
          provider: "MERCADOPAGO",
          paymentId,
          statusDetail: "by_collector",
          cancelledAt: now,
        },
      };
    }

    const client = this.createClient(accessToken!);
    const paymentClient = new Payment(client);
    const data = await paymentClient.cancel({
      id: paymentId,
      requestOptions: idempotencyKey ? { idempotencyKey } : undefined,
    });

    return {
      externalId: data.id !== undefined ? String(data.id) : paymentId,
      status: this.mapGatewayPaymentStatus(data.status || "cancelled"),
      details: {
        provider: "MERCADOPAGO",
        paymentId: data.id !== undefined ? String(data.id) : paymentId,
        statusDetail: data.status_detail || "by_collector",
        cancelledAt: now,
      },
    };
  }

  async refundPayment(
    paymentId: string,
    amountCents?: number,
    idempotencyKey?: string
  ): Promise<GatewayActionResult> {
    const accessToken = this.config.accessToken;
    const now = Math.floor(Date.now() / 1000);

    if (this.isSimulatedToken(accessToken)) {
      return {
        externalId: paymentId,
        status: "REFUNDED",
        refundId: `mock_refund_${paymentId}_${now}`,
        refundedAmountCents: amountCents ?? null,
        details: {
          provider: "MERCADOPAGO",
          paymentId,
          refundId: `mock_refund_${paymentId}_${now}`,
          refundedAmountCents: amountCents ?? null,
          refundedAt: now,
          statusDetail: "refunded",
        },
      };
    }

    const client = this.createClient(accessToken!);
    const refundClient = new PaymentRefund(client);
    const body =
      typeof amountCents === "number" && amountCents > 0
        ? { amount: Number((amountCents / 100).toFixed(2)) }
        : undefined;

    const refund = await refundClient.create({
      payment_id: paymentId,
      body,
      requestOptions: idempotencyKey ? { idempotencyKey } : undefined,
    });

    const refundId = refund.id !== undefined ? String(refund.id) : null;
    const refundedAmountCents =
      typeof refund.amount === "number" ? Math.round(refund.amount * 100) : amountCents ?? null;

    return {
      externalId: paymentId,
      status: "REFUNDED",
      refundId,
      refundedAmountCents,
      details: {
        provider: "MERCADOPAGO",
        paymentId,
        refundId,
        refundedAmountCents,
        refundedAt: now,
        statusDetail: refund.status || "refunded",
      },
    };
  }

  async processWebhook(
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<PaymentVerificationResult | null> {
    const body = payload as {
      type?: string;
      topic?: string;
      data?: { id?: string };
      id?: string;
      order_code?: string | number;
      orderCode?: string | number;
      status?: string;
    };
    const resourceId = body.data?.id || body.id;
    const topic = (body.type || body.topic || "").toLowerCase();

    if (!resourceId) {
      return null;
    }

    const secret = this.config.webhookSecret?.trim();
    if (secret) {
      const isValid = await this.webhookVerifier.verify(String(resourceId), headers, secret);
      if (!isValid) {
        throw new ValidationError("Firma HMAC de webhook de Mercado Pago inválida.");
      }
    }

    // Si la notificación corresponde a una merchant_order, resolvemos el payment ID asociado
    if (topic === "merchant_order" && !this.isSimulatedToken(this.config.accessToken)) {
      const client = this.createClient(this.config.accessToken!);
      const moClient = new MerchantOrder(client);
      const mo = await moClient.get({ merchantOrderId: String(resourceId) });
      const payments = Array.isArray(mo.payments) ? mo.payments : [];
      const approvedPayment = payments.find((p) => p.status === "approved" || p.status === "authorized");
      const targetPayment = approvedPayment || payments[payments.length - 1];
      if (!targetPayment?.id) {
        return null;
      }
      return this.verifyPayment(String(targetPayment.id));
    }

    const verified = await this.verifyPayment(String(resourceId));
    if (this.isSimulatedToken(this.config.accessToken)) {
      const rawOrderCode = body.orderCode ?? body.order_code;
      const explicitCode =
        rawOrderCode !== undefined ? parseInt(String(rawOrderCode).replace(/\D/g, ""), 10) : NaN;
      if (!Number.isNaN(explicitCode) && explicitCode > 0) {
        verified.orderCode = explicitCode;
      }
      if (typeof body.status === "string" && body.status.trim()) {
        verified.status = this.mapGatewayPaymentStatus(body.status.trim().toLowerCase());
      }
    }

    return verified;
  }
}
