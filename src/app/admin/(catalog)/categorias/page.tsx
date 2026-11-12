import { connection } from "next/server";
import { requireAdminSession } from "../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getCategoryTree } from "../../../../services/category.service";
import { CategoryManagerClient } from "../../../../components/admin/CategoryManagerClient";

export default async function AdminCategoriesPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const tree = await getCategoryTree(deps);

  return <CategoryManagerClient initialTree={tree} />;
}
