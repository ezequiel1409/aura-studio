import { connection } from "next/server";
import { AdminUsersClient } from "../../../components/admin/AdminUsersClient";

export const metadata = {
  title: "Equipo y Administradores · Aura Studio",
  description: "Gestión de roles y suspensiones de administradores",
};

export default async function AdminUsersPage() {
  await connection();
  return <AdminUsersClient />;
}

