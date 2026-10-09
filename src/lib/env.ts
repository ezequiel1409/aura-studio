import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DEFAULT_WHATSAPP_NUMBER: z.string().default("+5491100000000"),
  DEFAULT_BRAND_NAME: z.string().default("Aura Studio"),
  DEFAULT_RESERVATION_HOURS: z.coerce.number().int().positive().default(48),
  DATABASE_URL: z.string().optional(),
  ADMIN_PASSWORD: z.string().default("aura-admin-secret-2026"),
  SESSION_SECRET: z.string().default("aura-studio-session-secret-key-at-least-32-chars-long"),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(overrideProcessEnv?: Record<string, string | undefined>): Env {
  if (overrideProcessEnv) {
    return envSchema.parse(overrideProcessEnv);
  }
  if (!parsedEnv) {
    parsedEnv = envSchema.parse(process.env);
  }
  return parsedEnv;
}

