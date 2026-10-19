import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../../infra/db/connection";
import { markOrderPaymentManually } from "../../../../../../services/payment.service";
import { PaymentStatus } from "../../../../../../domain/payment/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
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

    return NextResponse.json({ ok: true, order: updated });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar estado de pago";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
