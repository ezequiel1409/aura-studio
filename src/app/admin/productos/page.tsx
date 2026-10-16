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

  // Obtener categorías y productos en paralelo para minimizar latencia
  const [categories, result] = await Promise.all([
    deps.categoryRepo.listAll(),
    listProducts(
      {
        page: 1,
        pageSize: 100,
        sortBy: "newest",
      },
      deps
    ),
  ]);

  return (
    <ProductListClient
      initialProducts={result.items}
      categories={categories}
      initialFilter={params.filter}
      initialStatus={params.status}
    />
  );
}
