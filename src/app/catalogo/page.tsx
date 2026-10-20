import { Suspense } from "react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { CartDrawer } from "../../components/cart/CartDrawer";
import { CartToast } from "../../components/cart/CartToast";
import { StoreThemeStyles } from "../../components/theme/StoreThemeStyles";
import { CatalogPanelView } from "../../components/catalog/CatalogPanelView";
import {
  loadCatalogPanelData,
  RawCatalogSearchParams,
} from "../../lib/catalog/load-catalog-panel";

interface CatalogPageProps {
  searchParams: Promise<RawCatalogSearchParams>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedParams = await searchParams;
  const data = await loadCatalogPanelData({
    rawSearchParams: resolvedParams,
    section: null,
  });

  const brandName = data.settings.showroomName || "Aura Studio";
  const pageTitle = data.activeFilters.q
    ? `Resultados para "${data.activeFilters.q}"`
    : "Catálogo Completo";

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
            title={pageTitle}
            subtitle="Explorá todas las piezas disponibles filtrando por talle, color, categoría o precio."
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
        businessDescriptor={data.settings.businessDescriptor}
        aboutText={data.settings.aboutText}
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

