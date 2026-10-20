import { connection } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { NewProductClient } from "../../../../components/admin/NewProductClient";

export default async function NewProductPage() {
  await connection();
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

