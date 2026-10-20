import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { createProduct } from "../../../../../services/product.service";
import { createCategory } from "../../../../../services/category.service";
import { ValidatedImportItem } from "../../../../../lib/parser/import-template";

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json(
      { ok: false, error: "No autorizado. Sesión expirada." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const items = body?.items as ValidatedImportItem[] | undefined;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No se proporcionaron piezas para importar." },
        { status: 400 }
      );
    }

    if (items.length > 500) {
      return NextResponse.json(
        {
          ok: false,
          error: "El lote supera el límite máximo permitido de 500 productos por tanda.",
        },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const allCategories = await deps.categoryRepo.listAll();
    const categoryMap = new Map<string, number>();

    for (const c of allCategories) {
      categoryMap.set(c.name.toLowerCase(), c.id);
      categoryMap.set(c.slug.toLowerCase(), c.id);
    }

    // Asegurar categoría "Sin clasificar" si se necesita
    let defaultCatId = categoryMap.get("sin clasificar") || categoryMap.get("sin-clasificar");
    if (!defaultCatId) {
      defaultCatId = allCategories[0]?.id || 1;
    }

    let successCount = 0;
    const errors: Array<{ rowNumber: number; title: string; error: string }> = [];

    for (const item of items) {
      if (item.rowStatus === "ERROR") {
        errors.push({
          rowNumber: item.rowNumber,
          title: item.title,
          error: item.errors.map((e) => e.message).join(" | "),
        });
        continue;
      }

      try {
        // Resolver o auto-crear categoría
        let categoryId = item.categoryId;
        const normCatName = (item.categoryName || "").trim().toLowerCase();

        if (!categoryId && normCatName) {
          if (categoryMap.has(normCatName)) {
            categoryId = categoryMap.get(normCatName);
          } else {
            // Auto-crear la categoría nueva
            try {
              const newCat = await createCategory(
                { name: item.categoryName.trim() },
                deps
              );
              categoryId = newCat.id;
              categoryMap.set(normCatName, newCat.id);
              categoryMap.set(newCat.slug.toLowerCase(), newCat.id);
            } catch {
              categoryId = defaultCatId;
            }
          }
        }

        if (!categoryId) {
          categoryId = defaultCatId;
        }

        // Mapear fotos si vinieron URLs
        const photos = item.photoUrls.map((url, idx) => ({
          keyThumb: url,
          keyFull: url,
          position: idx,
        }));

        const formattedAttributes: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(item.attributes || {})) {
          if (v) formattedAttributes[k] = [v];
        }

        await createProduct(
          {
            rawText: item.description || item.title,
            title: item.title,
            priceCents: item.priceCents,
            compareAtPriceCents: item.compareAtPriceCents,
            currency: "ARS",
            categoryId,
            isFeatured: item.isFeatured,
            allowReturn: true,
            attributes: formattedAttributes,
            colors: item.colors.map((c, cIdx) => ({
              name: c.name,
              position: cIdx,
              sizes: c.sizes,
            })),
            photos,
            source: "web",
          },
          deps
        );

        successCount++;
      } catch (err: unknown) {
        errors.push({
          rowNumber: item.rowNumber,
          title: item.title,
          error: err instanceof Error ? err.message : "Error al guardar producto",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      importedCount: successCount,
      failedCount: errors.length,
      errors,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error durante la importación";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
