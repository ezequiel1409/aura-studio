import { describe, expect, it, vi } from "vitest";
import {
  createOrderPaymentPreference,
  getAvailablePaymentMethods,
  markOrderPaymentManually,
  processPaymentWebhook,
} from "../src/services/payment.service";
import { GlobalAppDeps } from "../src/infra/db/connection";
import { Order } from "../src/domain/order/types";

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
      db: {} as any,
      orderRepo: {
        findById: vi.fn(async (id: number) => (currentOrder.id === id ? currentOrder : null)),
        findByCode: vi.fn(async (code: number) => (currentOrder.code === code ? currentOrder : null)),
        updateStatus: vi.fn(async (id: number, status: any, updatedAt: number) => {
          currentOrder = { ...currentOrder, status, updatedAt };
          return currentOrder;
        }),
        updatePayment: vi.fn(async (id: number, data: any) => {
          currentOrder = { ...currentOrder, ...data };
          return currentOrder;
        }),
      } as any,
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
      } as any,
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

  it("persiste y habilita Payway, Getnet, MODO, Google Pay y credenciales de Mercado Pago", async () => {
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
        mercadopagoAccessToken: "APP_USR-custom-token-123",
        mercadopagoPublicKey: "APP_USR-pub-key-456",
        mercadopagoConnectedAccount: "comercio@aurastudio.com",
        paywayEnabled: true,
        paywayApiKey: "pk_payway_999",
        paywayMerchantId: "15002498",
        paywayCuotaSimpleEnabled: true,
        getnetEnabled: true,
        getnetClientId: "client_getnet_777",
        getnetSellerId: "seller_444",
        modoEnabled: true,
        modoMerchantId: "modo_888",
        modoTerminalId: "TERM-01",
        googlePayEnabled: true,
        googlePayMerchantId: "BCR2DN6T...",
      },
      mockDeps
    );

    const settings = await getShowroomSettings(mockDeps);
    expect(settings.mercadopagoAccessToken).toBe("APP_USR-custom-token-123");
    expect(settings.mercadopagoConnectedAccount).toBe("comercio@aurastudio.com");
    expect(settings.paywayEnabled).toBe(true);
    expect(settings.paywayApiKey).toBe("pk_payway_999");
    expect(settings.paywayCuotaSimpleEnabled).toBe(true);
    expect(settings.getnetEnabled).toBe(true);
    expect(settings.getnetClientId).toBe("client_getnet_777");
    expect(settings.modoEnabled).toBe(true);
    expect(settings.modoMerchantId).toBe("modo_888");
    expect(settings.googlePayEnabled).toBe(true);
    expect(settings.googlePayMerchantId).toBe("BCR2DN6T...");

    // Verificar que getAvailablePaymentMethods incluye todos los nuevos procesadores
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
});
