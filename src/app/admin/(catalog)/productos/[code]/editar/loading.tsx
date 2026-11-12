import { AdminRouteSkeleton } from "../../../../../../components/admin/ui/AdminRouteSkeleton";

export default function AdminEditarProductoLoading() {
  return (
    <AdminRouteSkeleton
      contentOnly
      variant="form"
      label="Cargando editor de producto..."
    />
  );
}
