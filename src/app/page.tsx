import { Suspense } from "react";
import { getProductServiceDeps } from "../infra/db/connection";
import { listProducts } from "../services/product.service";
import { getShowroomSettings } from "../services/settings.service";
import { NavigationService } from "../services/navigation.service";
import { PromotionService } from "../services/promotion.service";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { NewPiecesAlertSection } from "../components/catalog/NewPiecesAlertSection";
import { CatalogPanelView } from "../components/catalog/CatalogPanelView";
import { HeroBannerCarousel } from "../components/home/HeroBannerCarousel";
import { BankPromosBlock } from "../components/home/BankPromosBlock";
import { FeaturedSectionsMosaic } from "../components/home/FeaturedSectionsMosaic";
import {
  FeaturedProductsBlock,
  NewArrivalsBlock,
  SaleBlock,
  TrustStripBlock,
} from "../components/home/HomeShowcaseBlocks";
import { CartDrawer } from "../components/cart/CartDrawer";
import { StoreThemeStyles } from "../components/theme/StoreThemeStyles";
import { CartToast } from "../components/cart/CartToast";
import {
  loadCatalogPanelData,
  RawCatalogSearchParams,
} from "../lib/catalog/load-catalog-panel";

interface HomePageProps {
  searchParams?: Promise<RawCatalogSearchParams>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = searchParams ? await searchParams : {};

  // Si la URL raíz recibe filtros de catálogo (?q=..., ?categoria=..., ?talle=...), mostramos la vista de panel de catálogo
  const hasCatalogQuery = Boolean(
    resolvedParams.q ||
      resolvedParams.categoria ||
      resolvedParams.talle ||
      resolvedParams.color ||
      resolvedParams.oferta ||
      resolvedParams.orden ||
      resolvedParams.pagina
  );

  if (hasCatalogQuery) {
    const data = await loadCatalogPanelData({
      rawSearchParams: resolvedParams,
      section: null,
    });
    const brandName = data.settings.showroomName || "Aura Studio";
    return (
      <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col">
        <StoreThemeStyles
          paletteId={data.settings.themePalette}
          primaryColor={data.settings.themePrimaryColor}
          fontId={data.settings.themeFont}
        />
        <Header
          brandName={brandName}
          logoUrl={data.settings.logoUrl}
          initialSearch={data.activeFilters.q || ""}
          sections={data.publicSections}
          categories={data.categories}
          announcementBar={data.settings.announcementBar}
        />
        <main className="flex-1">
          <Suspense fallback={<div className="mx-auto max-w-6xl p-8">Cargando catálogo...</div>}>
            <CatalogPanelView
              title={
                data.activeFilters.q
                  ? `Resultados para "${data.activeFilters.q}"`
                  : "Catálogo"
              }
              breadcrumbLabel="Catálogo"
              products={data.products}
              totalCount={data.totalCount}
              pageSize={data.pageSize}
              currentPage={data.currentPage}
              facets={data.facets}
              categories={data.categories}
              attributeDefinitions={data.attributeDefinitions}
              enabledFilters={data.enabledFilters}
              activeFilters={data.activeFilters}
              defaultSort={data.defaultSort}
            />
          </Suspense>
        </main>
        <CartDrawer
          showroomAddress={data.settings.address}
          whatsappNumber={data.settings.whatsappNumber}
          brandName={brandName}
        />
        <Footer
          brandName={brandName}
          logoUrl={data.settings.logoUrl}
          whatsappNumber={data.settings.whatsappNumber}
          instagramHandle={data.settings.instagramHandle}
          tiktokHandle={data.settings.tiktokHandle}
          address={data.settings.address}
          dataFiscalUrl={data.settings.dataFiscalUrl}
          sections={data.publicSections}
          storeLocation={data.settings.storeLocation}
          storeSchedule={data.settings.storeSchedule}
        />
        <CartToast />
      </div>
    );
  }

  const deps = getProductServiceDeps();
  const navService = new NavigationService({
    navigationRepo: deps.navigationRepo,
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
  });
  const promotionService = new PromotionService(deps.promotionRepo);

