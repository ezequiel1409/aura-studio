import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { isServerAdminAuthenticated } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { EditProductClient } from "../../../../../components/admin/EditProductClient";
import { parseProductCode } from "../../../../../domain/product/rules";

interface EditProductPageProps {
  params: Promise<{ code: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await connection();

  const isAuth = await isServerAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const { code: rawCode } = await params;
  const numericCode = parseProductCode(rawCode);

  if (!numericCode) {
    notFound();
  }

  const deps = getProductServiceDeps();
  const product = await deps.productRepo.findByCode(numericCode);

  if (!product) {
    notFound();
  }

  const categories = await deps.categoryRepo.listAll();

  return <EditProductClient product={product} categories={categories} />;
}
