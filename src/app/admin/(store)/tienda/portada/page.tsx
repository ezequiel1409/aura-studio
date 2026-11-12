import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdminSession } from "../../../../../infra/auth/dal";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../../services/settings.service";
import { PromotionService } from "../../../../../services/promotion.service";
import { AppearanceSettingsClient } from "../../../../../components/admin/settings/AppearanceSettingsClient";

export default async function AdminTiendaPortadaPage() {
  await connection();
  await requireAdminSession();

  const deps = getProductServiceDeps();
  const promotionService = new PromotionService(deps.promotionRepo);

  const [settings, banners, activePromotions, sections, categories, attributes] =
    await Promise.all([
      getShowroomSettings(deps),
      deps.promotionRepo.listHomeBanners(),
      promotionService.listActivePublicPromotions(),
      deps.navigationRepo.listSections(),
      deps.categoryRepo.listAll(),
      deps.navigationRepo.listAttributeDefinitions(),
    ]);

  return (
    <Suspense fallback={null}>
      <AppearanceSettingsClient
        initialSettings={settings}
        initialBanners={banners}
        activePromotions={activePromotions}
        initialSections={sections}
        categories={categories}
        attributes={attributes}
      />
    </Suspense>
  );
}
