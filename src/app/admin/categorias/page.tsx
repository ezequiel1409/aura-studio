import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isServerAdminAuthenticated } from "../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { getCategoryTree } from "../../../services/category.service";
import { CategoryManagerClient } from "../../../components/admin/CategoryManagerClient";

export default async function AdminCategoriesPage() {
  await connection();

  const isAuth = await isServerAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const deps = getProductServiceDeps();
  const tree = await getCategoryTree(deps);

  return <CategoryManagerClient initialTree={tree} />;
}
