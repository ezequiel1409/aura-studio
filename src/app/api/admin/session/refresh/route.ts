import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "../../../../../lib/env";
import { createSessionToken, verifySessionToken } from "../../../../../infra/auth/session";
import { SESSION_INACTIVITY_MS } from "../../../../../domain/auth/rules";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/session/refresh (BR-10, BR-37)
 * Permite a la administradora renovar su sesión en 1 solo clic por 2 horas más (7200s),
 * sin perder trabajo en pantalla y registrando auditoría en logs.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("aura_admin_token")?.value;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (!token) {
      console.warn(`[AUTH] Intento de renovación de sesión sin token desde ip=${ip}`);
      return NextResponse.json(
        { ok: false, error: "No se encontró sesión para renovar. Por favor iniciá sesión." },
        { status: 401 }
      );
    }

    const env = getEnv();
    const result = await verifySessionToken(token, env.SESSION_SECRET);

    if (!result.valid || !result.payload) {
      console.warn(
        `[AUTH] Intento de renovación fallido (${result.reason || "invalida"}) ip=${ip} user=${result.payload?.email || "anon"}`
      );
      return NextResponse.json(
        {
          ok: false,
          error: "Tu sesión ha expirado por inactividad. Por favor volvé a iniciar sesión.",
          reason: result.reason || "expired",
        },
        { status: 401 }
      );
    }

    // Emitir nuevo token extendido por 2 horas (SESSION_INACTIVITY_MS)
    const newToken = await createSessionToken(
      env.SESSION_SECRET,
      {
        userId: result.payload.userId,
        email: result.payload.email,
        role: result.payload.role,
      },
      SESSION_INACTIVITY_MS
    );

    console.info(
      `[AUTH] Sesión renovada en 1 clic con éxito (+2 horas): user=${result.payload.email || "admin"} role=${result.payload.role || "unknown"} ip=${ip}`
    );

    const res = NextResponse.json({
      ok: true,
      message: "Sesión renovada con éxito por 2 horas más.",
      expiresInSeconds: Math.floor(SESSION_INACTIVITY_MS / 1000),
      exp: Date.now() + SESSION_INACTIVITY_MS,
    });

    res.cookies.set("aura_admin_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_INACTIVITY_MS / 1000), // 7200 segundos (2 horas)
    });

    return res;
  } catch (error) {
    console.error("Error en POST /api/admin/session/refresh:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al renovar la sesión." },
      { status: 500 }
    );
  }
}

