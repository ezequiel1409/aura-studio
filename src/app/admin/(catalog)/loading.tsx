import { AdminRouteSkeleton } from "../../../components/admin/ui/AdminRouteSkeleton";

export default function AdminCatalogSectionLoading() {
  return (
    <AdminRouteSkeleton
      contentOnly
      variant="cards"
      label="Cargando subsección de catálogo..."
    />
  );
}
