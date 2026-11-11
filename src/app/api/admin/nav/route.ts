import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import {
  DEFAULT_NAVBAR_CONFIG,
  getShowroomSettings,
  NavbarConfig,
  updateShowroomSettings,
} from "../../../../services/settings.service";
import { revalidateNavigation } from "../../../../infra/cache/revalidation";

/**
 * Endpoint dedicado exclusivamente a la configuración de la Barra de Navegación (Single Responsibility).
 * Ruta: /api/admin/nav
 */

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const deps = getProductServiceDeps();
    const settings = await getShowroomSettings(deps);
    return NextResponse.json({
      ok: true,
      navbarConfig: settings.navbarConfig || DEFAULT_NAVBAR_CONFIG,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener configuración de navbar";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const deps = getProductServiceDeps();

    const incomingNavbar: Partial<NavbarConfig> =
      body.navbarConfig && typeof body.navbarConfig === "object"
        ? body.navbarConfig
        : body;

    const currentSettings = await getShowroomSettings(deps);
    const existing = currentSettings.navbarConfig || DEFAULT_NAVBAR_CONFIG;

    const sanitizedNavbarConfig: NavbarConfig = {
      enabled:
        incomingNavbar.enabled !== undefined
          ? Boolean(incomingNavbar.enabled)
          : existing.enabled,
      alignment:
        incomingNavbar.alignment === "left" ||
        incomingNavbar.alignment === "center" ||
        incomingNavbar.alignment === "right" ||
        incomingNavbar.alignment === "second_row"
          ? incomingNavbar.alignment
          : existing.alignment,
      items: Array.isArray(incomingNavbar.items)
        ? incomingNavbar.items
        : existing.items,
      secondRowBgColor:
        incomingNavbar.secondRowBgColor !== undefined
          ? incomingNavbar.secondRowBgColor
          : existing.secondRowBgColor ?? null,
      secondRowTextColor:
        incomingNavbar.secondRowTextColor !== undefined
          ? incomingNavbar.secondRowTextColor
          : existing.secondRowTextColor ?? null,
    };

    const updatedSettings = await updateShowroomSettings(
      { navbarConfig: sanitizedNavbarConfig },
      deps
    );

    revalidateNavigation();
    return NextResponse.json({
      ok: true,
      navbarConfig: updatedSettings.navbarConfig,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al guardar configuración de navbar";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export const POST = PUT;
