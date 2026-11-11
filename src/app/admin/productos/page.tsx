import { connection } from "next/server";
import { SYSTEM_UNCATEGORIZED_SLUG } from "../../../domain/category/types";
import { ListProductsFilter, ProductStatus } from "../../../domain/product/types";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { ProductListClient } from "../../../components/admin/ProductListClient";
import { listProducts } from "../../../services/product.service";

interface AdminProductsPageProps {
  searchParams: Promise<{
    status?: string;
    filter?: string;
    q?: string;
    page?: string;
  }>;
}

const EXPIRING_SOON_WINDOW_MS = 23 * 24 * 60 * 60 * 1000;

function computeExpiringBeforeCutoff(): number {
  return Date.now() - EXPIRING_SOON_WINDOW_MS;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  await connection();
  const params = await searchParams;
  const deps = getProductServiceDeps();

  const categories = await deps.categoryRepo.listAll();
  const uncategorized = categories.find((c) => c.slug === SYSTEM_UNCATEGORIZED_SLUG);

  const pageNum = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const search = (params.q || "").trim();
  const activeFilter: ListProductsFilter = {
    page: pageNum,
    pageSize: 20,
    sortBy: "newest",
  };

  if (search) {
    activeFilter.search = search;
  }

  const normalizedFilter = (params.filter || "").trim().toLowerCase();
  const normalizedStatus = (params.status || "").trim().toUpperCase() as ProductStatus | "";

  if (normalizedStatus === "AVAILABLE" || normalizedFilter === "disponibles") {
    activeFilter.status = "AVAILABLE";
  } else if (normalizedStatus === "RESERVED" || normalizedFilter === "reservadas") {
    activeFilter.status = "RESERVED";
  } else if (normalizedStatus === "SOLD_OUT" || normalizedFilter === "agotadas") {
    activeFilter.status = "SOLD_OUT";
  } else if (normalizedFilter === "destacadas") {
    activeFilter.isFeatured = true;
  } else if (normalizedFilter === "stock_bajo") {
    activeFilter.lowStockMaxUnits = 3;
  } else if (normalizedFilter === "por_vencer") {
    activeFilter.status = "SOLD_OUT";
    activeFilter.expiringBefore = computeExpiringBeforeCutoff();
  } else if (normalizedFilter === "sin_precio") {
    activeFilter.withoutPrice = true;
  } else if (normalizedFilter === "sin_clasificar") {
    activeFilter.categoryId = uncategorized ? uncategorized.id : -1;
  }

  const [result, summaryCounts] = await Promise.all([
    listProducts(activeFilter, deps),
    deps.productRepo.getSummaryCounts(uncategorized ? uncategorized.id : 0),
  ]);

  return (
    <ProductListClient
      initialProducts={result.items}
      categories={categories}
      initialFilter={params.filter}
      initialStatus={params.status}
      initialSearch={search}
      initialTotal={result.total}
      initialPage={result.page}
      initialTotalPages={result.totalPages}
      pageSize={result.pageSize}
      summaryCounts={summaryCounts}
    />
  );
}
