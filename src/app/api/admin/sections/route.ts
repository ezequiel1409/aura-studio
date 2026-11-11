import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import {
  deleteNavigationSection,
  listAdminNavigationSections,
  reorderNavigationSections,
  upsertNavigationSection,
} from "../../../../services/navigation.service";
import { revalidateNavigation } from "../../../../infra/cache/revalidation";

/**
 * Endpoint dedicado exclusivamente a la gestión de Secciones de la Tienda (Single Responsibility).
 * Ruta: /api/admin/sections
 */

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const deps = getProductServiceDeps();
    const sections = await listAdminNavigationSections(deps);
    return NextResponse.json({ ok: true, sections });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener secciones de la tienda";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("id");
    const body = await req.json();
    const deps = getProductServiceDeps();

    // Reordenamiento masivo de secciones
    if (
      body.action === "reorder" ||
      body.action === "reorder_sections" ||
      (Array.isArray(body.orderedIds) && body.orderedIds.length > 0)
    ) {
      const ids: number[] = (body.orderedIds || body.sections || []).map((id: unknown) =>
        Number(id)
      );
      await reorderNavigationSections(ids, deps);
      const sections = await listAdminNavigationSections(deps);
      revalidateNavigation();
      return NextResponse.json({ ok: true, sections });
    }

    const resolvedId = queryId ? Number(queryId) : body.id ? Number(body.id) : undefined;

    const section = await upsertNavigationSection(
      {
        id: resolvedId,
        name: body.name,
        slug: body.slug,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        ruleType: body.ruleType || "FEATURED",
        ruleConfig: body.ruleConfig || {},
        accentColor: body.accentColor,
        badgeText: body.badgeText,
        coverImageUrl: body.coverImageUrl,
        bannerImageUrl: body.bannerImageUrl,
        showInHomeMosaic: body.showInHomeMosaic,
        layout: body.layout,
        targetUrl: body.targetUrl,
        subtitle: body.subtitle,
        showProductCount: body.showProductCount,
        subcategories: body.subcategories,
        subcategoryIds: body.subcategoryIds || [],
        position: body.position,
        isVisible: body.isVisible,
      },
      deps
    );

    const sections = await listAdminNavigationSections(deps);
    revalidateNavigation(section?.slug);
    return NextResponse.json({ ok: true, section, sections });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al guardar sección";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export const PUT = POST;

export async function DELETE(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID de sección inválido." }, { status: 400 });
    }

    const deps = getProductServiceDeps();
    await deleteNavigationSection(id, deps);
    const sections = await listAdminNavigationSections(deps);
    revalidateNavigation();
    return NextResponse.json({ ok: true, sections });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar sección";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
