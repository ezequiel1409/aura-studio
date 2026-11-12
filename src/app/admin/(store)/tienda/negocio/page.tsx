import { connection } from "next/server";
import { requireAdminSession } from "../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../../services/settings.service";
import { BusinessSettingsClient } from "../../../../../components/admin/settings/BusinessSettingsClient";

export default async function AdminTiendaNegocioPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);

  return <BusinessSettingsClient initialSettings={settings} />;
}
