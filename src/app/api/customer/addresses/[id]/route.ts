import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getAuthenticatedCustomer } from "../../../../../infra/auth/customer-session";
import { deleteCustomerAddress, setDefaultCustomerAddress } from "../../../../../services/customer.service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedCustomer(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const addressId = parseInt(id, 10);
    if (Number.isNaN(addressId) || addressId <= 0) {
      return NextResponse.json({ ok: false, error: "ID de dirección inválido" }, { status: 400 });
    }

    const deps = getProductServiceDeps();
    const success = await deleteCustomerAddress(session.customerId, addressId, {
      customerRepo: deps.customerRepo,
      customerAddressRepo: deps.customerAddressRepo,
    });

    if (!success) {
      return NextResponse.json(
        { ok: false, error: "No se pudo eliminar la dirección o no pertenece a tu cuenta." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en DELETE /api/customer/addresses/[id]:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al eliminar la dirección." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedCustomer(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const addressId = parseInt(id, 10);
    if (Number.isNaN(addressId) || addressId <= 0) {
      return NextResponse.json({ ok: false, error: "ID de dirección inválido" }, { status: 400 });
    }

    const deps = getProductServiceDeps();
    const success = await setDefaultCustomerAddress(session.customerId, addressId, {
      customerRepo: deps.customerRepo,
      customerAddressRepo: deps.customerAddressRepo,
    });

    if (!success) {
      return NextResponse.json(
        { ok: false, error: "No se pudo actualizar la dirección principal." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en PATCH /api/customer/addresses/[id]:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al actualizar la dirección." },
      { status: 500 }
    );
  }
}

