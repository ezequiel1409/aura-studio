import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getOrdersSummaryCounts, listOrders } from "../../../../services/order.service";
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
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : 50;
    const parsedOffset = offsetParam ? Number.parseInt(offsetParam, 10) : 0;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(100, parsedLimit) : 50;
    const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
    const deps = getProductServiceDeps();

    const [orders, summary] = await Promise.all([
      listOrders(
        {
          status:
            statusParam && statusParam !== "ALL"
              ? (statusParam as OrderStatus)
              : undefined,
          limit,
          offset,
        },
        deps
      ),
      getOrdersSummaryCounts(deps),
    ]);

    return NextResponse.json({
      ok: true,
      orders,
      total: summary.total,
      pendingCount: summary.pending,
      hasMore: offset + orders.length < summary.total,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al listar órdenes";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

