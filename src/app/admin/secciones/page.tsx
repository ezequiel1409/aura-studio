import { redirect } from "next/navigation";

export default function AdminSeccionesRedirectPage() {
  redirect("/admin/tienda/portada?tab=sections");
}
