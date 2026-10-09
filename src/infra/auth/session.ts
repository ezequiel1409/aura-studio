import { SESSION_INACTIVITY_MS } from "../../domain/auth/rules";
import { AdminRole } from "../../domain/auth/types";

export interface SessionPayload {
  userId?: number;
  email?: string;
  role?: AdminRole;
  iat: number;
  exp: number;
}

/**
 * Convierte un ArrayBuffer a string base64url.
 */
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

/**
 * Convierte un string base64url a Uint8Array.
 */
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
 * Crea un token de sesión criptográficamente firmado con HMAC SHA-256 (BR-37).
 * Compatible con Node.js y Edge/Cloudflare Workers.
 */
export async function createSessionToken(
  secret: string,
  extraPayloadOrTtl?: { userId?: number; email?: string; role?: AdminRole } | number,
  ttlMsOrNow?: number,
  nowArg?: number
): Promise<string> {
  let extraPayload: { userId?: number; email?: string; role?: AdminRole } | undefined;
  let ttlMs: number = SESSION_INACTIVITY_MS;
  let now: number = Date.now();

  if (typeof extraPayloadOrTtl === "number") {
    ttlMs = extraPayloadOrTtl;
    if (typeof ttlMsOrNow === "number") {
      now = ttlMsOrNow;
    }
  } else {
    extraPayload = extraPayloadOrTtl;
    if (typeof ttlMsOrNow === "number") {
      ttlMs = ttlMsOrNow;
    }
    if (typeof nowArg === "number") {
      now = nowArg;
    }
  }

  const payload: SessionPayload = {
    ...extraPayload,
    iat: now,
    exp: now + ttlMs,
  };

  const payloadJson = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payloadJson);
  const payloadB64 = bufferToBase64Url(payloadBytes.buffer as ArrayBuffer);

  const key = await getHmacKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );

  const signatureB64 = bufferToBase64Url(signatureBuffer);
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifica la firma y la fecha de expiración de un token de sesión (BR-37).
 */
export async function verifySessionToken(
  token: string,
  secret: string,
  now: number = Date.now()
): Promise<{ valid: boolean; payload?: SessionPayload }> {
  if (!token || typeof token !== "string") {
    return { valid: false };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [payloadB64, signatureB64] = parts;

  try {
    const key = await getHmacKey(secret);
    const encoder = new TextEncoder();
    const signatureBytes = base64UrlToBuffer(signatureB64);

    const isSignatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadB64)
    );

    if (!isSignatureValid) {
      return { valid: false };
    }

    const payloadBytes = base64UrlToBuffer(payloadB64);
    const decoder = new TextDecoder();
    const payloadJson = decoder.decode(payloadBytes);
    const payload: SessionPayload = JSON.parse(payloadJson);

    if (typeof payload.exp !== "number" || payload.exp <= now) {
      return { valid: false }; // Expirado por inactividad
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

/**
 * Comparación de strings en tiempo constante para evitar ataques de timing (BR-10).
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < aBuf.length; i++) {
    mismatch |= aBuf[i] ^ bBuf[i];
  }

  return mismatch === 0;
}

/**
 * Extrae y verifica el payload de sesión a partir del valor de la cookie del admin.
 */
export async function getAdminSessionFromToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  const { getEnv } = await import("../../lib/env");
  const env = getEnv();
  const result = await verifySessionToken(token, env.SESSION_SECRET);
  if (!result.valid || !result.payload) return null;
  return result.payload;
}
