import type { Metadata, Viewport } from "next";
import { AdminShell } from "../../components/admin/AdminShell";
import { getAdminShellData } from "../../infra/auth/dal";

export const metadata: Metadata = {
  title: "Panel de Control",
  description: "Panel privado de administración de la tienda",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf8f5",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shellData = await getAdminShellData();

  return <AdminShell initialData={shellData}>{children}</AdminShell>;
}
