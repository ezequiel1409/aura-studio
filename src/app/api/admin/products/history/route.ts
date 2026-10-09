import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getProductStatusHistory } from "../../../../../services/backoffice.service";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json(
      { ok: false, error: "No autorizado." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "El parámetro productId es obligatorio." },
      { status: 400 }
    );
  }

  try {
    const deps = getProductServiceDeps();
    const history = await getProductStatusHistory(Number(productId), deps);
    return NextResponse.json({ ok: true, history });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener historial";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
