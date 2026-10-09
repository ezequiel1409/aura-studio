import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { deleteCategory, updateCategory } from "../../../../../services/category.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ ok: false, error: "ID de categoría inválido." }, { status: 400 });
  }

  try {
    const body = await req.json();
    const deps = getProductServiceDeps();

    const category = await updateCategory(
      id,
      {
        name: body.name,
        parentId: body.parentId !== undefined ? (body.parentId === null ? null : Number(body.parentId)) : undefined,
        isHidden: body.isHidden !== undefined ? Boolean(body.isHidden) : undefined,
        position: body.position !== undefined ? Number(body.position) : undefined,
      },
      deps
    );

    return NextResponse.json({ ok: true, category });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar la categoría";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ ok: false, error: "ID de categoría inválido." }, { status: 400 });
  }

  try {
    const url = new URL(req.url);
    const reassignToQuery = url.searchParams.get("reassignTo");
    let reassignToCategoryId: number | undefined = undefined;

    if (reassignToQuery) {
      reassignToCategoryId = Number(reassignToQuery);
    } else {
      // También intentar leer desde body si existe
      try {
        const body = await req.json();
        if (body && body.reassignToCategoryId) {
          reassignToCategoryId = Number(body.reassignToCategoryId);
        }
      } catch {
        // Body opcional
      }
    }

    const deps = getProductServiceDeps();
    const result = await deleteCategory(id, reassignToCategoryId, deps);

    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar la categoría";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
