import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { listOrders } from "../../../../services/order.service";
import { OrderStatus } from "../../../../domain/order/types";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json(
      { ok: false, error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const deps = getProductServiceDeps();

    const orders = await listOrders(
      {
        status:
          statusParam && statusParam !== "ALL"
            ? (statusParam as OrderStatus)
            : undefined,
      },
      deps
    );

    return NextResponse.json({ ok: true, orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al listar órdenes";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

