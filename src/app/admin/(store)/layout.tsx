import { AdminSectionShell } from "../../../components/admin/navigation/AdminSectionShell";

export default function AdminStoreSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminSectionShell groupId="store">{children}</AdminSectionShell>;
}
