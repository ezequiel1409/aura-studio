import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "../../../../lib/env";
import { verifySessionToken } from "../../../../infra/auth/session";
import { SESSION_INACTIVITY_MS } from "../../../../domain/auth/rules";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/session (BR-10, BR-37)
 * Consulta el estado actual de la sesión administrativa, tiempo restante en segundos
 * y registra en logs cualquier intento desautenticado o expirado.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("aura_admin_token")?.value;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (!token) {
      console.warn(`[AUTH] Verificación de sesión: cliente desautenticado (sin cookie) ip=${ip}`);
      return NextResponse.json({
        authenticated: false,
        expiresInSeconds: 0,
        exp: null,
        sessionDurationHours: 2,
        reason: "missing_token",
      });
    }

    const env = getEnv();
    const result = await verifySessionToken(token, env.SESSION_SECRET);

    if (!result.valid || !result.payload) {
      console.warn(
        `[AUTH] Verificación de sesión: sesión inválida o expirada (${result.reason || "desconocido"}) ip=${ip} user=${result.payload?.email || "anon"}`
      );
      return NextResponse.json({
        authenticated: false,
        expiresInSeconds: 0,
        exp: result.payload?.exp || null,
        sessionDurationHours: 2,
        reason: result.reason || "invalid_session",
      });
    }

    const now = Date.now();
    const expiresInSeconds = Math.max(0, Math.floor((result.payload.exp - now) / 1000));

    return NextResponse.json({
      authenticated: true,
      expiresInSeconds,
      exp: result.payload.exp,
      sessionDurationHours: 2,
      user: {
        userId: result.payload.userId,
        email: result.payload.email,
        role: result.payload.role,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/admin/session:", error);
    return NextResponse.json(
      { authenticated: false, error: "Error al verificar sesión." },
      { status: 500 }
    );
  }
}

