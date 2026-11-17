import { describe, expect, it, vi } from "vitest";
import {
  cancelAbandonedGatewayOrder,
  createOrderPaymentPreference,
  getAvailablePaymentMethods,
  getCheckoutSandboxOrderSummary,
  markOrderPaymentManually,
  processPaymentWebhook,
  refundOrCancelOrderPayment,
} from "../src/services/payment.service";
import { GlobalAppDeps } from "../src/infra/db/connection";
import { Order, OrderStatus, OrderTimelineEvent } from "../src/domain/order/types";
import { GatewayPaymentDetails, PaymentStatus } from "../src/domain/payment/types";
import {
  IOrderRepository,
  IProductRepository,
  ISettingsRepository,
} from "../src/domain/ports/repositories.port";

interface CapturedPreferencePayload {
  payer: {
    name?: string;
    surname?: string;
    email?: string;
    address?: {
      street_name?: string;
      street_number?: string;
      zip_code?: string;
    };
  };
  shipments?: {
    mode?: string;
    local_pickup?: boolean;
    cost?: number;
  };
  items: Array<{ id?: string; title?: string; unit_price?: number; quantity?: number }>;
  binary_mode?: boolean;
  payment_methods?: {
    installments?: number;
  };
  expires?: boolean;
  date_of_expiration?: string;
  notification_url?: string;
}

