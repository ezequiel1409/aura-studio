import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getEnv } from "../../lib/env";

export const CUSTOMER_SESSION_COOKIE_NAME = "aura_customer_session";
export const CUSTOMER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días de persistencia

export interface CustomerSessionPayload {
  customerId: number;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Crea un token de sesión para cliente firmado con HMAC-SHA256.
 */
export async function createCustomerSessionToken(
  customer: { customerId: number; email: string; name: string },
  secret?: string,
  ttlMs: number = CUSTOMER_SESSION_TTL_MS,
  now: number = Date.now()
): Promise<string> {
  const env = getEnv();
  const sessionSecret = secret || env.SESSION_SECRET;

  const payload: CustomerSessionPayload = {
    customerId: customer.customerId,
    email: customer.email,
    name: customer.name,
    iat: now,
    exp: now + ttlMs,
  };

  const payloadJson = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payloadJson);
  const payloadB64 = bufferToBase64Url(payloadBytes.buffer as ArrayBuffer);

  const key = await getHmacKey(sessionSecret);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );

  const signatureB64 = bufferToBase64Url(signatureBuffer);
  return `${payloadB64}.${signatureB64}`;
}

export type CustomerSessionVerificationFailureReason =
  | "missing_token"
  | "invalid_format"
  | "invalid_signature"
  | "token_expired"
  | "parse_error";

export interface CustomerSessionVerificationResult {
  valid: boolean;
  payload?: CustomerSessionPayload;
  reason?: CustomerSessionVerificationFailureReason;
}

/**
 * Verifica el token de sesión de un cliente.
 */
export async function verifyCustomerSessionToken(
  token: string,
  secret?: string,
  now: number = Date.now()
): Promise<CustomerSessionVerificationResult> {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "missing_token" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "invalid_format" };
  }

  const [payloadB64, signatureB64] = parts;

  try {
    const env = getEnv();
    const sessionSecret = secret || env.SESSION_SECRET;
    const key = await getHmacKey(sessionSecret);
    const encoder = new TextEncoder();
    const signatureBytes = base64UrlToBuffer(signatureB64);

    const isSignatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadB64)
    );

    if (!isSignatureValid) {
      return { valid: false, reason: "invalid_signature" };
    }

    const payloadBytes = base64UrlToBuffer(payloadB64);
    const decoder = new TextDecoder();
    const payloadJson = decoder.decode(payloadBytes);
    const payload: CustomerSessionPayload = JSON.parse(payloadJson);

    if (typeof payload.exp !== "number" || payload.exp <= now) {
      return { valid: false, payload, reason: "token_expired" };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "parse_error" };
  }
}

/**
 * Extrae y verifica la sesión a partir de un token arbitrario.
 */
export async function getCustomerSessionFromToken(
  token: string | undefined | null
): Promise<CustomerSessionPayload | null> {
  if (!token) return null;
  const result = await verifyCustomerSessionToken(token);
  if (!result.valid || !result.payload) return null;
  return result.payload;
}

/**
 * Extrae la sesión de cliente autenticado desde la request entrante o cookies de Next.js.
 */
export async function getAuthenticatedCustomer(
  req?: NextRequest
): Promise<CustomerSessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }

  return getCustomerSessionFromToken(token);
}

