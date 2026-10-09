import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { loginAdmin } from "../../../../services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

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
      { password, clientKey: clientIp },
      { loginAttemptRepo: deps.loginAttemptRepo }
    );

    if (!result.success) {
      const status = result.remainingLockSeconds ? 429 : 401;
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          remainingLockSeconds: result.remainingLockSeconds,
        },
        { status }
      );
    }

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
    console.error("Error en POST /api/admin/login:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
