import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { reorderCategories } from "../../../../../services/category.service";

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json(
        { ok: false, error: "Se requiere un array de items con id y posición." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    await reorderCategories(body.items, deps);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al reordenar categorías";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
