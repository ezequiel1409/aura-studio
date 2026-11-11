import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Revalida la sección del catálogo cada 60 segundos
export const revalidate = 60;
import { getProductServiceDeps } from "../../infra/db/connection";
import { getShowroomSettings } from "../../services/settings.service";
import { CatalogPanelView } from "../../components/catalog/CatalogPanelView";
import {
  loadCatalogPanelData,
  RawCatalogSearchParams,
} from "../../lib/catalog/load-catalog-panel";

interface SectionCatalogPageProps {
  params: Promise<{ sectionSlug: string }>;
  searchParams: Promise<RawCatalogSearchParams>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sectionSlug: string }>;
}): Promise<Metadata> {
  const { sectionSlug } = await params;
  const deps = getProductServiceDeps();
  const section = await deps.navigationRepo.findSectionBySlug(sectionSlug);

  let brandName = process.env.COMMERCE_NAME || "Mi Tienda";
  try {
    const settings = await getShowroomSettings(deps);
    brandName = settings.showroomName || brandName;
  } catch {
    // Fallback silencioso
  }

  if (!section || !section.isVisible) {
    return {
      title: `Sección no encontrada | ${brandName}`,
    };
  }

  const title = `${section.name} | ${brandName}`;
  const description =
    section.subtitle ||
    `Explorá nuestra sección ${section.name} en ${brandName}. Piezas seleccionadas con entrega coordinada.`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mitienda.local";

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${section.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${section.slug}`,
      siteName: brandName,
      locale: "es_AR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SectionCatalogPage({
  params,
  searchParams,
}: SectionCatalogPageProps) {
  const { sectionSlug } = await params;
  const deps = getProductServiceDeps();
  const section = await deps.navigationRepo.findSectionBySlug(sectionSlug);

  if (!section || !section.isVisible) {
    notFound();
  }

  const resolvedParams = await searchParams;
  const data = await loadCatalogPanelData({
    rawSearchParams: resolvedParams,
    section,
  });

  const subtitleMap: Record<string, string> = {
    SALE: "Aprovechá piezas seleccionadas con descuentos exclusivos por tiempo limitado.",
    DISCOUNT: "Aprovechá piezas seleccionadas con descuentos exclusivos por tiempo limitado.",
    RECENCY: `Descubrí las últimas incorporaciones publicadas en los últimos ${
      section.ruleConfig.daysWindow ?? 30
    } días.`,
    RECENT: `Descubrí las últimas incorporaciones publicadas en los últimos ${
      section.ruleConfig.daysWindow ?? 30
    } días.`,
    ATTRIBUTE: `Colección filtrada para ${
      section.ruleConfig.attributeValue || section.name
    }.`,
  };

  return (
    <main className="flex-1">
      <Suspense fallback={<div className="mx-auto max-w-6xl p-8">Cargando sección...</div>}>
        <CatalogPanelView
          title={section.name}
          subtitle={section.subtitle || subtitleMap[section.ruleType] || undefined}
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
  );
}
