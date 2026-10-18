import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { validateCoupon } from "../../../../services/coupon.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, email, phone, dni, subtotalCents, shippingCents } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { ok: false, error: "El código de cupón es obligatorio." },
        { status: 400 }
      );
    }

    if (typeof subtotalCents !== "number" || subtotalCents < 0) {
      return NextResponse.json(
        { ok: false, error: "El subtotal es inválido." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const result = await validateCoupon(
      {
        code,
        email: typeof email === "string" ? email : undefined,
        phone: typeof phone === "string" ? phone : undefined,
        dni: typeof dni === "string" ? dni : undefined,
        subtotalCents,
        shippingCents: typeof shippingCents === "number" ? shippingCents : 0,
      },
      deps
    );

    if (!result.valid) {
      return NextResponse.json(
        { ok: false, error: result.message, result },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al validar el cupón.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
