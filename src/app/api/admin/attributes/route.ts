import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import {
  deleteAttributeDefinition,
  listAttributeDefinitions,
  upsertAttributeDefinition,
} from "../../../../services/navigation.service";

/**
 * Endpoint dedicado para la gestión de Atributos de Rubro (SOLID - Single Responsibility Principle).
 * Administra las características del catálogo (ej: "Para", "Material", "Temporada", "Marca").
 */
export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const deps = getProductServiceDeps();
    const attributes = await listAttributeDefinitions(deps);
    return NextResponse.json({ ok: true, attributes });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener atributos";
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

    const name = (body.name || body.label || "").trim();
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "El nombre o etiqueta del atributo es obligatorio." },
        { status: 400 }
      );
    }

    let options: string[] = [];
    if (Array.isArray(body.options)) {
      options = body.options.map((o: unknown) => String(o).trim()).filter(Boolean);
    } else if (typeof body.options === "string") {
      options = body.options
        .split(",")
        .map((o: string) => o.trim())
        .filter(Boolean);
    }

    const attribute = await upsertAttributeDefinition(
      {
        id: body.id ? Number(body.id) : undefined,
        name,
        label: name,
        slug: (body.slug || body.key || name).trim(),
        key: (body.key || body.slug || name).trim(),
        options,
        isFilterable:
          body.isFilterable !== undefined ? Boolean(body.isFilterable) : true,
        position: body.position !== undefined ? Number(body.position) : undefined,
      },
      deps
    );

    return NextResponse.json({ ok: true, attribute });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al guardar el atributo";
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
    const idParam = searchParams.get("id");
    const id = idParam ? Number(idParam) : null;

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { ok: false, error: "ID de atributo inválido o no provisto." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    await deleteAttributeDefinition(id, deps);

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar el atributo";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

