import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductServiceDeps } from "../../infra/db/connection";
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

interface SectionCatalogPageProps {
  params: Promise<{ sectionSlug: string }>;
  searchParams: Promise<RawCatalogSearchParams>;
}

export default async function SectionCatalogPage({
  params,
  searchParams,
}: SectionCatalogPageProps) {
  const [{ sectionSlug }, resolvedParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const deps = getProductServiceDeps();
  const section = await deps.navigationRepo.findSectionBySlug(sectionSlug);

  if (!section || !section.isVisible) {
    notFound();
  }

  const data = await loadCatalogPanelData({
    rawSearchParams: resolvedParams,
    section,
  });

  const brandName = data.settings.showroomName || "Aura Studio";

  const subtitleMap: Record<string, string> = {
    SALE: "Piezas seleccionadas con descuento sobre su precio anterior.",
    RECENCY: `Nuevas piezas incorporadas en los últimos ${
      section.ruleConfig.daysWindow ?? 30
    } días.`,
    ATTRIBUTE: `Colección filtrada para ${
      section.ruleConfig.attributeValue || section.name
    }.`,
  };

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
        <Suspense fallback={<div className="mx-auto max-w-6xl p-8">Cargando sección...</div>}>
          <CatalogPanelView
            title={section.name}
            subtitle={subtitleMap[section.ruleType] || undefined}
            breadcrumbLabel={section.name}
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
            lockedSectionRuleType={section.ruleType}
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

