import { connection } from "next/server";
import { requireAdminSession } from "../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../../services/settings.service";
import { PaymentsSettingsClient } from "../../../../../components/admin/settings/PaymentsSettingsClient";

export default async function AdminTiendaPagosPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);

  return <PaymentsSettingsClient initialSettings={settings} />;
}
