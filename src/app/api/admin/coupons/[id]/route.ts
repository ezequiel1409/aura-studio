import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { updateCoupon, deleteCoupon, toggleCouponStatus } from "../../../../../services/coupon.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "ID inválido." }, { status: 400 });
    }

    const body = await req.json();
    const deps = getProductServiceDeps();

    if (body.action === "toggle_status") {
      const updated = await toggleCouponStatus(id, deps);
      return NextResponse.json({ ok: true, coupon: updated });
    }

    const updated = await updateCoupon(id, body, deps);
    return NextResponse.json({ ok: true, coupon: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar cupón.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "ID inválido." }, { status: 400 });
    }

    const deps = getProductServiceDeps();
    await deleteCoupon(id, deps);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar cupón.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
