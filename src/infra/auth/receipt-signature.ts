import { getEnv } from "../../lib/env";
import { timingSafeEqualStrings } from "./session";

/**
 * Convierte un ArrayBuffer a string base64url seguro para URLs.
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
 * Genera una firma HMAC-SHA256 para permitir acceso temporal seguro a un comprobante.
 */
export async function createReceiptSignature(
  orderId: number,
  expiresAt: number,
  secret?: string
): Promise<string> {
  const signingSecret = secret || getEnv().SESSION_SECRET;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const message = `receipt:${orderId}:${expiresAt}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return bufferToBase64Url(signature);
}

/**
 * Valida la autenticidad e integridad de la firma HMAC y comprueba que no haya expirado.
 */
export async function verifyReceiptSignature(
  orderId: number,
  token: string,
  expiresAt: number,
  secret?: string
): Promise<boolean> {
  if (!token || !expiresAt || typeof expiresAt !== "number" || Number.isNaN(expiresAt)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (expiresAt < nowSeconds) {
    return false; // Vencido
  }

  const signingSecret = secret || getEnv().SESSION_SECRET;
  const expectedSignature = await createReceiptSignature(orderId, expiresAt, signingSecret);

  return timingSafeEqualStrings(token, expectedSignature);
}

/**
 * Construye una URL firmada con vencimiento para acceder al comprobante de una orden.
 * @param orderId ID único numérico de la orden
 * @param baseUrl Base opcional para correos electrónicos (ej. https://mitienda.com)
 * @param expiresInSeconds Tiempo de validez en segundos (por defecto 30 días)
 */
export async function createReceiptSignedUrl(
  orderId: number,
  baseUrl?: string,
  expiresInSeconds: number = 30 * 24 * 3600
): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const token = await createReceiptSignature(orderId, expiresAt);
  const path = `/api/orders/${orderId}/receipt?token=${encodeURIComponent(token)}&expires=${expiresAt}`;

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}
