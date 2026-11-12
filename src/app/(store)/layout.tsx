import type { Metadata } from "next";
import { cache } from "react";
import dynamic from "next/dynamic";
import { getProductServiceDeps } from "../../infra/db/connection";
import {
  DEFAULT_ANNOUNCEMENT_BAR,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_HOME_BLOCKS,
  getShowroomSettings,
  ShowroomSettings,
} from "../../services/settings.service";
import { NavigationService } from "../../services/navigation.service";
import { getDefaultBrandName, getPlatformOperatorName } from "../../lib/brand";
import { StoreThemeStyles } from "../../components/theme/StoreThemeStyles";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { CartToast } from "../../components/cart/CartToast";
import { StoreShell } from "../../components/layout/StoreShell";

const CartDrawer = dynamic(() =>
  import("../../components/cart/CartDrawer").then((mod) => mod.CartDrawer)
);

const getCachedStoreLayoutData = cache(async () => {
  const deps = getProductServiceDeps();
  const navService = new NavigationService({
    navigationRepo: deps.navigationRepo,
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
  });

  const [resolvedSettings, resolvedCategories, resolvedSections] = await Promise.all([
    getShowroomSettings(deps),
    deps.categoryRepo.listAll(),
    navService.listPublicNavigationSections(),
  ]);

  return {
    settings: resolvedSettings,
    allCategories: resolvedCategories,
    publicSections: resolvedSections,
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const defaultBrand = getDefaultBrandName();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mitienda.local";

  let brandName = defaultBrand;
  let description =
    "Piezas seleccionadas y catálogo online con reserva directa y envíos coordinados.";
  let logoUrl: string | null | undefined = null;

  try {
    const { settings } = await getCachedStoreLayoutData();
    brandName = settings.showroomName || defaultBrand;
    description = settings.aboutText || settings.businessDescriptor || description;
    logoUrl = settings.logoUrl;
  } catch {
    // Fallback silencioso si la BD no está disponible en build
  }

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${brandName} | Catálogo Online`,
      template: `%s · ${brandName}`,
    },
    description,
    openGraph: {
      type: "website",
      locale: "es_AR",
      url: "/",
      siteName: brandName,
      title: `${brandName} | Catálogo Online`,
      description,
      images: logoUrl
        ? [
            {
              url: logoUrl,
              alt: brandName,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: brandName,
      description,
      images: logoUrl ? [logoUrl] : [],
    },
  };
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultBrand = getDefaultBrandName();
  const operatorName = getPlatformOperatorName();
  let settings: Partial<ShowroomSettings> & {
    themePalette: string;
    themeFont: string;
  };
  let allCategories: Awaited<ReturnType<typeof getCachedStoreLayoutData>>["allCategories"] = [];
  let publicSections: Awaited<ReturnType<typeof getCachedStoreLayoutData>>["publicSections"] = [];

  try {
    const data = await getCachedStoreLayoutData();
    settings = data.settings;
    allCategories = data.allCategories;
    publicSections = data.publicSections;
  } catch {
    settings = {
      showroomName: defaultBrand,
      themePalette: "lino",
      themePrimaryColor: null,
      themeBgColor: null,
      themeSurfaceColor: null,
      themeHeaderBgColor: null,
      themeFooterBgColor: null,
      themeFont: "cormorant",
      contentWidth: "standard",
      businessDescriptor: null,
      aboutText: null,
      logoUrl: null,
      whatsappNumber: "",
      instagramHandle: null,
      tiktokHandle: null,
      address: null,
      dataFiscalUrl: null,
      announcementBar: DEFAULT_ANNOUNCEMENT_BAR,
      navbarConfig: undefined,
      homeBlocks: DEFAULT_HOME_BLOCKS,
      storeLocation: undefined,
      storeSchedule: undefined,
      footerConfig: DEFAULT_FOOTER_CONFIG,
      mercadopagoEnabled: false,
      transferEnabled: false,
      cashEnabled: false,
      ordersPaused: false,
      ordersPausedNotice: null,
    };
  }

  const brandName = settings.showroomName || defaultBrand;
  const rawBlocks = Array.isArray(settings.homeBlocks)
    ? settings.homeBlocks
    : settings.homeBlocks?.blocks || [];
  const bankPromotionsEnabled = rawBlocks.some(
    (b) => (b.id === "bank_promotions" || b.id === "bank_promos") && b.enabled
  );

  return (
    <>
      <StoreThemeStyles
        paletteId={settings.themePalette}
        primaryColor={settings.themePrimaryColor}
        bgColor={settings.themeBgColor}
        surfaceColor={settings.themeSurfaceColor}
        headerBgColor={settings.themeHeaderBgColor}
        footerBgColor={settings.themeFooterBgColor}
        fontId={settings.themeFont}
        contentWidth={settings.contentWidth}
      />
      <StoreShell
        header={
          <Header
            brandName={brandName}
            logoUrl={settings.logoUrl}
            sections={publicSections}
            categories={allCategories}
            announcementBar={settings.announcementBar}
            navbarConfig={settings.navbarConfig}
          />
        }
        footer={
          <Footer
            brandName={brandName}
            operatorName={operatorName}
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
            bankPromotionsEnabled={bankPromotionsEnabled}
            footerConfig={settings.footerConfig}
            mercadopagoEnabled={settings.mercadopagoEnabled}
            transferEnabled={settings.transferEnabled}
            cashEnabled={settings.cashEnabled}
          />
        }
        cart={
          <>
            <CartDrawer
              showroomAddress={settings.address}
              whatsappNumber={settings.whatsappNumber}
              brandName={brandName}
              ordersPaused={settings.ordersPaused}
              ordersPausedNotice={settings.ordersPausedNotice}
            />
            <CartToast />
          </>
        }
      >
        {children}
      </StoreShell>
    </>
  );
}
