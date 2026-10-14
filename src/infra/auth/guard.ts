import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "./session";
import { getEnv } from "../../lib/env";

/**
 * BR-08, BR-37: Verifica si una petición HTTP entrante cuenta con sesión de administradora válida.
 * Registra advertencias de seguridad si el intento es desautenticado o la sesión expiró.
 */
export async function isAuthenticatedAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("aura_admin_token")?.value;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  const path = req.nextUrl?.pathname || "api";

  if (!token) {
    console.warn(`[AUTH] Intento de acceso desautenticado (sin token): path=${path} ip=${ip}`);
    return false;
  }

  const env = getEnv();
  const { valid, reason, payload } = await verifySessionToken(token, env.SESSION_SECRET);
  if (!valid) {
    console.warn(
      `[AUTH] Intento de acceso desautenticado (${reason || "invalido"}): path=${path} ip=${ip} user=${payload?.email || "anon"}`
    );
    return false;
  }
  return true;
}

/**
 * BR-08, BR-37: Verifica la sesión de administradora en un Server Component.
 * Registra advertencias si la sesión no existe o venció.
 */
export async function isServerAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("aura_admin_token")?.value;
  if (!token) {
    console.warn("[AUTH] Acceso a Server Component desautenticado (sin token)");
    return false;
  }

  const env = getEnv();
  const { valid, reason, payload } = await verifySessionToken(token, env.SESSION_SECRET);
  if (!valid) {
    console.warn(
      `[AUTH] Acceso a Server Component con sesión expirada/inválida (${reason || "invalida"}): user=${payload?.email || "anon"}`
    );
    return false;
  }
  return true;
}
