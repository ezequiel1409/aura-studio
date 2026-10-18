import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { listCoupons, createCoupon } from "../../../../services/coupon.service";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const deps = getProductServiceDeps();
    const coupons = await listCoupons(deps);
    return NextResponse.json({ ok: true, coupons });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener cupones.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      code,
      description,
      type,
      value,
      minOrderCents,
      maxDiscountCents,
      usageLimit,
      maxUsesPerEmail,
      startsAt,
      expiresAt,
    } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { ok: false, error: "El código de cupón es obligatorio." },
        { status: 400 }
      );
    }

    if (!type || !["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"].includes(type)) {
      return NextResponse.json(
        { ok: false, error: "El tipo de cupón no es válido." },
        { status: 400 }
      );
    }

    if (typeof value !== "number" || value <= 0) {
      return NextResponse.json(
        { ok: false, error: "El valor del descuento debe ser mayor a 0." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const coupon = await createCoupon(
      {
        code,
        description: description || null,
        type,
        value,
        minOrderCents: typeof minOrderCents === "number" ? minOrderCents : 0,
        maxDiscountCents: typeof maxDiscountCents === "number" ? maxDiscountCents : null,
        usageLimit: typeof usageLimit === "number" ? usageLimit : null,
        maxUsesPerEmail: typeof maxUsesPerEmail === "number" ? maxUsesPerEmail : 1,
        startsAt: typeof startsAt === "number" ? startsAt : null,
        expiresAt: typeof expiresAt === "number" ? expiresAt : null,
      },
      deps
    );

    return NextResponse.json({ ok: true, coupon }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear cupón.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
