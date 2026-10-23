import { NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { expirePendingTransferOrders } from "../../../../services/order.service";
import { logger } from "../../../../lib/logger";

export async function POST() {
  const startTime = performance.now();
  try {
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

export async function GET() {
  return POST();
}
