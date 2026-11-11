import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_UNCATEGORIZED_SLUG } from "../../../../domain/category/types";
import { ListProductsFilter, ProductStatus } from "../../../../domain/product/types";
import { isAuthenticatedAdmin } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { listProducts } from "../../../../services/product.service";

const VALID_STATUSES: ProductStatus[] = ["AVAILABLE", "RESERVED", "SOLD_OUT"];

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const pageRaw = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSizeRaw = Number.parseInt(searchParams.get("pageSize") || "20", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.max(1, Math.min(100, pageSizeRaw))
      : 20;

    const search = (searchParams.get("search") || searchParams.get("q") || "").trim();
    const tab = (searchParams.get("tab") || "todas").trim().toLowerCase();
    const statusParam = searchParams.get("status")?.trim().toUpperCase() as
      | ProductStatus
      | undefined;
    const categoryIdParam = Number.parseInt(searchParams.get("categoryId") || "", 10);

    const deps = getProductServiceDeps();
    const filter: ListProductsFilter = {
      page,
      pageSize,
      sortBy: "newest",
    };

    if (search) {
      filter.search = search;
    }

    if (Number.isFinite(categoryIdParam) && categoryIdParam > 0) {
      filter.categoryId = categoryIdParam;
    }

    if (tab === "destacadas") {
      filter.isFeatured = true;
    } else if (tab === "disponibles") {
      filter.status = "AVAILABLE";
    } else if (tab === "reservadas") {
      filter.status = "RESERVED";
    } else if (tab === "agotadas") {
      filter.status = "SOLD_OUT";
    } else if (tab === "stock_bajo") {
      filter.lowStockMaxUnits = 3;
    } else if (tab === "por_vencer") {
      filter.status = "SOLD_OUT";
      filter.expiringBefore = Date.now() - 23 * 24 * 60 * 60 * 1000;
    } else if (tab === "sin_precio") {
      filter.withoutPrice = true;
    } else if (tab === "sin_clasificar") {
      const uncategorized = await deps.categoryRepo.findBySlug(SYSTEM_UNCATEGORIZED_SLUG);
      filter.categoryId = uncategorized ? uncategorized.id : -1;
    } else if (statusParam && VALID_STATUSES.includes(statusParam)) {
      filter.status = statusParam;
    }

    const result = await listProducts(filter, deps);
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al listar productos";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
