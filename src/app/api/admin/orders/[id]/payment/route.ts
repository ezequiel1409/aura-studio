import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../../infra/db/connection";
import { markOrderPaymentManually } from "../../../../../../services/payment.service";
import { PaymentStatus } from "../../../../../../domain/payment/types";
import { logger } from "../../../../../../lib/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = performance.now();
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    logger.warn("ADMIN:PAYMENT_UPDATE_UNAUTHORIZED", "Intento no autorizado de actualización de pago", {
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
    const { paymentStatus } = body;

    const validStatuses: PaymentStatus[] = [
      "PENDING",
      "AUTHORIZED",
      "PAID",
      "REJECTED",
      "REFUNDED",
    ];
    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      const durationMs = Math.round(performance.now() - startTime);
      logger.warn("ADMIN:PAYMENT_STATUS_INVALID", `Estado de pago inválido solicitado: ${paymentStatus}`, {
        orderId,
        status: 400,
        durationMs,
      });
      return NextResponse.json(
        { ok: false, error: "Estado de pago inválido." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const updated = await markOrderPaymentManually(
      orderId,
      paymentStatus as PaymentStatus,
      deps
    );
    const durationMs = Math.round(performance.now() - startTime);

    logger.info("ADMIN:PAYMENT_STATUS_UPDATED", `Pago de orden #${updated.code} actualizado a ${paymentStatus}`, {
      orderId: updated.id,
      orderCode: updated.code,
      paymentStatus,
      durationMs,
      status: 200,
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (error: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const message =
      error instanceof Error ? error.message : "Error al actualizar estado de pago";
    logger.error("ADMIN:PAYMENT_UPDATE_ERROR", message, error, { durationMs, status: 400 });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
