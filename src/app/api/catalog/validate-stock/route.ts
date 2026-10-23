import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { logger } from "../../../../lib/logger";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const deps = getProductServiceDeps();

    // Soporte para validación masiva (ej: verificación de bolsa / carrito)
    if (Array.isArray(body.items)) {
      const productCache = new Map<number, unknown>();

      const results = await Promise.all(
        body.items.map(async (item: Record<string, unknown>) => {
          const key = String(item.key || "");
          const productId = Number(item.productId);
          const colorName = String(item.colorName || "Único").trim();
          const size = String(item.size || "ÚNICO").trim();
          const requestedQuantity = Math.max(1, Number(item.quantity || item.requestedQuantity || 1));

          if (!productId || Number.isNaN(productId)) {
            return { key, productId, available: false, remainingStock: 0, reason: "INVALID" };
          }

          let product: any = productCache.get(productId);
          if (product === undefined) {
            product = await deps.productRepo.findById(productId);
            productCache.set(productId, product);
          }

          if (!product || product.status === "SOLD_OUT") {
            return { key, productId, available: false, remainingStock: 0, reason: "SOLD_OUT" };
          }

          if (product.status === "RESERVED") {
            return { key, productId, available: false, remainingStock: 0, reason: "RESERVED" };
          }

          if (product.colors && product.colors.length > 0) {
            const matchedColor =
              product.colors.find(
                (c: any) => c.name.trim().toLowerCase() === colorName.toLowerCase()
              ) || product.colors[0];

            const matchedSize = matchedColor?.sizes.find(
              (s: any) => s.size.trim().toUpperCase() === size.toUpperCase()
            );

            if (!matchedSize || matchedSize.stock <= 0) {
              return { key, productId, available: false, remainingStock: 0, reason: "SOLD_OUT" };
            }

            return {
              key,
              productId,
              available: matchedSize.stock >= requestedQuantity,
              remainingStock: matchedSize.stock,
              reason: matchedSize.stock < requestedQuantity ? "INSUFFICIENT_STOCK" : null,
            };
          }

          return { key, productId, available: true, remainingStock: 1, reason: null };
        })
      );

      const anyUnavailable = results.some((r) => !r.available);
      const durationMs = Math.round(performance.now() - startTime);

      if (anyUnavailable) {
        logger.warn("STOCK:BATCH_UNAVAILABLE", "Ítems con stock insuficiente en validación masiva", {
          itemsCount: results.length,
          durationMs,
        });
      }

      return NextResponse.json({ ok: true, items: results });
    }

    const productId = Number(body.productId);
    const colorName = String(body.colorName || "Único").trim();
    const size = String(body.size || "ÚNICO").trim();
    const requestedQuantity = Math.max(1, Number(body.requestedQuantity || 1));

    if (!productId || Number.isNaN(productId)) {
      return NextResponse.json(
        { ok: false, available: false, message: "Producto inválido." },
        { status: 400 }
      );
    }

    const product = await deps.productRepo.findById(productId);
    const durationMs = Math.round(performance.now() - startTime);

    if (!product) {
      logger.warn("STOCK:PRODUCT_NOT_FOUND", "Consulta de stock de producto inexistente", {
        productId,
        durationMs,
        status: 404,
      });
      return NextResponse.json(
        {
          ok: false,
          available: false,
          reason: "NOT_FOUND",
          message: "Esta pieza ya no se encuentra disponible en el catálogo.",
        },
        { status: 404 }
      );
    }

    if (product.status === "SOLD_OUT") {
      logger.warn("STOCK:PRODUCT_SOLD_OUT", "Pieza completamente agotada", {
        productId,
        productCode: product.code,
        durationMs,
      });
      return NextResponse.json({
        ok: false,
        available: false,
        reason: "SOLD_OUT",
        message: "Esta pieza acaba de agotarse.",
      });
    }

    if (product.status === "RESERVED") {
      logger.warn("STOCK:PRODUCT_RESERVED", "Pieza reservada temporalmente", {
        productId,
        productCode: product.code,
        durationMs,
      });
      return NextResponse.json({
        ok: false,
        available: false,
        reason: "RESERVED",
        message: "Esta pieza quedó reservada recientemente por otra clienta.",
      });
    }

    if (product.colors && product.colors.length > 0) {
      const matchedColor =
        product.colors.find(
          (c) => c.name.trim().toLowerCase() === colorName.toLowerCase()
        ) || product.colors[0];

      const matchedSize = matchedColor?.sizes.find(
        (s) => s.size.trim().toUpperCase() === size.toUpperCase()
      );

      if (!matchedSize || matchedSize.stock <= 0) {
        logger.warn("STOCK:VARIANT_SOLD_OUT", "Variante de color/talle agotada", {
          productId,
          productCode: product.code,
          durationMs,
        });
        return NextResponse.json({
          ok: false,
          available: false,
          reason: "SOLD_OUT",
          message: `El talle ${size} en ${matchedColor?.name || colorName} ya no tiene stock disponible.`,
        });
      }

      if (matchedSize.stock < requestedQuantity) {
        logger.warn("STOCK:INSUFFICIENT", "Stock insuficiente para la cantidad solicitada", {
          productId,
          productCode: product.code,
          durationMs,
        });
        return NextResponse.json({
          ok: false,
          available: false,
          reason: "INSUFFICIENT_STOCK",
          remainingStock: matchedSize.stock,
          message:
            matchedSize.stock === 1
              ? `Solo queda 1 unidad disponible en talle ${size}.`
              : `Solo quedan ${matchedSize.stock} unidades disponibles en talle ${size}.`,
        });
      }

      return NextResponse.json({
        ok: true,
        available: true,
        remainingStock: matchedSize.stock,
      });
    }

    return NextResponse.json({
      ok: true,
      available: true,
      remainingStock: 1,
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    logger.error("STOCK:EXCEPTION", "Error interno en validación de stock", error, { durationMs });
    return NextResponse.json({
      ok: true,
      available: true,
      remainingStock: 1,
    });
  }
}
