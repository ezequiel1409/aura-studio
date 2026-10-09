import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromToken } from "../../../../infra/auth/session";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { createChildAdmin, listAdminUsers } from "../../../../services/admin-users.service";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("aura_admin_token")?.value;
    const session = await getAdminSessionFromToken(token);

    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Acceso denegado: Se requiere rol SUPER_ADMIN." },
        { status: 403 }
      );
    }

    const deps = getProductServiceDeps();
    const result = await listAdminUsers(session.role, deps);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, users: result.data });
  } catch (error) {
    console.error("Error en GET /api/admin/users:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("aura_admin_token")?.value;
    const session = await getAdminSessionFromToken(token);

    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Acceso denegado: Solo la administradora principal puede crear usuarios." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { ok: false, error: "Todos los campos (email, nombre, contraseña) son obligatorios." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const result = await createChildAdmin(
      {
        email,
        name,
        password,
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

    return NextResponse.json({ ok: true, user: result.data }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/admin/users:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

