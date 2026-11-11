import { Suspense } from "react";
import type { Metadata } from "next";

// Revalida el catálogo en segundo plano cada 60 segundos en Edge CDN
export const revalidate = 60;

import { getProductServiceDeps } from "../../infra/db/connection";
import { getShowroomSettings } from "../../services/settings.service";
import { CatalogPanelView } from "../../components/catalog/CatalogPanelView";
import {
  loadCatalogPanelData,
  RawCatalogSearchParams,
} from "../../lib/catalog/load-catalog-panel";

interface CatalogPageProps {
  searchParams: Promise<RawCatalogSearchParams>;
}

export async function generateMetadata(): Promise<Metadata> {
  let brandName = process.env.COMMERCE_NAME || "Mi Tienda";
  let description =
    "Explorá todas las piezas disponibles filtrando por talle, color, categoría o precio.";

  try {
    const deps = getProductServiceDeps();
    const settings = await getShowroomSettings(deps);
    brandName = settings.showroomName || brandName;
    if (settings.businessDescriptor || settings.aboutText) {
      description = settings.businessDescriptor || settings.aboutText || description;
    }
  } catch {
    // Fallback silencioso
  }

  const title = `Catálogo Completo | ${brandName}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mitienda.local";

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/catalogo`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/catalogo`,
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

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedParams = await searchParams;
  const data = await loadCatalogPanelData({
    rawSearchParams: resolvedParams,
    section: null,
  });

  const pageTitle = data.activeFilters.q
    ? `Resultados para "${data.activeFilters.q}"`
    : "Catálogo Completo";

  return (
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
  );
}
