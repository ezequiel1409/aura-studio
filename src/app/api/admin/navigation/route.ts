import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import {
  deleteAttributeDefinition,
  deleteNavigationSection,
  listAdminNavigationSections,
  listAttributeDefinitions,
  reorderNavigationSections,
  upsertAttributeDefinition,
  upsertNavigationSection,
} from "../../../../services/navigation.service";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const deps = getProductServiceDeps();
    const [sections, attributes] = await Promise.all([
      listAdminNavigationSections(deps),
      listAttributeDefinitions(deps),
    ]);
    return NextResponse.json({ ok: true, sections, attributes });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener secciones de navegación";
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

    if (body.action === "upsert_attribute") {
      const attribute = await upsertAttributeDefinition(
        {
          id: body.id,
          slug: body.slug,
          name: body.name,
          options: body.options || [],
          isFilterable: body.isFilterable,
          position: body.position,
        },
        deps
      );
      return NextResponse.json({ ok: true, attribute });
    }

    if (body.action === "reorder_sections" && Array.isArray(body.orderedIds)) {
      await reorderNavigationSections(
        body.orderedIds.map((id: unknown) => Number(id)),
        deps
      );
      const sections = await listAdminNavigationSections(deps);
      return NextResponse.json({ ok: true, sections });
    }

    const section = await upsertNavigationSection(
      {
        id: body.id,
        name: body.name,
        slug: body.slug,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        ruleType: body.ruleType,
        ruleConfig: body.ruleConfig || {},
        accentColor: body.accentColor,
        badgeText: body.badgeText,
        coverImageUrl: body.coverImageUrl,
        subcategoryIds: body.subcategoryIds || [],
        position: body.position,
        isVisible: body.isVisible,
      },
      deps
    );

    const sections = await listAdminNavigationSections(deps);
    return NextResponse.json({ ok: true, section, sections });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al guardar sección o atributo";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const target = searchParams.get("target") || "section";
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: "ID inválido." }, { status: 400 });
    }

    const deps = getProductServiceDeps();
    if (target === "attribute") {
      await deleteAttributeDefinition(id, deps);
    } else {
      await deleteNavigationSection(id, deps);
    }

    const [sections, attributes] = await Promise.all([
      listAdminNavigationSections(deps),
      listAttributeDefinitions(deps),
    ]);
    return NextResponse.json({ ok: true, sections, attributes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

