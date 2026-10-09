import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { deleteProduct, updateProduct } from "../../../../../services/product.service";

export async function GET(
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
    return NextResponse.json({ ok: false, error: "ID de producto inválido." }, { status: 400 });
  }

  try {
    const deps = getProductServiceDeps();
    const product = await deps.productRepo.findById(id);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Producto no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener producto";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(
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
    return NextResponse.json({ ok: false, error: "ID de producto inválido." }, { status: 400 });
  }

  try {
    const body = await req.json();
    const deps = getProductServiceDeps();

    const product = await updateProduct(
      id,
      {
        rawText: body.rawText,
        title: body.title,
        priceCents: body.priceCents,
        currency: body.currency,
        size: body.size,
        categoryId: body.categoryId !== undefined ? Number(body.categoryId) : undefined,
        status: body.status,
        colors: body.colors,
        photos: body.photos,
        source: "web",
      },
      deps
    );

    return NextResponse.json({ ok: true, product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar producto";
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
    return NextResponse.json({ ok: false, error: "ID de producto inválido." }, { status: 400 });
  }

  try {
    const deps = getProductServiceDeps();
    await deleteProduct(id, deps);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar producto";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
