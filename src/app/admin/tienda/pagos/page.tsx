import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isServerAdminAuthenticated } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../services/settings.service";
import { PaymentsSettingsClient } from "../../../../components/admin/settings/PaymentsSettingsClient";

export default async function AdminTiendaPagosPage() {
  await connection();

  const isAuth = await isServerAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);

  return <PaymentsSettingsClient initialSettings={settings} />;
}

