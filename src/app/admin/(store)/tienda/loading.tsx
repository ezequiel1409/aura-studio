import { AdminRouteSkeleton } from "../../../../components/admin/ui/AdminRouteSkeleton";

export default function AdminTiendaSettingsLoading() {
  return (
    <AdminRouteSkeleton
      contentOnly
      variant="form"
      label="Cargando configuración de la tienda..."
    />
  );
}
