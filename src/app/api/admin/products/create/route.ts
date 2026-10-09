import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { createProduct } from "../../../../../services/product.service";

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

    if (!body || typeof body.rawText !== "string" || !body.rawText.trim()) {
      return NextResponse.json(
        { ok: false, error: "El texto de la prenda es obligatorio." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const product = await createProduct(
      {
        rawText: body.rawText,
        title: body.title,
        priceCents: body.priceCents,
        currency: body.currency || "ARS",
        size: body.size,
        categoryId: body.categoryId,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : false,
        colors: body.colors,
        photos: body.photos,
        source: "web",
      },
      deps
    );

    return NextResponse.json({ ok: true, product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear la prenda";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
