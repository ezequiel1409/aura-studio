import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getAuthenticatedCustomer } from "../../../../infra/auth/customer-session";
import { getCustomerOrders } from "../../../../services/customer.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedCustomer(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const deps = getProductServiceDeps();
    const orders = await getCustomerOrders(session.customerId, {
      customerRepo: deps.customerRepo,
      orderRepo: deps.orderRepo,
    });

    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("Error en GET /api/customer/orders:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener historial de pedidos." },
      { status: 500 }
    );
  }
}

