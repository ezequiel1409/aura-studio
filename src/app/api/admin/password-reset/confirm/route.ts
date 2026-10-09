import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { resetPassword } from "../../../../../services/password-reset.service";

export async function POST(req: NextRequest) {
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

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    console.error("Error en POST /api/admin/password-reset/confirm:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor al actualizar la contraseña." },
      { status: 500 }
    );
  }
}

