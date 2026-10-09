import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import {
  bulkChangeProductStatus,
  bulkDeleteProducts,
  bulkMoveProductCategory,
  bulkSetProductFeatured,
} from "../../../../../services/product.service";

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.productIds) || body.productIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Debe seleccionar al menos una prenda." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const productIds: number[] = body.productIds.map(Number);

    switch (body.action) {
      case "status": {
        if (!body.newStatus || !["AVAILABLE", "RESERVED", "SOLD_OUT"].includes(body.newStatus)) {
          return NextResponse.json(
            { ok: false, error: "Estado no válido para la acción en lote." },
            { status: 400 }
          );
        }
        const statusResult = await bulkChangeProductStatus(
          { productIds, newStatus: body.newStatus, source: "web" },
          deps
        );
        return NextResponse.json({ ok: true, ...statusResult });
      }

      case "category": {
        const targetCategoryId = Number(body.targetCategoryId);
        if (!targetCategoryId || Number.isNaN(targetCategoryId)) {
          return NextResponse.json(
            { ok: false, error: "Debe seleccionar una categoría de destino válida." },
            { status: 400 }
          );
        }
        const categoryResult = await bulkMoveProductCategory(
          { productIds, targetCategoryId },
          deps
        );
        return NextResponse.json({ ok: true, ...categoryResult });
      }

      case "delete": {
        const deleteResult = await bulkDeleteProducts({ productIds }, deps);
        return NextResponse.json({ ok: true, ...deleteResult });
      }

      case "featured": {
        const isFeatured = Boolean(body.isFeatured);
        const featuredResult = await bulkSetProductFeatured(
          { productIds, isFeatured },
          deps
        );
        return NextResponse.json({ ok: true, ...featuredResult });
      }

      default:
        return NextResponse.json(
          { ok: false, error: "Acción en lote no reconocida." },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar la acción en lote";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
