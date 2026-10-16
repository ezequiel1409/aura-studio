import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { parseOrderCode } from "../../../../../domain/order";

export async function GET(
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
    const rawId = resolvedParams.id;
    const deps = getProductServiceDeps();

    let order = null;
    const numId = parseInt(rawId, 10);
    if (!Number.isNaN(numId) && numId > 0) {
      order = await deps.orderRepo.findById(numId);
    }

    if (!order) {
      const codeNum = parseOrderCode(rawId);
      if (codeNum) {
        order = await deps.orderRepo.findByCode(codeNum);
      }
    }

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Orden no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener la orden";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

