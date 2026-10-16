import { cookies } from "next/headers";
import { connection } from "next/server";
import { getAdminSessionFromToken } from "../../../infra/auth/session";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { listAdminUsers } from "../../../services/admin-users.service";
import { AdminUsersClient } from "../../../components/admin/AdminUsersClient";

export const metadata = {
  title: "Equipo y Administradores · Aura Studio",
  description: "Gestión de roles y suspensiones de administradores",
};

export default async function AdminUsersPage() {
  await connection();

  const cookieStore = await cookies();
  const token = cookieStore.get("aura_admin_token")?.value;
  const session = await getAdminSessionFromToken(token);

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
