import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { deleteProduct, updateProduct } from "../../../../../services/product.service";
import { revalidateProducts } from "../../../../../infra/cache/revalidation";

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

    let categoryId: number | undefined = undefined;
    if (body.categoryId !== undefined && body.categoryId !== null && body.categoryId !== "") {
      const num = Number(body.categoryId);
      if (!Number.isNaN(num) && num > 0) {
        categoryId = num;
      }
    }

    let publishedAt: number | null | undefined = undefined;
    if (body.publishedAt !== undefined) {
      if (body.publishedAt === null) {
        publishedAt = null;
      } else if (typeof body.publishedAt === "string") {
        const parsed = Date.parse(body.publishedAt);
        publishedAt = Number.isNaN(parsed) ? null : parsed;
      } else if (typeof body.publishedAt === "number") {
        publishedAt = body.publishedAt;
      }
    }

    let colors = undefined;
    if (Array.isArray(body.colors)) {
      colors = body.colors.map((c: {
        name?: unknown;
        hexCode?: string | null;
        position?: unknown;
        sizes?: Array<{ size?: unknown; stock?: unknown; reservedStock?: unknown }>;
      }, cIdx: number) => ({
        name: String(c.name || "Único").trim() || "Único",
        hexCode: c.hexCode || null,
        position: typeof c.position === "number" ? c.position : cIdx,
        sizes: Array.isArray(c.sizes)
          ? c.sizes.map((s) => ({
              size: String(s.size || "ÚNICO").trim() || "ÚNICO",
              stock: Math.max(0, parseInt(String(s.stock || 0), 10) || 0),
              reservedStock: Math.max(0, parseInt(String(s.reservedStock || 0), 10) || 0),
            }))
          : [{ size: "ÚNICO", stock: 1, reservedStock: 0 }],
      }));
    }

    let attributes: Record<string, string[]> | undefined = undefined;
    if (body.attributes && typeof body.attributes === "object") {
      attributes = {};
      for (const [k, v] of Object.entries(body.attributes)) {
        if (Array.isArray(v)) {
          attributes[k] = v.map((item) => String(item).trim()).filter(Boolean);
        } else if (v !== null && v !== undefined && String(v).trim()) {
          attributes[k] = [String(v).trim()];
        }
      }
    }

    const product = await updateProduct(
      id,
      {
        rawText: body.rawText,
        title: body.title,
        priceCents: body.priceCents,
        compareAtPriceCents: body.compareAtPriceCents,
        currency: body.currency,
        size: body.size,
        categoryId,
        status: body.status,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
        allowReturn: body.allowReturn !== undefined ? Boolean(body.allowReturn) : undefined,
        publishedAt,
        attributes,
        colors,
        photos: body.photos,
        source: "web",
      },
      deps
    );

    revalidateProducts(product.code);
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
    revalidateProducts();
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar producto";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
