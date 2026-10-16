import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getAuthenticatedCustomer } from "../../../../infra/auth/customer-session";
import { getCustomerProfile } from "../../../../services/customer.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedCustomer(req);
    if (!session) {
      return NextResponse.json({ ok: false, customer: null }, { status: 401 });
    }

    const deps = getProductServiceDeps();
    const customer = await getCustomerProfile(session.customerId, {
      customerRepo: deps.customerRepo,
    });

    if (!customer) {
      return NextResponse.json({ ok: false, customer: null }, { status: 401 });
    }

    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    console.error("Error en GET /api/auth/me:", error);
    return NextResponse.json(
      { ok: false, customer: null, error: "Error interno al verificar sesión." },
      { status: 500 }
    );
  }
}

