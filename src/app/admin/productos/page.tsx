import { connection } from "next/server";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { ProductListClient } from "../../../components/admin/ProductListClient";
import { listProducts } from "../../../services/product.service";

interface AdminProductsPageProps {
  searchParams: Promise<{
    status?: string;
    filter?: string;
  }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  await connection();
  const params = await searchParams;
  const deps = getProductServiceDeps();

  // Obtener categorías para nombres y filtros
  const categories = await deps.categoryRepo.listAll();

  // Obtener productos de la tienda (hasta 100 por página)
  const result = await listProducts(
    {
      page: 1,
      pageSize: 100,
      sortBy: "newest",
    },
    deps
  );

  return (
    <ProductListClient
      initialProducts={result.items}
      categories={categories}
      initialFilter={params.filter}
      initialStatus={params.status}
    />
  );
}
