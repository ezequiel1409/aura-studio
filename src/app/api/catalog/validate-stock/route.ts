import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    const deps = getProductServiceDeps();
    const product = await deps.productRepo.findById(productId);
    if (!product) {
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
      return NextResponse.json({
        ok: false,
        available: false,
        reason: "SOLD_OUT",
        message: "Esta pieza acaba de agotarse.",
      });
    }

    if (product.status === "RESERVED") {
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
        return NextResponse.json({
          ok: false,
          available: false,
          reason: "SOLD_OUT",
          message: `El talle ${size} en ${matchedColor?.name || colorName} ya no tiene stock disponible.`,
        });
      }

      if (matchedSize.stock < requestedQuantity) {
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
  } catch {
    return NextResponse.json({
      ok: true,
      available: true,
      remainingStock: 1,
    });
  }
}

