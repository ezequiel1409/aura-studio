import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminRole } from "../../domain/auth/types";
import { getDefaultBrandName, getPlatformOperatorName } from "../../lib/brand";
import { getEnv } from "../../lib/env";
import { getOrdersSummaryCounts } from "../../services/order.service";
import { getShowroomSettings } from "../../services/settings.service";
import { getProductServiceDeps } from "../db/connection";
import { ADMIN_SESSION_COOKIE_NAME } from "./guard";
import { verifySessionToken } from "./session";

export interface AdminSessionDTO {
  authenticated: true;
  userId?: number;
  email?: string;
  role?: AdminRole;
  expiresAtMs: number;
  expiresInSeconds: number;
}

export interface AdminShellData {
  session: AdminSessionDTO | null;
  brandName: string;
  storeType: string;
  logoUrl: string | null;
  ordersPaused: boolean;
  ordersPausedNotice: string | null;
  pendingOrdersCount: number;
  operatorName: string | null;
}

/**
 * Lee y verifica criptográficamente la sesión administrativa desde cookies().
 * Cacheado por request con React.cache() para evitar re-verificaciones en Server Components.
 */
export const getAdminSession = cache(async (): Promise<AdminSessionDTO | null> => {
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  } catch {
    // Fuera de request scope (tests unitarios o prerender sin cookies)
    return null;
  }

  if (!token) {
    return null;
  }

  const env = getEnv();
  const verification = await verifySessionToken(token, env.SESSION_SECRET);
  if (!verification.valid || !verification.payload) {
    return null;
  }

  const now = Date.now();
  return {
    authenticated: true,
    userId: verification.payload.userId,
    email: verification.payload.email,
    role: verification.payload.role,
    expiresAtMs: verification.payload.exp,
    expiresInSeconds: Math.max(0, Math.floor((verification.payload.exp - now) / 1000)),
  };
});

/**
 * Exige una sesión administrativa activa o redirige al login del panel.
 */
export async function requireAdminSession(): Promise<AdminSessionDTO> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Hidrata los datos globales del shell /admin en el servidor en 1 solo ciclo,
 * eliminando fetches redundantes de sesión, branding y pedidos pendientes en el cliente.
 */
export const getAdminShellData = cache(async (): Promise<AdminShellData> => {
  const defaultBrand = getDefaultBrandName();
  const operatorName = getPlatformOperatorName();
  const session = await getAdminSession();

  if (!session) {
    return {
      session: null,
      brandName: defaultBrand,
      storeType: "Showroom",
      logoUrl: null,
      ordersPaused: false,
      ordersPausedNotice: null,
      pendingOrdersCount: 0,
      operatorName,
    };
  }

  try {
    const deps = getProductServiceDeps();
    const [settings, ordersSummary] = await Promise.all([
      getShowroomSettings(deps),
      getOrdersSummaryCounts(deps),
    ]);

    return {
      session,
      brandName: settings.showroomName || defaultBrand,
      storeType: settings.storeType || "Showroom",
      logoUrl: settings.logoUrl || null,
      ordersPaused: Boolean(settings.ordersPaused),
      ordersPausedNotice: settings.ordersPausedNotice ?? null,
      pendingOrdersCount: ordersSummary.pending || 0,
      operatorName,
    };
  } catch {
    return {
      session,
      brandName: defaultBrand,
      storeType: "Showroom",
      logoUrl: null,
      ordersPaused: false,
      ordersPausedNotice: null,
      pendingOrdersCount: 0,
      operatorName,
    };
  }
});
