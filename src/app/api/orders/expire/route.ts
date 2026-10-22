import { NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { expirePendingTransferOrders } from "../../../../services/order.service";

export async function POST() {
  try {
    const deps = getProductServiceDeps();
    const expiredCount = await expirePendingTransferOrders(deps);
    return NextResponse.json({
      ok: true,
      expiredCount,
      message: `Se cancelaron y restauraron al stock ${expiredCount} órdenes con plazo de 24 horas vencido.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al expirar órdenes";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}

