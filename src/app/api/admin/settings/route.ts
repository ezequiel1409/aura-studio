import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import {
  getShowroomSettings,
  updateShowroomSettings,
} from "../../../../services/settings.service";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const deps = getProductServiceDeps();
    const settings = await getShowroomSettings(deps);
    return NextResponse.json({ ok: true, settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener configuración";
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
    const deps = getProductServiceDeps();

    const settings = await updateShowroomSettings(
      {
        whatsappNumber: body.whatsappNumber,
        showroomName: body.showroomName,
        logoUrl: body.logoUrl,
        instagramHandle: body.instagramHandle,
        tiktokHandle: body.tiktokHandle,
        address: body.address,
        dataFiscalUrl: body.dataFiscalUrl,
        reservationHours: body.reservationHours !== undefined ? Number(body.reservationHours) : undefined,
        heroMode: body.heroMode,
        heroTitle: body.heroTitle,
        heroSubtitle: body.heroSubtitle,
        heroBannerUrl: body.heroBannerUrl,
        themePalette: body.themePalette,
        themePrimaryColor: body.themePrimaryColor,
      },
      deps
    );

    return NextResponse.json({ ok: true, settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al guardar configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
