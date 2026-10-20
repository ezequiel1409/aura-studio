import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isServerAdminAuthenticated } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { ProductImportClient } from "../../../../components/admin/products/ProductImportClient";

export default async function AdminProductsImportPage() {
  await connection();

  const isAuth = await isServerAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const deps = getProductServiceDeps();
  const categories = await deps.categoryRepo.listAll();

  return <ProductImportClient categories={categories} />;
}
