import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { createCategory, getCategoryTree } from "../../../../services/category.service";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const deps = getProductServiceDeps();
    const tree = await getCategoryTree(deps);
    return NextResponse.json({ ok: true, categories: tree });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener categorías";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { ok: false, error: "El nombre de la categoría es requerido." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const category = await createCategory(
      {
        name: body.name,
        parentId: body.parentId !== undefined ? (body.parentId === null ? null : Number(body.parentId)) : null,
        isHidden: Boolean(body.isHidden),
      },
      deps
    );

    return NextResponse.json({ ok: true, category });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear la categoría";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
