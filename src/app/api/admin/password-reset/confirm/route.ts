import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { resetPassword } from "../../../../../services/password-reset.service";
import { logger } from "../../../../../lib/logger";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { ok: false, error: "El token de restablecimiento es obligatorio." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { ok: false, error: "La nueva contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const result = await resetPassword(
      {
        token,
        newPassword,
      },
      {
        adminUserRepo: deps.adminUserRepo,
        passwordResetTokenRepo: deps.passwordResetTokenRepo,
      }
    );

    const durationMs = Math.round(performance.now() - startTime);

    if (!result.success) {
      logger.warn("AUTH:PASSWORD_RESET_CONFIRM_FAILED", "Fallo al confirmar restablecimiento de contraseña", {
        reason: result.error,
        durationMs,
        status: 400,
      });
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    logger.info("AUTH:PASSWORD_RESET_CONFIRM_SUCCESS", "Contraseña restablecida exitosamente", {
      durationMs,
      status: 200,
    });

    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    logger.error("AUTH:PASSWORD_RESET_CONFIRM_EXCEPTION", "Error interno al confirmar nueva contraseña", error, {
      durationMs,
      status: 500,
    });
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor al actualizar la contraseña." },
      { status: 500 }
    );
  }
}
