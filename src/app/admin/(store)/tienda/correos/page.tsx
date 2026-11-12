import { connection } from "next/server";
import { requireAdminSession } from "../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../../services/settings.service";
import { EmailSettingsClient } from "../../../../../components/admin/settings/EmailSettingsClient";

export default async function AdminTiendaCorreosPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);

  return <EmailSettingsClient initialSettings={settings} />;
}
