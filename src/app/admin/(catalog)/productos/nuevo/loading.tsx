import { AdminRouteSkeleton } from "../../../../../components/admin/ui/AdminRouteSkeleton";

export default function AdminNuevoProductoLoading() {
  return (
    <AdminRouteSkeleton
      contentOnly
      variant="form"
      label="Cargando formulario de producto..."
    />
  );
}
