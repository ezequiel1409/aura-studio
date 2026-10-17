import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getAuthenticatedCustomer } from "../../../../infra/auth/customer-session";
import {
  updateCustomerProfile,
  updateCustomerPassword,
  getCustomerProfile,
} from "../../../../services/customer.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedCustomer(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const deps = getProductServiceDeps();
    const customer = await getCustomerProfile(session.customerId, {
      customerRepo: deps.customerRepo,
    });

    if (!customer) {
      return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    console.error("Error en GET /api/customer/profile:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener perfil." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthenticatedCustomer(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const deps = getProductServiceDeps();

    // 1. Si incluye cambio de contraseña
    if (body.newPassword) {
      const pwdResult = await updateCustomerPassword(
        session.customerId,
        {
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        },
        { customerRepo: deps.customerRepo }
      );

      if (!pwdResult.success) {
        return NextResponse.json(
          { ok: false, error: pwdResult.error || "Error al actualizar contraseña." },
          { status: 400 }
        );
      }
    }

    // 2. Si incluye actualización de datos de perfil
    let updatedCustomer = null;
    if (body.name !== undefined || body.phone !== undefined) {
      updatedCustomer = await updateCustomerProfile(
        session.customerId,
        {
          name: body.name,
          phone: body.phone,
        },
        { customerRepo: deps.customerRepo }
      );
    } else {
      updatedCustomer = await getCustomerProfile(session.customerId, {
        customerRepo: deps.customerRepo,
      });
    }

    return NextResponse.json({
      ok: true,
      customer: updatedCustomer,
      message: "Perfil actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error en PATCH /api/customer/profile:", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar perfil." },
      { status: 500 }
    );
  }
}

