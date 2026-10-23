import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getEmailService } from "../../../../../infra/email/resend.adapter";
import { requestPasswordReset } from "../../../../../services/password-reset.service";
import { logger } from "../../../../../lib/logger";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "El correo electrónico es requerido." },
        { status: 400 }
      );
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const baseUrl = `${protocol}://${host}`;

    const deps = getProductServiceDeps();
    const emailService = getEmailService();

    const result = await requestPasswordReset(
      {
        email,
        baseUrl,
      },
      {
        adminUserRepo: deps.adminUserRepo,
        passwordResetTokenRepo: deps.passwordResetTokenRepo,
        emailService,
        settingsRepo: deps.settingsRepo,
      }
    );

    const durationMs = Math.round(performance.now() - startTime);

    logger.info("AUTH:PASSWORD_RESET_REQUESTED", "Solicitud de restablecimiento de contraseña procesada", {
      email,
      durationMs,
      status: 200,
    });

    return NextResponse.json({
      ok: true,
      message: result.message,
      devResetLink: result.devResetLink,
      emailError: result.error,
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    logger.error("AUTH:PASSWORD_RESET_EXCEPTION", "Error interno en solicitud de restablecimiento", error, {
      durationMs,
      status: 500,
    });
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor al procesar la solicitud." },
      { status: 500 }
    );
  }
}
