import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isServerAdminAuthenticated } from "../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../services/settings.service";
import { PromotionService } from "../../../../services/promotion.service";
import { AppearanceSettingsClient } from "../../../../components/admin/settings/AppearanceSettingsClient";

export default async function AdminTiendaPortadaPage() {
  await connection();

  const isAuth = await isServerAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const deps = getProductServiceDeps();
  const promotionService = new PromotionService(deps.promotionRepo);

  const [settings, banners, activePromotions] = await Promise.all([
    getShowroomSettings(deps),
    deps.promotionRepo.listHomeBanners(),
    promotionService.listActivePublicPromotions(),
  ]);

  return (
    <AppearanceSettingsClient
      initialSettings={settings}
      initialBanners={banners}
      activePromotions={activePromotions}
    />
  );
}
