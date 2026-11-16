import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  COMMERCE_NAME: z.string().default("Mi Tienda"),
  COMMERCE_SLUG: z.string().default("mi-tienda"),
  COMMERCE_WHATSAPP: z.string().default("+5491100000000"),
  DEFAULT_WHATSAPP_NUMBER: z.string().default("+5491100000000"),
  DEFAULT_BRAND_NAME: z.string().default("Mi Tienda"),
  DEFAULT_RESERVATION_HOURS: z.coerce.number().int().positive().default(48),
  DATABASE_URL: z.string().optional(),
  ADMIN_EMAIL: z.string().default("admin@tienda.local"),
  ADMIN_PASSWORD: z.string().default("admin-secret-2026"),
  SESSION_SECRET: z.string().default("default-session-secret-key-at-least-32-chars-long"),
  MP_SANDBOX: z.string().default("true"),
  MP_ACCESS_TOKEN: z.string().default("TEST-00000000-0000-0000-0000-000000000000"),
  MP_PUBLIC_KEY: z.string().default("TEST-00000000-0000-0000-0000-000000000000"),
  MP_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLIC_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Notificaciones <onboarding@resend.dev>"),
  ORDER_NOTIFICATIONS_EMAIL: z.string().optional(),
  ADMIN_RECOVERY_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

function hydrateProcessEnvFromLocalFile(): void {
  if (typeof process === "undefined" || process.env.NODE_ENV === "test") {
    return;
  }
  if (
    process.env.MP_ACCESS_TOKEN &&
    !process.env.MP_ACCESS_TOKEN.startsWith("TEST-00000000")
  ) {
    return;
  }
  try {
    const req = eval("require") as (id: string) => any;
    const fs = req("fs");
    const path = req("path");
    const envLocalPath = path.resolve(process.cwd(), ".env.local");
    if (!fs.existsSync(envLocalPath)) return;
    const content: string = fs.readFileSync(envLocalPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && val && (!process.env[key] || process.env[key]?.startsWith("TEST-00000000"))) {
        process.env[key] = val;
      }
    }
  } catch {
    // Ignorar en entornos Edge sin sistema de archivos local
  }
}

export function getEnv(overrideProcessEnv?: Record<string, string | undefined>): Env {
  if (overrideProcessEnv) {
    return envSchema.parse(overrideProcessEnv);
  }
  hydrateProcessEnvFromLocalFile();
  if (
    !parsedEnv ||
    (process.env.MP_ACCESS_TOKEN && parsedEnv.MP_ACCESS_TOKEN !== process.env.MP_ACCESS_TOKEN) ||
    (process.env.MP_SANDBOX && parsedEnv.MP_SANDBOX !== process.env.MP_SANDBOX)
  ) {
    parsedEnv = envSchema.parse(process.env);
  }
  return parsedEnv;
}
