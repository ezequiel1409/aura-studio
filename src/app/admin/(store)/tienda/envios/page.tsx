import { connection } from "next/server";
import { requireAdminSession } from "../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../../services/settings.service";
import { ShippingSettingsClient } from "../../../../../components/admin/settings/ShippingSettingsClient";

export default async function AdminTiendaEnviosPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);

  return <ShippingSettingsClient initialSettings={settings} />;
}
