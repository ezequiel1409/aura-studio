import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createTestEnvironment } from "./setup-db";
import { setGlobalAppDepsForTesting } from "../src/infra/db/connection";
import { createProduct } from "../src/services/product.service";
import { createOrder, uploadTransferReceipt } from "../src/services/order.service";
import { registerCustomer } from "../src/services/customer.service";
import { GET as getReceiptHandler } from "../src/app/api/orders/[id]/receipt/route";
import { createSessionToken } from "../src/infra/auth/session";
import { ADMIN_SESSION_COOKIE_NAME } from "../src/infra/auth/guard";
import { CUSTOMER_SESSION_COOKIE_NAME } from "../src/infra/auth/customer-session";
import { createReceiptSignature, createReceiptSignedUrl } from "../src/infra/auth/receipt-signature";
import { getEnv } from "../src/lib/env";

describe("Seguridad y Control de Acceso a Comprobantes de Transferencia (Sección 9 / BR-41)", () => {
  let env: ReturnType<typeof createTestEnvironment>;
  let dummyPdfBytes: Buffer;
  let adminToken: string;
  let ownerCustomerToken: string;
  let otherCustomerToken: string;
  let orderId: number;
  let orderCode: number;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
    setGlobalAppDepsForTesting(env.deps);

    dummyPdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Title (Receipt) >>\nendobj\ntrailer\n<< >>\n%%EOF");

    // 1. Crear producto base
    const product = await createProduct(
      {
        rawText: "Prenda Base $35.000",
        colors: [{ name: "Negro", position: 0, sizes: [{ size: "M", stock: 10 }] }],
      },
      env.deps
    );

    // 2. Registrar clienta dueña y otra clienta en BD
    const regOwner = await registerCustomer(
      {
        name: "Clienta Dueña",
        email: "clienta1@example.com",
        phone: "1122334455",
        dni: "35111222",
        password: "Password123!",
      },
      env.deps
    );
    ownerCustomerToken = regOwner.sessionToken!;

    const regOther = await registerCustomer(
      {
        name: "Otra Clienta",
        email: "otra_clienta@example.com",
        phone: "1199887766",
        dni: "36111222",
        password: "Password123!",
      },
      env.deps
    );
    otherCustomerToken = regOther.sessionToken!;

    // 3. Crear orden perteneciente a la clienta dueña
    const { order } = await createOrder(
      {
        customerName: "Clienta Dueña",
        customerPhone: "1122334455",
        customerEmail: "clienta1@example.com",
        customerDni: "35111222",
        customerId: regOwner.customer!.id,
        deliveryMethod: "PICKUP",
        paymentMethod: "TRANSFER",
        items: [
          {
            productId: product.id,
            productCode: product.code,
            productTitle: product.title || "Prenda Base",
            colorName: "Negro",
            size: "M",
            quantity: 1,
            unitPriceCents: 3500000,
          },
        ],
      },
      env.deps
    );

    orderId = order.id;
    orderCode = order.code;

    // Subir comprobante a storage
    await uploadTransferReceipt(orderId, dummyPdfBytes, env.deps);

    // 4. Crear token de sesión de admin
    adminToken = await createSessionToken(
      getEnv().SESSION_SECRET,
      { email: "admin@example.com", role: "SUPER_ADMIN" },
      7200 * 1000
    );
  });

  afterEach(() => {
    setGlobalAppDepsForTesting(null);
  });

  it("rechaza la descarga anónima sin sesión ni firma digital (401)", async () => {
    const req = new NextRequest(`http://localhost:3000/api/orders/${orderId}/receipt`);
    const res = await getReceiptHandler(req, { params: Promise.resolve({ id: String(orderId) }) });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toMatch(/Se requiere inicio de sesión o un enlace firmado válido/i);
  });

  it("rechaza si una clienta autenticada intenta ver el comprobante de otra clienta (403)", async () => {
    const req = new NextRequest(`http://localhost:3000/api/orders/${orderId}/receipt`);
    req.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, otherCustomerToken);

    const res = await getReceiptHandler(req, { params: Promise.resolve({ id: String(orderId) }) });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toMatch(/No tenés permisos para acceder al comprobante/i);
  });

  it("permite la descarga a la clienta dueña de la orden con su sesión activa (200)", async () => {
    const req = new NextRequest(`http://localhost:3000/api/orders/${orderId}/receipt`);
    req.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, ownerCustomerToken);

    const res = await getReceiptHandler(req, { params: Promise.resolve({ id: String(orderId) }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain(`comprobante-orden-${orderCode}.pdf`);
  });

  it("permite la descarga a cualquier administradora autenticada (200)", async () => {
    const req = new NextRequest(`http://localhost:3000/api/orders/${orderId}/receipt`);
    req.cookies.set(ADMIN_SESSION_COOKIE_NAME, adminToken);

    const res = await getReceiptHandler(req, { params: Promise.resolve({ id: String(orderId) }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("permite la descarga a través de un link firmado con HMAC válido para emails (200)", async () => {
    const signedUrl = await createReceiptSignedUrl(orderId, "http://localhost:3000", 3600);
    const req = new NextRequest(signedUrl);

    const res = await getReceiptHandler(req, { params: Promise.resolve({ id: String(orderId) }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("rechaza el acceso si el link firmado ya expiró (403)", async () => {
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 60; // Venció hace 1 minuto
    const signature = await createReceiptSignature(orderId, expiredTimestamp);
    const expiredUrl = `http://localhost:3000/api/orders/${orderId}/receipt?token=${encodeURIComponent(signature)}&expires=${expiredTimestamp}`;

    const req = new NextRequest(expiredUrl);
    const res = await getReceiptHandler(req, { params: Promise.resolve({ id: String(orderId) }) });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toMatch(/inválido o ha expirado/i);
  });

  it("rechaza el acceso si el token fue manipulado o la firma no coincide (403)", async () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
    const fakeSignature = "invalid_tampered_hmac_signature";
    const tamperedUrl = `http://localhost:3000/api/orders/${orderId}/receipt?token=${fakeSignature}&expires=${futureTimestamp}`;

    const req = new NextRequest(tamperedUrl);
    const res = await getReceiptHandler(req, { params: Promise.resolve({ id: String(orderId) }) });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toMatch(/inválido o ha expirado/i);
  });
});
