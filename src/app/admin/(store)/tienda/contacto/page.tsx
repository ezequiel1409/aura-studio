import { connection } from "next/server";
import { requireAdminSession } from "../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../../services/settings.service";
import { ContactSettingsClient } from "../../../../../components/admin/settings/ContactSettingsClient";

export default async function AdminTiendaContactoPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);

  return <ContactSettingsClient initialSettings={settings} />;
}
