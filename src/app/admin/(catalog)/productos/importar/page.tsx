import { connection } from "next/server";
import { requireAdminSession } from "../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { ProductImportClient } from "../../../../../components/admin/products/ProductImportClient";

export default async function AdminProductsImportPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const categories = await deps.categoryRepo.listAll();

  return <ProductImportClient categories={categories} />;
}
