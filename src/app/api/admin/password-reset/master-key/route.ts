import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getEnvVar } from "../../../../../infra/email/resend.adapter";
import { hashPassword } from "../../../../../lib/crypto/password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const recoveryKey = String(body.recoveryKey || "").trim();
    const newPassword = String(body.newPassword || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Ingresá un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (!recoveryKey) {
      return NextResponse.json(
        { ok: false, error: "La Clave Maestra de Rescate es obligatoria." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { ok: false, error: "La nueva contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    // Obtener la clave maestra de rescate configurada estrictamente en el servidor
    const expectedKey = getEnvVar("ADMIN_RECOVERY_KEY");
    if (!expectedKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "La recuperación por Clave Maestra no está configurada en el servidor. Configurar ADMIN_RECOVERY_KEY.",
        },
        { status: 503 }
      );
    }

    // Comparación en tiempo constante (timingSafeEqual) para prevenir ataques de canal lateral
    const expectedBuf = Buffer.from(expectedKey, "utf-8");
    const givenBuf = Buffer.from(recoveryKey, "utf-8");

    const isMatch =
      expectedBuf.length === givenBuf.length &&
      crypto.timingSafeEqual(expectedBuf, givenBuf);

    if (!isMatch) {
      return NextResponse.json(
        { ok: false, error: "La Clave Maestra de Rescate ingresada es incorrecta." },
        { status: 403 }
      );
    }

    const deps = getProductServiceDeps();
    const user = await deps.adminUserRepo.findByEmail(email);

    if (!user || user.status === "SUSPENDED") {
      return NextResponse.json(
        { ok: false, error: "No se encontró ningún administrador activo asociado a ese correo." },
        { status: 404 }
      );
    }

    // Hashear la nueva contraseña con PBKDF2-HMAC-SHA512 + salt criptográfico aleatorio
    const { hash, salt } = await hashPassword(newPassword);
    const now = Date.now();

    await deps.adminUserRepo.updatePassword(user.id, hash, salt, now);

    return NextResponse.json({
      ok: true,
      message: `¡Contraseña de ${user.name} restablecida con éxito! Ya podés iniciar sesión.`,
    });
  } catch (err) {
    console.error("[MasterKeyReset] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al procesar el restablecimiento con clave maestra." },
      { status: 500 }
    );
  }
}

