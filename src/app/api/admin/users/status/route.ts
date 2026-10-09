import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromToken } from "../../../../../infra/auth/session";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { toggleAdminStatus } from "../../../../../services/admin-users.service";

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("aura_admin_token")?.value;
    const session = await getAdminSessionFromToken(token);

    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Acceso denegado: Solo la administradora principal puede modificar el estado de usuarios." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUserId, newStatus } = body;

    if (!targetUserId || !newStatus || !["ACTIVE", "SUSPENDED"].includes(newStatus)) {
      return NextResponse.json(
        { ok: false, error: "Parámetros inválidos. targetUserId y newStatus ('ACTIVE' | 'SUSPENDED') son requeridos." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const result = await toggleAdminStatus(
      {
        targetUserId: Number(targetUserId),
        newStatus,
        requesterUserId: session.userId || 0,
        requesterRole: session.role,
      },
      deps
    );

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, user: result.data });
  } catch (error) {
    console.error("Error en PATCH /api/admin/users/status:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

