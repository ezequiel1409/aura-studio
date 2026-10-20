import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isServerAdminAuthenticated } from "../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { PromotionService } from "../../../services/promotion.service";
import { PromotionsManagerClient } from "../../../components/admin/PromotionsManagerClient";

export default async function AdminPromotionsPage() {
  await connection();

  const isAuth = await isServerAdminAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const deps = getProductServiceDeps();
  const promotionService = new PromotionService(deps.promotionRepo);

  const [promotions, banks] = await Promise.all([
    promotionService.listAllPromotions(),
    promotionService.listBanks(),
  ]);

  return (
    <PromotionsManagerClient
      initialPromotions={promotions}
      initialBanks={banks}
    />
  );
}

