import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { changeProductStatus } from "../../../../../services/product.service";
import { ProductStatus } from "../../../../../domain/product/types";
import { logger } from "../../../../../lib/logger";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    logger.warn("ADMIN:PRODUCT_STATUS_UNAUTHORIZED", "Intento no autorizado de cambio de estado de producto", {
      status: 401,
    });
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
    const durationMs = Math.round(performance.now() - startTime);

    logger.info("ADMIN:PRODUCT_STATUS_CHANGED", `Estado de producto #${product.code} cambiado a ${newStatus}`, {
      productId: product.id,
      productCode: product.code,
      status: 200,
      durationMs,
    });

    return NextResponse.json({ ok: true, product });
  } catch (error: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : "Error al actualizar estado";
    logger.error("ADMIN:PRODUCT_STATUS_ERROR", message, error, { durationMs, status: 400 });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
