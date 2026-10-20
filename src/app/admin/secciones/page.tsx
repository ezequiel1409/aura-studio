import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isServerAdminAuthenticated } from "../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { NavigationService } from "../../../services/navigation.service";
import { SettingsService } from "../../../services/settings.service";
import { NavigationSectionsManagerClient } from "../../../components/admin/NavigationSectionsManagerClient";

export default async function AdminNavigationSectionsPage() {
  await connection();

  const isAuth = await isServerAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const deps = getProductServiceDeps();
  const navService = new NavigationService({
    navigationRepo: deps.navigationRepo,
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
  });
  const settingsService = new SettingsService(deps.settingsRepo);

  const [sections, attributes, categories, settings] = await Promise.all([
    navService.listAdminSectionsWithCounts(),
    navService.listAttributeDefinitions(),
    deps.categoryRepo.listAll(),
    settingsService.getSettings(),
  ]);

  return (
    <NavigationSectionsManagerClient
      initialSections={sections}
      initialAttributes={attributes}
      categories={categories}
      initialCatalogConfig={settings.catalogConfig!}
    />
  );
}

