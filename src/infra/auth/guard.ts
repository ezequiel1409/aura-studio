import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "./session";
import { getEnv } from "../../lib/env";

/**
 * BR-08, BR-37: Verifica si una petición HTTP entrante cuenta con sesión de administradora válida.
 */
export async function isAuthenticatedAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("aura_admin_token")?.value;
  if (!token) return false;

  const env = getEnv();
  const { valid } = await verifySessionToken(token, env.SESSION_SECRET);
  return valid;
}

/**
 * BR-08, BR-37: Verifica la sesión de administradora en un Server Component.
 */
export async function isServerAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("aura_admin_token")?.value;
  if (!token) return false;

  const env = getEnv();
  const { valid } = await verifySessionToken(token, env.SESSION_SECRET);
  return valid;
}
