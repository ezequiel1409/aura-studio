import { AdminSectionShell } from "../../../components/admin/navigation/AdminSectionShell";

export default function AdminCatalogSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminSectionShell groupId="catalog">{children}</AdminSectionShell>;
}