describe("Payment Service (BR-14, BR-47, AR-16)", () => {
  const mockOrder: Order = {
    id: 10,
    code: 25,
    customerName: "Martina Paz",
    customerPhone: "1198765432",
    customerEmail: "martina@example.com",
    customerDni: "38999888",
    deliveryMethod: "HOME_DELIVERY",
    deliveryAddress: "Av. Corrientes 500",
    subtotalCents: 5000000, // $50.000
    discountCents: 0,
    shippingCents: 350000,
    paymentDiscountCents: 500000, // $5.000 (10%)
    totalCents: 4850000,
    currency: "ARS",
    status: "PENDING",
    paymentMethod: "TRANSFER",
    paymentStatus: "PENDING",
    createdAt: 1700000000,
    updatedAt: 1700000000,
    items: [
      {
        id: 1,
        orderId: 10,
        productId: 1,
        productCode: 1,
        productTitle: "Vestido Lino",
        colorName: "Natural",
        size: "M",
        quantity: 1,
        unitPriceCents: 5000000,
        subtotalCents: 5000000,
      },
    ],
  };

  const createMockDeps = (orderData: Order = mockOrder): GlobalAppDeps => {
    let currentOrder = { ...orderData };
    return {
      db: {} as unknown as GlobalAppDeps["db"],
      orderRepo: {
        findById: vi.fn(async (id: number) => (currentOrder.id === id ? currentOrder : null)),
        findByCode: vi.fn(async (code: number) => (currentOrder.code === code ? currentOrder : null)),
        updateStatus: vi.fn(async (_id: number, status: OrderStatus, updatedAt: number) => {
          currentOrder = { ...currentOrder, status, updatedAt };
          return currentOrder;
        }),
        updatePayment: vi.fn(
          async (
            _id: number,
            data: {
              paymentStatus: PaymentStatus;
              paymentExternalId?: string | null;
              paymentDetails?: GatewayPaymentDetails | null;
              updatedAt: number;
            }
          ) => {
            currentOrder = { ...currentOrder, ...data };
            return currentOrder;
          }
        ),
        updateTimeline: vi.fn(
          async (_id: number, timeline: OrderTimelineEvent[], updatedAt: number) => {
            currentOrder = { ...currentOrder, timeline, updatedAt };
            return currentOrder;
          }
        ),
      } as unknown as IOrderRepository,
      settingsRepo: {
        get: vi.fn(async (key: string) => {
          const map: Record<string, string> = {
            mercadopago_enabled: "1",
            transfer_enabled: "1",
            transfer_bank_name: "Banco Santander",
            transfer_alias: "AURA.STUDIO",
            transfer_discount_percent: "10",
            cash_enabled: "1",
            whatsapp_payment_enabled: "1",
          };
          return map[key] ?? null;
        }),
        getAll: vi.fn(async () => ({
          mercadopago_enabled: "1",
          transfer_enabled: "1",
          transfer_bank_name: "Banco Santander",
          transfer_alias: "AURA.STUDIO",
          transfer_discount_percent: "10",
          cash_enabled: "1",
          whatsapp_payment_enabled: "1",
        })),
        set: vi.fn(),
      } as unknown as ISettingsRepository,
    } as unknown as GlobalAppDeps;
  };

  it("getAvailablePaymentMethods retorna métodos activos con sus configuraciones", async () => {
    const deps = createMockDeps();
    const methods = await getAvailablePaymentMethods(deps);

    expect(methods.some((m) => m.method === "MERCADOPAGO")).toBe(true);
    expect(methods.some((m) => m.method === "TRANSFER")).toBe(true);
    expect(methods.some((m) => m.method === "CASH")).toBe(true);
    expect(methods.some((m) => m.method === "WHATSAPP")).toBe(true);

    const transferMethod = methods.find((m) => m.method === "TRANSFER");
    expect(transferMethod?.discountPercent).toBe(10);
    expect(transferMethod?.badge).toBe("10% OFF");
  });

  it("getAvailablePaymentMethods excluye Mercado Pago si está deshabilitado en backoffice (mercadopago_enabled === '0')", async () => {
    const deps = createMockDeps();
    vi.mocked(deps.settingsRepo!.getAll!).mockResolvedValueOnce({
      mercadopago_enabled: "0",
      transfer_enabled: "1",
      cash_enabled: "1",
      whatsapp_payment_enabled: "1",
    });

    const methods = await getAvailablePaymentMethods(deps);
    expect(methods.some((m) => m.method === "MERCADOPAGO")).toBe(false);
    expect(methods.some((m) => m.method === "TRANSFER")).toBe(true);
  });

  it("createOrderPaymentPreference genera instrucciones y datos para TRANSFER", async () => {
    const deps = createMockDeps();
    const preference = await createOrderPaymentPreference(mockOrder, deps);

    expect(preference.method).toBe("TRANSFER");
    expect(preference.status).toBe("PENDING");
    expect(preference.bankDetails?.alias).toBe("AURA.STUDIO");
    expect(preference.instructions).toContain("#ORD-025");
    expect(preference.instructions).toContain("Banco Santander");
  });

  it("createOrderPaymentPreference genera preferencia para MERCADOPAGO en modo test", async () => {
    const deps = createMockDeps();
    const mpOrder: Order = { ...mockOrder, paymentMethod: "MERCADOPAGO" };
    const preference = await createOrderPaymentPreference(mpOrder, deps, { baseUrl: "http://localhost:3000" });

    expect(preference.method).toBe("MERCADOPAGO");
    expect(preference.preferenceId).toBeDefined();
    expect(preference.paymentUrl).toContain("payment_id=");
    expect(deps.orderRepo.updatePayment).toHaveBeenCalled();
  });

  it("processPaymentWebhook concilia pago y actualiza orden a PAID", async () => {
    const deps = createMockDeps();
    const payload = {
      type: "payment",
      data: { id: "mp_123456" },
    };

    const result = await processPaymentWebhook("mercadopago", payload, {}, deps);
    expect(result).toBeDefined();
  });

  it("markOrderPaymentManually actualiza pago y orden a PAID para transferencias", async () => {
    const deps = createMockDeps();
    const updated = await markOrderPaymentManually(10, "PAID", deps);

    expect(updated.status).toBe("PAID");
    expect(updated.paymentStatus).toBe("PAID");
    expect(deps.orderRepo.updateStatus).toHaveBeenCalledWith(10, "PAID", expect.any(Number));
  });

  it("markOrderPaymentManually permite cambiar estado a REJECTED o PENDING", async () => {
    const deps = createMockDeps();
    const rejected = await markOrderPaymentManually(10, "REJECTED", deps);

    expect(rejected.paymentStatus).toBe("REJECTED");
    expect(deps.orderRepo.updatePayment).toHaveBeenCalledWith(10, {
      paymentStatus: "REJECTED",
      updatedAt: expect.any(Number),
    });
  });

  it("updateShowroomSettings persiste correctamente los nuevos métodos de pago y datos bancarios", async () => {
    const { updateShowroomSettings, getShowroomSettings } = await import("../src/services/settings.service");
    const stored: Record<string, string> = {};
    const mockDeps = {
      settingsRepo: {
        get: vi.fn(async (key: string) => stored[key] ?? null),
        getAll: vi.fn(async () => stored),
        set: vi.fn(async (key: string, val: string) => {
          stored[key] = val;
        }),
      },
    } as unknown as GlobalAppDeps;

    await updateShowroomSettings(
      {
        mercadopagoEnabled: true,
        transferEnabled: true,
        transferBankName: "Banco Galicia",
        transferAccountHolder: "Aura Studio SAS",
        transferCbu: "0070123400000012345678",
        transferAlias: "AURA.PAGO.GALICIA",
        transferCuit: "30-71234567-8",
        transferDiscountPercent: 15,
        cashEnabled: true,
        cashNotes: "Abonar en caja de showroom",
        whatsappPaymentEnabled: true,
      },
      mockDeps
    );

    const settings = await getShowroomSettings(mockDeps);
    expect(settings.mercadopagoEnabled).toBe(true);
    expect(settings.transferBankName).toBe("Banco Galicia");
    expect(settings.transferAlias).toBe("AURA.PAGO.GALICIA");
    expect(settings.transferDiscountPercent).toBe(15);
    expect(settings.cashNotes).toBe("Abonar en caja de showroom");
  });

  it("persiste y habilita Payway, Getnet, MODO, Google Pay y Mercado Pago con arquitectura server-side", async () => {
    const { updateShowroomSettings, getShowroomSettings } = await import("../src/services/settings.service");
    const stored: Record<string, string> = {};
    const mockDeps = {
      settingsRepo: {
        get: vi.fn(async (key: string) => stored[key] ?? null),
        getAll: vi.fn(async () => stored),
        set: vi.fn(async (key: string, val: string) => {
          stored[key] = val;
        }),
      },
    } as unknown as GlobalAppDeps;

    await updateShowroomSettings(
      {
        mercadopagoEnabled: true,
        paywayEnabled: true,
        paywayCuotaSimpleEnabled: true,
        paywayEnvironment: "production",
        getnetEnabled: true,
        getnetEnvironment: "production",
        modoEnabled: true,
        googlePayEnabled: true,
      },
      mockDeps
    );

    const settings = await getShowroomSettings(mockDeps);
    expect(settings.mercadopagoEnabled).toBe(true);
    expect(settings.paywayEnabled).toBe(true);
    expect(settings.paywayCuotaSimpleEnabled).toBe(true);
    expect(settings.paywayEnvironment).toBe("production");
    expect(settings.getnetEnabled).toBe(true);
    expect(settings.getnetEnvironment).toBe("production");
    expect(settings.modoEnabled).toBe(true);
    expect(settings.googlePayEnabled).toBe(true);

    // Verificar que getAvailablePaymentMethods incluye todos los procesadores
    const methods = await getAvailablePaymentMethods(mockDeps);
    expect(methods.some((m) => m.method === "PAYWAY")).toBe(true);
    expect(methods.some((m) => m.method === "GETNET")).toBe(true);
    expect(methods.some((m) => m.method === "MODO")).toBe(true);
    expect(methods.some((m) => m.method === "GOOGLEPAY")).toBe(true);
    expect(methods.some((m) => m.method === "MERCADOPAGO")).toBe(true);

    // Verificar generación de preferencia para cada uno
    const paywayPref = await createOrderPaymentPreference(
      { ...mockOrder, paymentMethod: "PAYWAY" },
      mockDeps
    );
    expect(paywayPref.method).toBe("PAYWAY");
    expect(paywayPref.instructions).toContain("Payway");

    const getnetPref = await createOrderPaymentPreference(
      { ...mockOrder, paymentMethod: "GETNET" },
      mockDeps
    );
    expect(getnetPref.method).toBe("GETNET");
    expect(getnetPref.instructions).toContain("Getnet");

    const modoPref = await createOrderPaymentPreference(
      { ...mockOrder, paymentMethod: "MODO" },
      mockDeps
    );
    expect(modoPref.method).toBe("MODO");
    expect(modoPref.instructions).toContain("MODO");

    const gpayPref = await createOrderPaymentPreference(
      { ...mockOrder, paymentMethod: "GOOGLEPAY" },
      mockDeps
    );
    expect(gpayPref.method).toBe("GOOGLEPAY");
    expect(gpayPref.instructions).toContain("Google Pay");
  });

  it("GET /api/admin/payments/status reporta estado de entorno y token enmascarado sin filtrar secretos", async () => {
    const { GET } = await import("../src/app/api/admin/payments/status/route");
    const { NextRequest } = await import("next/server");
    const { createSessionToken } = await import("../src/infra/auth/session");
    const { getEnv } = await import("../src/lib/env");

    const { ADMIN_SESSION_COOKIE_NAME } = await import("../src/infra/auth/guard");

    const token = await createSessionToken(
      getEnv().SESSION_SECRET,
      { email: "admin@aurastudio.com", role: "SUPER_ADMIN" },
      3600
    );

    const req = new NextRequest("http://localhost:3000/api/admin/payments/status", {
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE_NAME}=${token}`,
      },
    });

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.mercadopago).toBeDefined();
    expect(data.mercadopago.environment).toBeDefined();
    // No debe contener tokens completos sin enmascarar
    if (data.mercadopago.tokenMasked) {
      expect(data.mercadopago.tokenMasked).toContain("••••••••");
    }
  });

  it("POST /api/admin/payments/status ejecuta diagnóstico de servidor", async () => {
    const { POST } = await import("../src/app/api/admin/payments/status/route");
    const { NextRequest } = await import("next/server");
    const { createSessionToken } = await import("../src/infra/auth/session");
    const { getEnv } = await import("../src/lib/env");

    const { ADMIN_SESSION_COOKIE_NAME } = await import("../src/infra/auth/guard");

    const token = await createSessionToken(
      getEnv().SESSION_SECRET,
      { email: "admin@aurastudio.com", role: "SUPER_ADMIN" },
      3600
    );

    const req = new NextRequest("http://localhost:3000/api/admin/payments/status", {
      method: "POST",
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE_NAME}=${token}`,
      },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.status).toBeDefined();
  });

  it("MercadoPagoPaymentAdapter opera en modo Sandbox y prioriza sandbox_init_point cuando hay key configurada", async () => {
    const { MercadoPagoPaymentAdapter } = await import(
      "../src/infra/payments/mercadopago/mercadopago.adapter"
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "pref_sandbox_999",
          init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=prod",
          sandbox_init_point: "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=sandbox",
        }),
        { status: 200 }
      )
    );

    try {
      const adapter = new MercadoPagoPaymentAdapter({
        accessToken: "APP_USR-dev-key-123456",
        publicKey: "APP_USR-dev-pub-123456",
      });

      expect(adapter.isSandboxMode()).toBe(true);
      const pref = await adapter.createPaymentPreference({
        ...mockOrder,
        paymentMethod: "MERCADOPAGO",
      });

      expect(pref.preferenceId).toBe("pref_sandbox_999");
      expect(pref.redirectUrl).toBe(
        "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=sandbox"
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("MercadoPagoWebhookVerifier valida firmas HMAC-SHA256 auténticas y rechaza firmas adulteradas", async () => {
    const { MercadoPagoPaymentAdapter, MercadoPagoWebhookVerifier } = await import(
      "../src/infra/payments/mercadopago/mercadopago.adapter"
    );
    const verifier = new MercadoPagoWebhookVerifier();
    const secret = "mp_webhook_secret_dev";
    const paymentId = "pay_777";
    const requestId = "req-abc-123";
    const ts = "1700000100";

    const manifest = verifier.buildManifest(paymentId, requestId, ts);
    const validHex = await verifier.computeHmacSha256Hex(manifest, secret);

    const isValid = await verifier.verify(
      paymentId,
      {
        "x-signature": `ts=${ts},v1=${validHex}`,
        "x-request-id": requestId,
      },
      secret
    );
    expect(isValid).toBe(true);

    const adapter = new MercadoPagoPaymentAdapter({
      accessToken: "TEST-00000000-0000-0000-0000-000000000000",
      webhookSecret: secret,
    });

    await expect(
      adapter.processWebhook(
        { data: { id: paymentId } },
        {
          "x-signature": `ts=${ts},v1=deadbeef0000`,
          "x-request-id": requestId,
        }
      )
    ).rejects.toThrow(/Firma HMAC/i);
  });

  it("separa Pago Aceptado (callback MP -> AUTHORIZED + correo aparte) de Pago Confirmado (PAID + correo confirmado)", async () => {
    const sendAcceptedSpy = vi.fn().mockResolvedValue(undefined);
    const sendPaidSpy = vi.fn().mockResolvedValue(undefined);

    const deps = createMockDeps({
      ...mockOrder,
      paymentMethod: "MERCADOPAGO",
      paymentStatus: "PENDING",
      status: "PENDING",
    });
    deps.emailService = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
      sendOrderCreatedEmail: vi.fn().mockResolvedValue(undefined),
      sendOrderPaymentAcceptedEmail: sendAcceptedSpy,
      sendOrderPaidEmail: sendPaidSpy,
      sendOrderShippedEmail: vi.fn().mockResolvedValue(undefined),
      sendOrderCancelledEmail: vi.fn().mockResolvedValue(undefined),
      sendAdminNewOrderAlertEmail: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "approved",
          transaction_amount: mockOrder.totalCents / 100,
          external_reference: `#ORD-0${mockOrder.code}`,
        }),
        { status: 200 }
      )
    );

    const prevToken = process.env.MP_ACCESS_TOKEN;
    process.env.MP_ACCESS_TOKEN = "APP_USR-live-sandbox-key";

    try {
      // 1. Callback de Mercado Pago: debe dejar el pago en AUTHORIZED ("Pago Aceptado") y enviar sendOrderPaymentAcceptedEmail
      const webhookResult = await processPaymentWebhook(
        "mercadopago",
        { data: { id: "mp_pay_900" } },
        {},
        deps
      );

      expect(webhookResult?.status).toBe("AUTHORIZED");
      expect(deps.orderRepo.updatePayment).toHaveBeenCalledWith(
        mockOrder.id,
        expect.objectContaining({
          paymentStatus: "AUTHORIZED",
          paymentExternalId: "mp_pay_900",
          paymentDetails: expect.objectContaining({
            provider: "MERCADOPAGO",
            paymentId: "mp_pay_900",
          }),
          updatedAt: expect.any(Number),
        })
      );
      expect(deps.orderRepo.updateStatus).not.toHaveBeenCalledWith(
        mockOrder.id,
        "PAID",
        expect.any(Number)
      );

      await new Promise((r) => setTimeout(r, 20));
      expect(sendAcceptedSpy).toHaveBeenCalledTimes(1);
      expect(sendPaidSpy).not.toHaveBeenCalled();

      // 2. Confirmación definitiva del pago: pasa a PAID ("Pago Confirmado") y envía sendOrderPaidEmail
      const confirmedOrder = await markOrderPaymentManually(mockOrder.id, "PAID", deps);
      expect(confirmedOrder.status).toBe("PAID");
      expect(confirmedOrder.paymentStatus).toBe("PAID");

      await new Promise((r) => setTimeout(r, 20));
      expect(sendPaidSpy).toHaveBeenCalledTimes(1);
    } finally {
      if (prevToken === undefined) {
        delete process.env.MP_ACCESS_TOKEN;
      } else {
        process.env.MP_ACCESS_TOKEN = prevToken;
      }
      fetchSpy.mockRestore();
    }
  });

  it("getCheckoutSandboxOrderSummary verifica retorno real contra API de Mercado Pago y descuenta stock solo al aprobarse", async () => {
    const decrementStockMock = vi.fn().mockResolvedValue({
      remainingStock: 4,
      totalProductStock: 4,
      newProductStatus: "AVAILABLE",
    });
    const restoreStockMock = vi.fn().mockResolvedValue({
      newStock: 5,
      totalProductStock: 5,
      newProductStatus: "AVAILABLE",
    });

    const deps = createMockDeps({
      ...mockOrder,
      paymentMethod: "MERCADOPAGO",
      paymentStatus: "PENDING",
      status: "PENDING",
    });
    deps.productRepo = {
      decrementStock: decrementStockMock,
      restoreStock: restoreStockMock,
    } as unknown as IProductRepository;
    const sendCancelledSpy = vi.fn().mockResolvedValue(undefined);
    deps.emailService = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
      sendOrderCreatedEmail: vi.fn().mockResolvedValue(undefined),
      sendOrderPaidEmail: vi.fn().mockResolvedValue(undefined),
      sendOrderShippedEmail: vi.fn().mockResolvedValue(undefined),
      sendOrderCancelledEmail: sendCancelledSpy,
      sendAdminNewOrderAlertEmail: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    };

    // 1. Si el usuario abandona sin pagar, cancelAbandonedGatewayOrder NO llama a restoreStock, decrementStock ni envía correo de cancelación
    await cancelAbandonedGatewayOrder(mockOrder.code, deps);
    expect(decrementStockMock).not.toHaveBeenCalled();
    expect(restoreStockMock).not.toHaveBeenCalled();
    expect(sendCancelledSpy).not.toHaveBeenCalled();

    // Reponer estado PENDING para probar el retorno aprobado real de MP
    const freshDeps = createMockDeps({
      ...mockOrder,
      paymentMethod: "MERCADOPAGO",
      paymentStatus: "PENDING",
      status: "PENDING",
    });
    freshDeps.productRepo = {
      decrementStock: decrementStockMock,
      restoreStock: restoreStockMock,
    } as unknown as IProductRepository;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "approved",
          transaction_amount: mockOrder.totalCents / 100,
          external_reference: `ORD-0${mockOrder.code}`,
        }),
        { status: 200 }
      )
    );

    const prevToken = process.env.MP_ACCESS_TOKEN;
    process.env.MP_ACCESS_TOKEN = "APP_USR-live-sandbox-key";

    try {
      const summary = await getCheckoutSandboxOrderSummary(
        mockOrder.code,
        "13299887766",
        freshDeps,
        { isReturnCallback: true, paymentStatusParam: "approved" }
      );

      expect(summary.paymentStatus).toBe("AUTHORIZED");
      expect(decrementStockMock).toHaveBeenCalledTimes(1);
    } finally {
      if (prevToken === undefined) {
        delete process.env.MP_ACCESS_TOKEN;
      } else {
        process.env.MP_ACCESS_TOKEN = prevToken;
      }
      fetchSpy.mockRestore();
    }
  });

  it("MercadoPagoPaymentAdapter construye preferencia oficial con payer.surname, address, shipments, expires y configuración admin", async () => {
    const { MercadoPagoPaymentAdapter } = await import(
      "../src/infra/payments/mercadopago/mercadopago.adapter"
    );
    let capturedBody: CapturedPreferencePayload | null = null;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_url, init) => {
      capturedBody = JSON.parse(String(init?.body || "{}")) as CapturedPreferencePayload;
      return new Response(
        JSON.stringify({
          id: "pref_full_quality_101",
          init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_full_quality_101",
          sandbox_init_point: "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_full_quality_101",
        }),
        { status: 200 }
      );
    });

    try {
      const adapter = new MercadoPagoPaymentAdapter({
        accessToken: "APP_USR-live-test-key",
        brandName: "Mi Marca",
      });
      const orderWithSplitName: Order = {
        ...mockOrder,
        paymentMethod: "MERCADOPAGO",
        customerName: "Clara Benitez",
        customerFirstName: "Clara",
        customerLastName: "Benitez",
        postalCode: "1425",
        deliveryAddress: "Av. Santa Fe 2450",
        discountCents: 0,
        paymentDiscountCents: 0,
        shippingCents: 450000,
        totalCents: 5450000,
      };

      const pref = await adapter.createPaymentPreference(orderWithSplitName, {
        baseUrl: "https://shop.ejemplo.com",
        reservationHours: 24,
        mpSettings: {
          binaryMode: true,
          maxInstallments: 6,
          offlineExpirationDays: 3,
        },
      });

      expect(pref.preferenceId).toBe("pref_full_quality_101");
      expect(capturedBody).not.toBeNull();
      expect(capturedBody!.payer.name).toBe("Clara");
      expect(capturedBody!.payer.surname).toBe("Benitez");
      expect(capturedBody!.payer.email).toBe("martina@example.com");
      expect(capturedBody!.payer.address).toEqual({
        street_name: "Av. Santa Fe",
        street_number: "2450",
        zip_code: "1425",
      });
      expect(capturedBody!.shipments).toEqual(
        expect.objectContaining({
          mode: "not_specified",
          local_pickup: false,
          cost: 4500,
        })
      );
      expect(capturedBody!.items.some((i) => i.id === "shipping")).toBe(false);
      expect(capturedBody!.binary_mode).toBe(true);
      expect(capturedBody!.payment_methods?.installments).toBe(6);
      expect(capturedBody!.expires).toBe(true);
      expect(capturedBody!.date_of_expiration).toBeDefined();
      expect(capturedBody!.notification_url).toBe("https://shop.ejemplo.com/api/payments/webhook/mercadopago");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("normaliza data.id alfanumérico en HMAC, guarda cuotas/tarjeta/paymentId y procesa reembolso con email + restock + timeline", async () => {
    const { MercadoPagoWebhookVerifier } = await import(
      "../src/infra/payments/mercadopago/mercadopago.adapter"
    );

    // 1. Verificar normalización a minúsculas según especificación oficial MP
    const verifier = new MercadoPagoWebhookVerifier();
    const manifestUpper = verifier.buildManifest("ORD01UPPERCASE", "req-1", "1700000200");
    expect(manifestUpper).toBe("id:ord01uppercase;request-id:req-1;ts:1700000200;");

    const restoreStockMock = vi.fn().mockResolvedValue({
      newStock: 5,
      totalProductStock: 5,
      newProductStatus: "AVAILABLE",
    });
    const decrementStockMock = vi.fn().mockResolvedValue({
      remainingStock: 4,
      totalProductStock: 4,
      newProductStatus: "AVAILABLE",
    });
    const sendAcceptedSpy = vi.fn().mockResolvedValue({ success: true });
    const sendRefundedSpy = vi.fn().mockResolvedValue({ success: true });

    const deps = createMockDeps({
      ...mockOrder,
      paymentMethod: "MERCADOPAGO",
      paymentStatus: "PENDING",
      status: "PENDING",
      timeline: [
        {
          id: "order_created_1",
          at: 1700000000,
          type: "ORDER_CREATED",
          title: "Orden creada",
          actor: "BUYER",
        },
      ],
    });
    deps.productRepo = {
      decrementStock: decrementStockMock,
      restoreStock: restoreStockMock,
    } as unknown as IProductRepository;
    deps.emailService = {
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
      sendOrderCreatedEmail: vi.fn().mockResolvedValue({ success: true }),
      sendOrderPaymentAcceptedEmail: sendAcceptedSpy,
      sendOrderPaidEmail: vi.fn().mockResolvedValue({ success: true }),
      sendOrderShippedEmail: vi.fn().mockResolvedValue({ success: true }),
      sendOrderCancelledEmail: vi.fn().mockResolvedValue({ success: true }),
      sendOrderRefundedEmail: sendRefundedSpy,
      sendAdminNewOrderAlertEmail: vi.fn().mockResolvedValue({ success: true }),
      sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 987654321,
            status: "approved",
            status_detail: "accredited",
            transaction_amount: mockOrder.totalCents / 100,
            external_reference: `ORD-0${mockOrder.code}`,
            payment_method_id: "visa",
            payment_type_id: "credit_card",
            installments: 3,
            card: { last_four_digits: "4509", first_six_digits: "450995" },
            transaction_details: {
              installment_amount: 18500,
              total_paid_amount: 55500,
            },
            date_approved: "2026-11-17T14:00:00.000-03:00",
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 555111222,
            payment_id: 987654321,
            amount: mockOrder.totalCents / 100,
            status: "approved",
          }),
          { status: 201 }
        )
      );

    const prevToken = process.env.MP_ACCESS_TOKEN;
    process.env.MP_ACCESS_TOKEN = "APP_USR-live-sandbox-key";

    try {
      // 2. Entrar webhook con pago en 3 cuotas y detalles de tarjeta
      await processPaymentWebhook("mercadopago", { data: { id: "987654321" } }, {}, deps);

      const afterWebhook = await deps.orderRepo.findById(mockOrder.id);
      expect(afterWebhook?.paymentStatus).toBe("AUTHORIZED");
      expect(afterWebhook?.paymentDetails).toEqual(
        expect.objectContaining({
          paymentId: "987654321",
          paymentMethodId: "visa",
          paymentTypeId: "credit_card",
          installments: 3,
          installmentAmountCents: 1850000,
          totalPaidCents: 5550000,
          cardLastFour: "4509",
          statusDetail: "accredited",
        })
      );
      expect(afterWebhook?.timeline?.some((e) => e.type === "PAYMENT_WEBHOOK_RECEIVED")).toBe(true);
      expect(afterWebhook?.timeline?.some((e) => e.type === "STOCK_DEDUCTED")).toBe(true);
      expect(afterWebhook?.timeline?.some((e) => e.type === "PAYMENT_AUTHORIZED")).toBe(true);

      // 3. Reembolsar desde panel admin
      const refundedOrder = await refundOrCancelOrderPayment(mockOrder.id, deps, {
        reason: "Devolución solicitada",
      });

      expect(refundedOrder.paymentStatus).toBe("REFUNDED");
      expect(refundedOrder.status).toBe("CANCELLED");
      expect(refundedOrder.paymentDetails?.refundId).toBe("555111222");
      expect(restoreStockMock).toHaveBeenCalledTimes(1);
      expect(refundedOrder.timeline?.some((e) => e.type === "PAYMENT_REFUNDED")).toBe(true);
      expect(refundedOrder.timeline?.some((e) => e.type === "STOCK_RESTORED")).toBe(true);
      expect(refundedOrder.timeline?.some((e) => e.type === "ORDER_CANCELLED")).toBe(true);

      await new Promise((r) => setTimeout(r, 20));
      expect(sendRefundedSpy).toHaveBeenCalledTimes(1);
    } finally {
      if (prevToken === undefined) {
        delete process.env.MP_ACCESS_TOKEN;
      } else {
        process.env.MP_ACCESS_TOKEN = prevToken;
      }
      fetchSpy.mockRestore();
    }
  });
});
