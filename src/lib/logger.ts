/**
 * Utilidad centralizada de observabilidad y logging estructurado para Aura Studio.
 * Diseñada para Cloudflare Workers y Node.js (cero dependencias nativas).
 *
 * Principios:
 * - Cero PII: Enmascara o elimina automáticamente contraseñas, tokens, tarjetas, DNIs y correos.
 * - Estructurado: Genera JSON parseable para Cloudflare Logpush, Datadog y wrangler tail.
 * - Ligero: Cero overhead en runtime.
 */

export type LogLevel = "info" | "warn" | "error";

export interface LogContext {
  orderId?: number | string;
  orderCode?: number | string;
  productId?: number | string;
  productCode?: number | string;
  customerId?: number | string;
  adminId?: number | string;
  paymentMethod?: string;
  paymentStatus?: string;
  durationMs?: number;
  status?: number;
  path?: string;
  method?: string;
  reason?: string;
  itemsCount?: number;
  totalCents?: number;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "passwordsalt",
  "currentpassword",
  "newpassword",
  "token",
  "tokenhash",
  "masterkey",
  "secret",
  "apikey",
  "authorization",
  "cookie",
  "cvv",
  "cardnumber",
  "creditcard",
]);

export function maskEmail(email: string): string {
  if (!email || typeof email !== "string") return "***";
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const [user, domain] = parts;
  if (user.length <= 2) return `*@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

export function maskDni(dni: string | number): string {
  const str = String(dni).trim();
  if (str.length <= 4) return "****";
  return `***${str.slice(-4)}`;
}

export function sanitizeContext(context?: LogContext): Record<string, unknown> {
  if (!context) return {};
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    const lower = key.toLowerCase();

    if (SENSITIVE_KEYS.has(lower)) {
      cleaned[key] = "[REDACTED]";
      continue;
    }

    if (lower === "email" && typeof value === "string") {
      cleaned[key] = maskEmail(value);
      continue;
    }

    if ((lower === "dni" || lower === "customerdni") && (typeof value === "string" || typeof value === "number")) {
      cleaned[key] = maskDni(value);
      continue;
    }

    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        cleaned[key] = `[Array(${value.length})]`;
      } else {
        // En lugar de volcar objetos complejos que puedan contener PII, resumir
        const obj = value as Record<string, unknown>;
        const summary: Record<string, unknown> = {};
        if ("id" in obj) summary.id = obj.id;
        if ("code" in obj) summary.code = obj.code;
        if ("name" in obj && typeof obj.name === "string") summary.name = obj.name;
        if ("status" in obj) summary.status = obj.status;
        cleaned[key] = Object.keys(summary).length > 0 ? summary : "[Object]";
      }
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned;
}

export const logger = {
  info(tag: string, message: string, context?: LogContext) {
    const payload = {
      level: "INFO",
      timestamp: new Date().toISOString(),
      tag,
      message,
      ...sanitizeContext(context),
    };
    console.log(JSON.stringify(payload));
  },

  warn(tag: string, message: string, context?: LogContext) {
    const payload = {
      level: "WARN",
      timestamp: new Date().toISOString(),
      tag,
      message,
      ...sanitizeContext(context),
    };
    console.warn(JSON.stringify(payload));
  },

  error(tag: string, message: string, error?: unknown, context?: LogContext) {
    let errorDetails: Record<string, unknown> = {};
    if (error instanceof Error) {
      errorDetails = {
        errorName: error.name,
        errorMessage: error.message,
        stackSnippet: error.stack
          ?.split("\n")
          .slice(0, 3)
          .map((s) => s.trim())
          .join(" -> "),
      };
    } else if (error) {
      errorDetails = { errorMessage: String(error) };
    }

    const payload = {
      level: "ERROR",
      timestamp: new Date().toISOString(),
      tag,
      message,
      ...errorDetails,
      ...sanitizeContext(context),
    };
    console.error(JSON.stringify(payload));
  },
};

