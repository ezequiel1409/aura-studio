import { Order } from "../../../domain/order/types";
import { PaymentGatewayPort } from "../../../domain/payment/ports/payment-gateway.port";
import {
  PaymentPreferenceResult,
  PaymentStatus,
  PaymentVerificationResult,
} from "../../../domain/payment/types";

export interface MercadoPagoAdapterConfig {
  accessToken?: string | null;
  publicKey?: string | null;
  webhookSecret?: string | null;
  baseUrl?: string | null;
}

/**
 * Adaptador de Mercado Pago Checkout Pro basado en fetch nativo
 * Compatible con Cloudflare Workers Edge Runtime.
 */
export class MercadoPagoPaymentAdapter implements PaymentGatewayPort {
  readonly method = "MERCADOPAGO" as const;

  constructor(private readonly config: MercadoPagoAdapterConfig = {}) {}

  async createPaymentPreference(
    order: Order,
    options?: Record<string, unknown>
  ): Promise<PaymentPreferenceResult> {
    const accessToken = this.config.accessToken;
    const baseUrl = this.config.baseUrl || "http://localhost:3000";
    const formattedCode = `#ORD-${order.code.toString().padStart(3, "0")}`;

    // Si no hay token configurado o estamos en entorno de testing, emitir preferencia simulada
    if (!accessToken || accessToken.startsWith("test_mock_") || process.env.NODE_ENV === "test") {
      const mockPrefId = `mock_pref_${order.code}_${Date.now()}`;
      const mockUrl = `${baseUrl}/carrito?step=payment_success&order_code=${order.code}&payment_id=${mockPrefId}`;
      return {
        method: "MERCADOPAGO",
        status: "PENDING",
        preferenceId: mockPrefId,
        paymentUrl: mockUrl,
        redirectUrl: mockUrl,
        instructions: `Redirigiendo a Mercado Pago para abonar ${formattedCode}...`,
      };
    }

    // Armar ítems para la preferencia
    const items = (order.items || []).map((item) => ({
      id: String(item.productCode),
      title: `${item.productTitle} (${item.colorName} - ${item.size})`,
      quantity: item.quantity,
      unit_price: item.unitPriceCents / 100, // MP espera valor en pesos reales, no centavos
      currency_id: "ARS",
      picture_url: item.photoUrl || undefined,
    }));

    // Si hay costo de envío, sumarlo como ítem logístico
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

    const payload = {
      items,
      payer: {
        name: order.customerName,
        email: order.customerEmail || "cliente@aurastudio.com",
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
      back_urls: {
        success: `${baseUrl}/cuenta?payment_status=approved&order_code=${order.code}`,
        pending: `${baseUrl}/cuenta?payment_status=pending&order_code=${order.code}`,
        failure: `${baseUrl}/carrito?payment_status=failure&order_code=${order.code}`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/payments/webhook/mercadopago`,
      statement_descriptor: "AURA STUDIO",
    };

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

      const redirectUrl = data.init_point || data.sandbox_init_point;

      return {
        method: "MERCADOPAGO",
        status: "PENDING",
        preferenceId: data.id,
        paymentUrl: redirectUrl,
        redirectUrl,
        instructions: `Aboná tu orden ${formattedCode} de forma segura con Mercado Pago.`,
      };
    } catch (err) {
      console.error("Error al crear preferencia de Mercado Pago:", err);
      throw err;
    }
  }

  async verifyPayment(externalId: string): Promise<PaymentVerificationResult> {
    const accessToken = this.config.accessToken;
    if (!accessToken || process.env.NODE_ENV === "test") {
      return {
        externalId,
        status: "PAID",
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

      let mappedStatus: PaymentStatus = "PENDING";
      if (data.status === "approved") mappedStatus = "PAID";
      else if (data.status === "rejected") mappedStatus = "REJECTED";
      else if (data.status === "refunded") mappedStatus = "REFUNDED";

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
    const body = payload as { type?: string; topic?: string; data?: { id?: string }; id?: string };
    const paymentId = body.data?.id || body.id;

    if (!paymentId) {
      return null;
    }

    return this.verifyPayment(String(paymentId));
  }
}
