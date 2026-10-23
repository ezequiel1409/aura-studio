import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { registerCustomer } from "../../../../services/customer.service";
import { CUSTOMER_SESSION_COOKIE_NAME, CUSTOMER_SESSION_TTL_MS } from "../../../../infra/auth/customer-session";
import { DomainError } from "../../../../domain/errors";
import { logger } from "../../../../lib/logger";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const deps = getProductServiceDeps();

    const result = await registerCustomer(body, {
      customerRepo: deps.customerRepo,
      customerAddressRepo: deps.customerAddressRepo,
      orderRepo: deps.orderRepo,
      loginAttemptRepo: deps.loginAttemptRepo,
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!result.success || !result.customer) {
      logger.warn("AUTH:CUSTOMER_REGISTER_FAILED", "Fallo al registrar nuevo cliente", {
        email: body.email,
        reason: result.error,
        durationMs,
        status: 400,
      });
      return NextResponse.json(
        { ok: false, error: result.error || "No se pudo registrar la cuenta." },
        { status: 400 }
      );
    }

    logger.info("AUTH:CUSTOMER_REGISTER_SUCCESS", "Nuevo cliente registrado exitosamente", {
      customerId: result.customer.id,
      email: result.customer.email,
      durationMs,
      status: 200,
    });

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
    const durationMs = Math.round(performance.now() - startTime);
    if (error instanceof DomainError) {
      logger.warn("AUTH:CUSTOMER_REGISTER_DOMAIN_ERROR", error.message, {
        durationMs,
        status: 400,
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    logger.error("AUTH:CUSTOMER_REGISTER_EXCEPTION", "Error inesperado al registrar cliente", error, {
      durationMs,
      status: 500,
    });
    return NextResponse.json(
      { ok: false, error: "Ocurrió un error inesperado al registrar la cuenta." },
      { status: 500 }
    );
  }
}
