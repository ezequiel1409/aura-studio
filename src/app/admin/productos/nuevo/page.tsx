import { connection } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { NewProductClient } from "../../../../components/admin/NewProductClient";

export default async function NewProductPage() {
  await connection();
  const deps = getProductServiceDeps();
  const categories = await deps.categoryRepo.listAll();

  return <NewProductClient categories={categories} />;
}
