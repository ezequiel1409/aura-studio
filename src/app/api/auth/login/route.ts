import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { loginCustomer } from "../../../../services/customer.service";
import { CUSTOMER_SESSION_COOKIE_NAME, CUSTOMER_SESSION_TTL_MS } from "../../../../infra/auth/customer-session";
import { logger } from "../../../../lib/logger";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const { email, password } = body;

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "customer_default_client";

    const deps = getProductServiceDeps();
    const result = await loginCustomer(
      { email, password, clientKey: clientIp },
      {
        customerRepo: deps.customerRepo,
        loginAttemptRepo: deps.loginAttemptRepo,
      }
    );

    const durationMs = Math.round(performance.now() - startTime);

    if (!result.success || !result.customer) {
      const status = result.remainingLockSeconds ? 429 : 401;
      logger.warn("AUTH:CUSTOMER_LOGIN_FAILED", "Intento de inicio de sesión fallido de cliente", {
        email,
        status,
        durationMs,
        reason: result.remainingLockSeconds ? "BRUTE_FORCE_LOCKED" : "INVALID_CREDENTIALS",
      });
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Credenciales incorrectas.",
          remainingLockSeconds: result.remainingLockSeconds,
        },
        { status }
      );
    }

    logger.info("AUTH:CUSTOMER_LOGIN_SUCCESS", "Inicio de sesión de cliente exitoso", {
      customerId: result.customer.id,
      email,
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
    logger.error("AUTH:CUSTOMER_LOGIN_EXCEPTION", "Error interno en login de cliente", error, {
      durationMs,
      status: 500,
    });
    return NextResponse.json(
      { ok: false, error: "Ocurrió un error inesperado al iniciar sesión." },
      { status: 500 }
    );
  }
}
