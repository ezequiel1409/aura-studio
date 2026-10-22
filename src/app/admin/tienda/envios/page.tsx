import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isServerAdminAuthenticated } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../services/settings.service";
import { ShippingSettingsClient } from "../../../../components/admin/settings/ShippingSettingsClient";

export default async function AdminTiendaEnviosPage() {
  await connection();

  const isAuth = await isServerAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);

  return <ShippingSettingsClient initialSettings={settings} />;
}
