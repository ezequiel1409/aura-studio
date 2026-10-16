import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { registerCustomer } from "../../../../services/customer.service";
import { CUSTOMER_SESSION_COOKIE_NAME, CUSTOMER_SESSION_TTL_MS } from "../../../../infra/auth/customer-session";
import { DomainError } from "../../../../domain/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deps = getProductServiceDeps();

    const result = await registerCustomer(body, {
      customerRepo: deps.customerRepo,
      customerAddressRepo: deps.customerAddressRepo,
      orderRepo: deps.orderRepo,
      loginAttemptRepo: deps.loginAttemptRepo,
    });

    if (!result.success || !result.customer) {
      return NextResponse.json(
        { ok: false, error: result.error || "No se pudo registrar la cuenta." },
        { status: 400 }
      );
    }

    const res = NextResponse.json({ ok: true, customer: result.customer });
    res.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, result.sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(CUSTOMER_SESSION_TTL_MS / 1000), // 30 días
    });

    return res;
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("Error en POST /api/auth/register:", error);
    return NextResponse.json(
      { ok: false, error: "Ocurrió un error inesperado al registrar la cuenta." },
      { status: 500 }
    );
  }
}

