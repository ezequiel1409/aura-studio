import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { toggleProductFeatured } from "../../../../../services/product.service";

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const productId = Number(body?.productId);
    if (!productId || Number.isNaN(productId)) {
      return NextResponse.json(
        { ok: false, error: "ID de producto inválido." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const product = await toggleProductFeatured(productId, deps);
    return NextResponse.json({ ok: true, product });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar estado destacado";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

