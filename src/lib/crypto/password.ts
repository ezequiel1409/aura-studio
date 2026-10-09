import { timingSafeEqualStrings } from "../../infra/auth/session";

const PBKDF2_ITERATIONS = 100_000;
const HASH_LENGTH_BYTES = 64; // 512 bits
const SALT_LENGTH_BYTES = 16;

/**
 * Convierte un ArrayBuffer a string hexadecimal.
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convierte un string hexadecimal a Uint8Array.
 */
function hexToBuffer(hex: string): Uint8Array {
  const match = hex.match(/.{1,2}/g);
  if (!match) return new Uint8Array(0);
  return new Uint8Array(match.map((byte) => parseInt(byte, 16)));
}

/**
 * Genera un salt criptográfico aleatorio en formato hexadecimal.
 */
export function generateSalt(length: number = SALT_LENGTH_BYTES): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

/**
 * Hashea una contraseña usando PBKDF2-HMAC-SHA512 con 100.000 iteraciones y salt único (BR-10).
 * Compatible con Node.js, Web Crypto API y Cloudflare Workers.
 */
export async function hashPassword(
  password: string,
  providedSalt?: string
): Promise<{ hash: string; salt: string }> {
  const saltHex = providedSalt || generateSalt();
  const saltBytes = hexToBuffer(saltHex);

  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-512",
    },
    passwordKey,
    HASH_LENGTH_BYTES * 8
  );

  const hashHex = bufferToHex(derivedBits);
  return {
    hash: hashHex,
    salt: saltHex,
  };
}

/**
 * Verifica una contraseña en tiempo constante contra un hash y salt almacenados (BR-10).
 */
export async function verifyPasswordHash(
  password: string,
  expectedHash: string,
  salt: string
): Promise<boolean> {
  try {
    const { hash } = await hashPassword(password, salt);
    return timingSafeEqualStrings(hash, expectedHash);
  } catch {
    return false;
  }
}

/**
 * Genera un token aleatorio seguro de 32 bytes (hex) para links de recuperación de contraseña.
 */
export function generateSecureToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

/**
 * Genera el hash SHA-256 de un token para almacenar en base de datos sin exponer el token crudo.
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return bufferToHex(hashBuffer);
}

