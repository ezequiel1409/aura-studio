import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { expirePendingTransferOrders } from "../../../../services/order.service";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { timingSafeEqualStrings } from "../../../../infra/auth/session";
import { getEnv } from "../../../../lib/env";
import { logger } from "../../../../lib/logger";

/**
 * Verifica que el disparador de expiración provenga de un administrador autenticado
 * o de un cron job autorizado mediante Bearer token (SRP).
 */
async function isAuthorizedExpireRequest(req: NextRequest): Promise<boolean> {
  if (await isAuthenticatedAdmin(req)) {
    return true;
  }

  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const cronSecret = process.env.CRON_SECRET || getEnv().SESSION_SECRET;
    if (token && cronSecret && timingSafeEqualStrings(token, cronSecret)) {
      return true;
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const authorized = await isAuthorizedExpireRequest(req);
    if (!authorized) {
      return NextResponse.json(
        { ok: false, error: "No autorizado para ejecutar la expiración de órdenes." },
        { status: 401 }
      );
    }

    const deps = getProductServiceDeps();
    const expiredCount = await expirePendingTransferOrders(deps);
    const durationMs = Math.round(performance.now() - startTime);

    if (expiredCount > 0) {
      logger.info("ORDERS:EXPIRE_JOB", `Auto-cancelación de órdenes vencidas ejecutada`, {
        expiredCount,
        durationMs,
      });
    }

    return NextResponse.json({
      ok: true,
      expiredCount,
      message: `Se cancelaron y restauraron al stock ${expiredCount} órdenes con plazo de 24 horas vencido.`,
    });
  } catch (error: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : "Error al expirar órdenes";
    logger.error("ORDERS:EXPIRE_JOB_ERROR", message, error, { durationMs });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
