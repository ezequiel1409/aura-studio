import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdminSession } from "../../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../../infra/db/connection";
import { EditProductClient } from "../../../../../../components/admin/EditProductClient";
import { parseProductCode } from "../../../../../../domain/product/rules";

interface EditProductPageProps {
  params: Promise<{ code: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await connection();
  await requireAdminSession();

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

  const [categories, attributeDefinitions] = await Promise.all([
    deps.categoryRepo.listAll(),
    deps.navigationRepo.listAttributeDefinitions(),
  ]);

  return (
    <EditProductClient
      product={product}
      categories={categories}
      attributeDefinitions={attributeDefinitions}
    />
  );
}
