import { connection } from "next/server";
import { requireAdminSession } from "../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { NavigationService } from "../../../../../services/navigation.service";
import { SettingsService } from "../../../../../services/settings.service";
import { CatalogAttributesManagerClient } from "../../../../../components/admin/catalog/CatalogAttributesManagerClient";

export default async function AdminCatalogAttributesPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const navService = new NavigationService({
    navigationRepo: deps.navigationRepo,
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
  });
  const settingsService = new SettingsService(deps.settingsRepo);

  const [attributes, settings] = await Promise.all([
    navService.listAttributeDefinitions(),
    settingsService.getSettings(),
  ]);

  return (
    <CatalogAttributesManagerClient
      initialAttributes={attributes}
      initialCatalogConfig={settings.catalogConfig!}
    />
  );
}
