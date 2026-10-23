import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { loginAdmin } from "../../../../services/auth.service";
import { getShowroomSettings } from "../../../../services/settings.service";
import { logger } from "../../../../lib/logger";

export async function GET() {
  try {
    const deps = getProductServiceDeps();
    const settings = await getShowroomSettings(deps);
    return NextResponse.json({
      ok: true,
      storeName: settings.showroomName,
      storeType: settings.storeType || "Showroom",
    });
  } catch {
    return NextResponse.json({
      ok: true,
      storeName: "Aura Studio",
      storeType: "Showroom",
    });
  }
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { ok: false, error: "La contraseña es obligatoria." },
        { status: 400 }
      );
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "admin_default_client";

    const deps = getProductServiceDeps();
    const result = await loginAdmin(
      { email, password, clientKey: clientIp },
      { loginAttemptRepo: deps.loginAttemptRepo, adminUserRepo: deps.adminUserRepo }
    );

    const durationMs = Math.round(performance.now() - startTime);

    if (!result.success) {
      const status = result.remainingLockSeconds ? 429 : 401;
      logger.warn("AUTH:ADMIN_LOGIN_FAILED", "Intento de inicio de sesión fallido de administrador", {
        email,
        status,
        durationMs,
        reason: result.remainingLockSeconds ? "BRUTE_FORCE_LOCKED" : "INVALID_CREDENTIALS",
      });
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          remainingLockSeconds: result.remainingLockSeconds,
        },
        { status }
      );
    }

    logger.info("AUTH:ADMIN_LOGIN_SUCCESS", "Inicio de sesión de administrador exitoso", {
      email,
      durationMs,
      status: 200,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("aura_admin_token", result.sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7200, // 2 horas (BR-37)
    });

    return res;
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    logger.error("AUTH:ADMIN_LOGIN_EXCEPTION", "Error interno en login de administrador", error, {
      durationMs,
      status: 500,
    });
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
