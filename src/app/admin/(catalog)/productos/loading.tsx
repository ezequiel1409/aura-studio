import { AdminRouteSkeleton } from "../../../../components/admin/ui/AdminRouteSkeleton";

export default function AdminProductosLoading() {
  return (
    <AdminRouteSkeleton
      contentOnly
      variant="list"
      label="Cargando catálogo..."
    />
  );
}
