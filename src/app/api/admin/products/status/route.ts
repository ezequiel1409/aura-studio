import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { changeProductStatus } from "../../../../../services/product.service";
import { ProductStatus } from "../../../../../domain/product/types";

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
    const { productId, newStatus } = body;

    if (!productId || !newStatus) {
      return NextResponse.json(
        { ok: false, error: "Parámetros inválidos." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const product = await changeProductStatus(
      {
        productId: Number(productId),
        newStatus: newStatus as ProductStatus,
        source: "web",
      },
      deps
    );

    return NextResponse.json({ ok: true, product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar estado";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
