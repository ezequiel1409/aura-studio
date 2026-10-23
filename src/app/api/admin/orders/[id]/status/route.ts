import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../../infra/db/connection";
import { updateOrderStatus } from "../../../../../../services/order.service";
import { OrderStatus } from "../../../../../../domain/order/types";
import { logger } from "../../../../../../lib/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = performance.now();
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    logger.warn("ADMIN:ORDER_STATUS_UNAUTHORIZED", "Intento no autorizado de cambio de estado de orden", {
      status: 401,
    });
    return NextResponse.json(
      { ok: false, error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const resolvedParams = await params;
    const orderId = parseInt(resolvedParams.id, 10);
    if (!orderId || Number.isNaN(orderId)) {
      return NextResponse.json(
        { ok: false, error: "ID de orden inválido." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses: OrderStatus[] = [
      "PENDING",
      "CONFIRMED",
      "PAID",
      "CANCELLED",
    ];
    if (!status || !validStatuses.includes(status)) {
      const durationMs = Math.round(performance.now() - startTime);
      logger.warn("ADMIN:ORDER_STATUS_INVALID", `Estado de orden inválido solicitado: ${status}`, {
        orderId,
        status: 400,
        durationMs,
      });
      return NextResponse.json(
        { ok: false, error: "Estado de orden inválido." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const updated = await updateOrderStatus(orderId, status as OrderStatus, deps);
    const durationMs = Math.round(performance.now() - startTime);

    logger.info("ADMIN:ORDER_STATUS_CHANGED", `Estado de orden #${updated.code} cambiado a ${status}`, {
      orderId: updated.id,
      orderCode: updated.code,
      newStatus: status,
      durationMs,
      status: 200,
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (error: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const message =
      error instanceof Error ? error.message : "Error al actualizar estado de orden";
    logger.error("ADMIN:ORDER_STATUS_ERROR", message, error, { durationMs, status: 400 });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
