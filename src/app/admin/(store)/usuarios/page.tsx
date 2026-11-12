import { connection } from "next/server";
import { getAdminSession } from "../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { listAdminUsers } from "../../../../services/admin-users.service";
import { AdminUsersClient } from "../../../../components/admin/AdminUsersClient";

export const metadata = {
  title: "Equipo y Administradores · Backoffice",
  description: "Gestión de roles y suspensiones de administradores",
};

export default async function AdminUsersPage() {
  await connection();
  const session = await getAdminSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    return <AdminUsersClient initialUsers={[]} initialIsSuperAdmin={false} />;
  }

  const deps = getProductServiceDeps();
  const result = await listAdminUsers(session.role, deps);

  return (
    <AdminUsersClient
      initialUsers={result.success && result.data ? result.data : []}
      initialIsSuperAdmin={true}
    />
  );
}
