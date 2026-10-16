import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getAuthenticatedCustomer } from "../../../../infra/auth/customer-session";
import { addCustomerAddress, getCustomerAddresses } from "../../../../services/customer.service";
import { DomainError } from "../../../../domain/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedCustomer(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const deps = getProductServiceDeps();
    const addresses = await getCustomerAddresses(session.customerId, {
      customerRepo: deps.customerRepo,
      customerAddressRepo: deps.customerAddressRepo,
    });

    return NextResponse.json({ ok: true, addresses });
  } catch (error) {
    console.error("Error en GET /api/customer/addresses:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener direcciones." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedCustomer(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const deps = getProductServiceDeps();

    const address = await addCustomerAddress(session.customerId, body, {
      customerRepo: deps.customerRepo,
      customerAddressRepo: deps.customerAddressRepo,
    });

    return NextResponse.json({ ok: true, address });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("Error en POST /api/customer/addresses:", error);
    return NextResponse.json(
      { ok: false, error: "Error al guardar la dirección." },
      { status: 500 }
    );
  }
}