  const thirtyDaysAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const [
    settings,
    allCategories,
    publicSections,
    activeBanners,
    activePromotions,
    newArrivalsResult,
    featuredResult,
    saleResult,
  ] = await Promise.all([
    getShowroomSettings(deps),
    deps.categoryRepo.listAll(),
    navService.listPublicNavigationSections(),
    promotionService.listActiveHomeBanners(),
    promotionService.listActivePublicPromotions(),
    listProducts(
      {
        publishedAfter: thirtyDaysAgoMs,
        onlyAvailable: true,
        sortBy: "newest",
        pageSize: 8,
      },
      deps
    ),
    listProducts(
      {
        isFeatured: true,
        onlyAvailable: true,
        sortBy: "featured",
        pageSize: 8,
      },
      deps
    ),
    listProducts(
      {
        onlyOnSale: true,
        onlyAvailable: true,
        sortBy: "featured",
        pageSize: 4,
      },
      deps
    ),
  ]);

  const brandName = settings.showroomName || "Aura Studio";
  const rawBlocks = Array.isArray(settings.homeBlocks)
    ? settings.homeBlocks
    : settings.homeBlocks?.blocks || [];
  const orderedBlocks = [...rawBlocks]
    .filter((b) => b.enabled)
    .sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col">
      {/* Inyección de paleta de colores configurada en Backoffice */}
      <StoreThemeStyles
        paletteId={settings.themePalette}
        primaryColor={settings.themePrimaryColor}
        fontId={settings.themeFont}
      />

      {/* 1 & 2. Barra de anuncios (36-40px) + Header fijo con secciones y buscador con sugerencias */}
      <Header
        brandName={brandName}
        logoUrl={settings.logoUrl}
        sections={publicSections}
        categories={allCategories}
        announcementBar={settings.announcementBar}
      />

      {/* Vidriera por bloques ordenables desde el backoffice */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-10 sm:space-y-14">
        {orderedBlocks.map((block) => {
          switch (block.id) {
            case "hero":
            case "hero_banner":
              return (
                <HeroBannerCarousel
                  key={block.id}
                  banners={activeBanners}
                  fallbackTitle={settings.heroTitle}
                  fallbackSubtitle={settings.heroSubtitle}
                  fallbackBannerUrl={settings.heroBannerUrl}
                  brandName={brandName}
                />
              );

            case "bank_promos":
            case "bank_promotions":
              return (
                <BankPromosBlock
                  key={block.id}
                  promotions={activePromotions}
                />
              );

            case "featured_sections":
              return (
                <FeaturedSectionsMosaic
                  key={block.id}
                  sections={publicSections}
                />
              );

            case "new_arrivals":
              return (
                <NewArrivalsBlock
                  key={block.id}
                  products={newArrivalsResult.items}
                  sectionHref={
                    publicSections.some((s) => s.slug === "recien-llegados")
                      ? "/recien-llegados"
                      : "/catalogo?orden=recien-llegados"
                  }
                />
              );

            case "featured_products":
              return (
                <FeaturedProductsBlock
                  key={block.id}
                  products={featuredResult.items}
                />
              );

            case "sale":
            case "sale_block":
              return (
                <SaleBlock
                  key={block.id}
                  products={saleResult.items}
                  sectionHref={
                    publicSections.some((s) => s.slug === "sale")
                      ? "/sale"
                      : "/catalogo?oferta=1"
                  }
                />
              );

            case "trust":
            case "trust_bar":
              return <TrustStripBlock key={block.id} />;

            case "drops":
            case "drops_newsletter":
              return <NewPiecesAlertSection key={block.id} />;

            default:
              return null;
          }
        })}
      </main>

      {/* Drawer lateral de Carrito / Bolsa */}
      <CartDrawer
        showroomAddress={settings.address}
        whatsappNumber={settings.whatsappNumber}
        brandName={brandName}
      />

      {/* Footer de 4 columnas con ubicación y horarios */}
      <Footer
        brandName={brandName}
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

      {/* Toast accesible de confirmación de bolsa de compras (BR-40) */}
      <CartToast />
    </div>
  );
}
