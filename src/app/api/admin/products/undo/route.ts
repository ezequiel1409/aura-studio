import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { undoProductStatusChange } from "../../../../../services/backoffice.service";

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json(
      { ok: false, error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "El ID del producto es obligatorio." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const product = await undoProductStatusChange(Number(productId), "web", deps);

    return NextResponse.json({ ok: true, product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al revertir el estado";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
