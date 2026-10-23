import { getProductServiceDeps } from "../../infra/db/connection";

// Revalida promociones en Edge CDN cada 10 minutos
export const revalidate = 600;
import { NavigationService } from "../../services/navigation.service";
import { PromotionService } from "../../services/promotion.service";
import { getShowroomSettings } from "../../services/settings.service";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { CartDrawer } from "../../components/cart/CartDrawer";
import { CartToast } from "../../components/cart/CartToast";
import { StoreThemeStyles } from "../../components/theme/StoreThemeStyles";
import { PromotionsPageClient } from "../../components/promotions/PromotionsPageClient";

export default async function PromotionsPage() {
  const deps = getProductServiceDeps();
  const navService = new NavigationService({
    navigationRepo: deps.navigationRepo,
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
  });
  const promotionService = new PromotionService(deps.promotionRepo);

  const [settings, categories, publicSections, activePromotions, banks] =
    await Promise.all([
      getShowroomSettings(deps),
      deps.categoryRepo.listAll(),
      navService.listPublicNavigationSections(),
      promotionService.listActivePublicPromotions(),
      promotionService.listBanks(),
    ]);

  const brandName = settings.showroomName || "Aura Studio";

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col">
      <StoreThemeStyles
        paletteId={settings.themePalette}
        primaryColor={settings.themePrimaryColor}
        fontId={settings.themeFont}
      />

      <Header
        brandName={brandName}
        logoUrl={settings.logoUrl}
        sections={publicSections}
        categories={categories}
        announcementBar={settings.announcementBar}
      />

      <main className="flex-1">
        <PromotionsPageClient promotions={activePromotions} banks={banks} />
      </main>

      <CartDrawer
        showroomAddress={settings.address}
        whatsappNumber={settings.whatsappNumber}
        brandName={brandName}
      />

      <Footer
        brandName={brandName}
        businessDescriptor={settings.businessDescriptor}
        aboutText={settings.aboutText}
        logoUrl={settings.logoUrl}
        whatsappNumber={settings.whatsappNumber}
        instagramHandle={settings.instagramHandle}
        tiktokHandle={settings.tiktokHandle}
        address={settings.address}
        dataFiscalUrl={settings.dataFiscalUrl}
        sections={publicSections}
        storeLocation={settings.storeLocation}
        storeSchedule={settings.storeSchedule}
      />

      <CartToast />
    </div>
  );
}

