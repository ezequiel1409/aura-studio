import { Metadata } from "next";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getShowroomSettings } from "../../services/settings.service";
import { PromotionService } from "../../services/promotion.service";
import { PromotionsPageClient } from "../../components/promotions/PromotionsPageClient";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  let brandName = process.env.COMMERCE_NAME || "Mi Tienda";
  try {
    const deps = getProductServiceDeps();
    const settings = await getShowroomSettings(deps);
    brandName = settings.showroomName || brandName;
  } catch {
    // Fallback silencioso
  }

  return {
    title: `Promociones y Medios de Pago | ${brandName}`,
    description: `Conocé todas las promociones bancarias, cuotas sin interés y descuentos por transferencia en ${brandName}.`,
  };
}

export default async function PromotionsPage() {
  const deps = getProductServiceDeps();
  const promotionService = new PromotionService(deps.promotionRepo);

  const [activePromotions, banks] = await Promise.all([
    promotionService.listActivePublicPromotions(),
    promotionService.listBanks(),
  ]);

  return (
    <main className="flex-1">
      <PromotionsPageClient promotions={activePromotions} banks={banks} />
    </main>
  );
}
