import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProductNotFoundError } from "../../../../../../domain/errors";
import { isAuthenticatedAdmin } from "../../../../../../infra/auth/guard";
import { revalidateProducts } from "../../../../../../infra/cache/revalidation";
import { getProductServiceDeps } from "../../../../../../infra/db/connection";
import { updateProductVariantStocks } from "../../../../../../services/product.service";

const stockUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        colorName: z.string().trim().min(1, "El color es obligatorio."),
        size: z.string().trim().min(1, "El talle es obligatorio."),
        stock: z.number().finite().int().min(0).max(99999),
      })
    )
    .min(1, "Debe incluir al menos una variante."),
});

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
    return NextResponse.json({ ok: false, error: "ID de producto inválido." }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = stockUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Datos de stock inválidos.";
      return NextResponse.json({ ok: false, error: firstIssue }, { status: 400 });
    }

    const deps = getProductServiceDeps();
    const product = await updateProductVariantStocks(id, parsed.data.updates, deps);
    revalidateProducts(product.code);

    return NextResponse.json({ ok: true, product });
  } catch (error: unknown) {
    if (error instanceof ProductNotFoundError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Error al actualizar stock";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
