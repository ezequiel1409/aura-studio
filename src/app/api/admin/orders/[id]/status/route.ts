import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../../infra/db/connection";
import { updateOrderStatus } from "../../../../../../services/order.service";
import { OrderStatus } from "../../../../../../domain/order/types";

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
    const { status } = body;

    const validStatuses: OrderStatus[] = [
      "PENDING",
      "CONFIRMED",
      "PAID",
      "CANCELLED",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Estado de orden inválido." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const updated = await updateOrderStatus(orderId, status as OrderStatus, deps);

    return NextResponse.json({ ok: true, order: updated });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar estado de orden";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
