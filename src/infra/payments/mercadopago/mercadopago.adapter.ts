import { ValidationError } from "../../../domain/errors";
import { Order } from "../../../domain/order/types";
import { PaymentGatewayPort } from "../../../domain/payment/ports/payment-gateway.port";
import {
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
   */
  buildManifest(dataId: string, requestId: string | undefined, ts: string): string {
    const cleanId = dataId.trim();
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
 * Adaptador de Mercado Pago Checkout Pro basado en fetch nativo (POO / SRP).
 * Opera en modo Sandbox por defecto cuando tiene credenciales configuradas por variable de entorno.
 */
export class MercadoPagoPaymentAdapter implements PaymentGatewayPort {
  readonly method = "MERCADOPAGO" as const;
  private readonly webhookVerifier = new MercadoPagoWebhookVerifier();

  constructor(private readonly config: MercadoPagoAdapterConfig = {}) {}

  /**
   * Determina si el adaptador debe operar en modo Sandbox (no productivo).
   * Por defecto, toda clave configurada por variable de entorno opera en Sandbox
   * a menos que se indique explícitamente `MP_SANDBOX="false"`.
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
  resolveCheckoutRedirectUrl(data: { init_point: string; sandbox_init_point?: string }): string {
    if (this.isSandboxMode()) {
      return data.sandbox_init_point || data.init_point;
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
   * Determina si la URL base es un origen HTTPS público apto para `auto_return` y `notification_url` en MP.
   */
  private isPublicHttpsOrigin(baseUrl: string): boolean {
    return baseUrl.startsWith("https://") && !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1");
  }

  /**
   * Construye las URLs de retorno de Checkout Pro hacia el flujo de confirmación de compra.
   */
  private buildPreferenceBackUrls(baseUrl: string, orderCode: number) {
    return {
      success: `${baseUrl}/carrito?step=payment_success&payment_status=approved&order_code=${orderCode}`,
      pending: `${baseUrl}/carrito?step=payment_success&payment_status=pending&order_code=${orderCode}`,
      failure: `${baseUrl}/carrito?step=payment_success&payment_status=failure&order_code=${orderCode}`,
    };
  }

  /**
   * Traduce el estado de Mercado Pago al estado de dominio.
   * El callback/webhook de pago aprobado marca el pago como AUTHORIZED ("Pago Aceptado"),
   * quedando separado de la confirmación definitiva ("PAID" / "Pago Confirmado").
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
    const baseUrl = this.config.baseUrl || "http://localhost:3000";
    const formattedCode = `#ORD-${order.code.toString().padStart(3, "0")}`;

    if (this.isSimulatedToken(accessToken)) {
      const mockPrefId = `mock_pref_${order.code}_${Date.now()}`;
      const mockUrl = `${baseUrl}/carrito?step=payment_success&order_code=${order.code}&payment_id=${mockPrefId}&sandbox=${this.isSandboxMode() ? "1" : "0"}`;
      return {
        method: "MERCADOPAGO",
        status: "PENDING",
        preferenceId: mockPrefId,
        paymentUrl: mockUrl,
        redirectUrl: mockUrl,
        instructions: `Redirigiendo a Mercado Pago Sandbox para abonar ${formattedCode}...`,
      };
    }

    const items = (order.items || []).map((item) => ({
      id: String(item.productCode),
      title: `${item.productTitle} (${item.colorName} - ${item.size})`,
      quantity: item.quantity,
      unit_price: item.unitPriceCents / 100,
      currency_id: "ARS",
      picture_url:
        item.photoUrl && item.photoUrl.startsWith("https://") ? item.photoUrl : undefined,
    }));

    if (order.shippingCents > 0) {
      items.push({
        id: "shipping",
        title: "Costo de Envío",
        quantity: 1,
        unit_price: order.shippingCents / 100,
        currency_id: "ARS",
        picture_url: undefined,
      });
    }

    const isPublicHttps = this.isPublicHttpsOrigin(baseUrl);
    const payload: Record<string, unknown> = {
      items,
      payer: {
        name: order.customerName,
        email: order.customerEmail || "cliente@tienda.local",
        phone: {
          number: order.customerPhone.replace(/\D/g, ""),
        },
        identification: order.customerDni
          ? {
              type: "DNI",
              number: order.customerDni.replace(/\D/g, ""),
            }
          : undefined,
      },
      external_reference: formattedCode,
      back_urls: this.buildPreferenceBackUrls(baseUrl, order.code),
      statement_descriptor: formatStatementDescriptor(
        typeof options?.brandName === "string" ? options.brandName : this.config.brandName
      ),
    };

    if (isPublicHttps) {
      payload.auto_return = "approved";
      payload.notification_url = `${baseUrl}/api/payments/webhook/mercadopago`;
    }

    try {
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mercado Pago API error: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as {
        id: string;
        init_point: string;
        sandbox_init_point?: string;
      };

      const redirectUrl = this.resolveCheckoutRedirectUrl(data);

      return {
        method: "MERCADOPAGO",
        status: "PENDING",
        preferenceId: data.id,
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
      };
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${externalId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error al verificar pago en Mercado Pago: ${response.status}`);
      }

      const data = (await response.json()) as {
        status: string;
        transaction_amount: number;
        external_reference?: string;
        date_approved?: string;
      };

      const mappedStatus = this.mapGatewayPaymentStatus(data.status);
      const orderCode = data.external_reference
        ? parseInt(data.external_reference.replace(/\D/g, ""), 10)
        : undefined;

      return {
        externalId,
        orderCode: !Number.isNaN(orderCode) ? orderCode : undefined,
        status: mappedStatus,
        amountCents: Math.round(data.transaction_amount * 100),
        details: data as unknown as Record<string, unknown>,
      };
    } catch (err) {
      console.error("Error al consultar pago MP:", err);
      throw err;
    }
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
    const paymentId = body.data?.id || body.id;

    if (!paymentId) {
      return null;
    }

    const secret = this.config.webhookSecret?.trim();
    if (secret) {
      const isValid = await this.webhookVerifier.verify(String(paymentId), headers, secret);
      if (!isValid) {
        throw new ValidationError("Firma HMAC de webhook de Mercado Pago inválida.");
      }
    }

    const verified = await this.verifyPayment(String(paymentId));
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
