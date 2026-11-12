import { connection } from "next/server";
import { requireAdminSession } from "../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { NewProductClient } from "../../../../../components/admin/NewProductClient";

export default async function NewProductPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const [categories, attributeDefinitions] = await Promise.all([
    deps.categoryRepo.listAll(),
    deps.navigationRepo.listAttributeDefinitions(),
  ]);

  return (
    <NewProductClient
      categories={categories}
      attributeDefinitions={attributeDefinitions}
    />
  );
}
