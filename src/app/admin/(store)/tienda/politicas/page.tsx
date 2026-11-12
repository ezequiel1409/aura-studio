import { connection } from "next/server";
import { requireAdminSession } from "../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../../services/settings.service";
import { PoliciesSettingsClient } from "../../../../../components/admin/settings/PoliciesSettingsClient";

export default async function AdminTiendaPoliticasPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);

  return <PoliciesSettingsClient initialSettings={settings} />;
}
