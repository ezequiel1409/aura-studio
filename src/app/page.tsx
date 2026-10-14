import { Suspense } from "react";
import { getProductServiceDeps } from "../infra/db/connection";
import { listProducts } from "../services/product.service";
import { getShowroomSettings } from "../services/settings.service";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { CategoryNav } from "../components/catalog/CategoryNav";
import { SortFilterBar } from "../components/catalog/SortFilterBar";
import { ProductGrid } from "../components/catalog/ProductGrid";
import { HomeHero } from "../components/catalog/HomeHero";
import { StoreThemeStyles } from "../components/theme/StoreThemeStyles";
import { AnalyticsTracker } from "../components/analytics/AnalyticsTracker";
import { ProductSortOption } from "../domain/product/types";
import { Category } from "../domain/category/types";

interface HomePageProps {
  searchParams: Promise<{
    categoria?: string;
    orden?: string;
    q?: string;
    pagina?: string;
    destacados?: string;
  }>;
}

async function CatalogContent({
  searchParams,
  categories,
}: {
  searchParams: Promise<{
    categoria?: string;
    orden?: string;
    q?: string;
    pagina?: string;
    destacados?: string;
  }>;
  categories: Category[];
}) {
  const resolvedParams = await searchParams;
  const deps = getProductServiceDeps();

  // 1. Resolver categoría activa si se especificó en la URL
  let activeCategoryId: number | undefined = undefined;
  if (resolvedParams.categoria) {
    const matchedCategory = categories.find((c) => c.slug === resolvedParams.categoria);
    if (matchedCategory) {
      activeCategoryId = matchedCategory.id;
    }
  }

  // 2. Resolver orden (BR-21)
  const sortBy: ProductSortOption =
    resolvedParams.orden === "price_asc" || resolvedParams.orden === "price_desc"
      ? resolvedParams.orden
      : "newest";

  const isFeaturedFilter = resolvedParams.destacados === "true";

  // 3. Obtener productos mediante el servicio listProducts (AR-02)
  const productsResult = await listProducts(
    {
      categoryId: activeCategoryId,
      search: resolvedParams.q,
      sortBy,
      isFeatured: isFeaturedFilter ? true : undefined,
      page: resolvedParams.pagina ? parseInt(resolvedParams.pagina, 10) : 1,
      pageSize: 40,
    },
    deps
  );

  return (
    <>
      {/* Tracking de vista de categoría si está filtrado (AR-07, BR-39) */}
      {activeCategoryId && (
        <AnalyticsTracker type="category_view" categoryId={activeCategoryId} />
      )}

      {/* Barra de ordenamiento y conteo (BR-21, BR-22) */}
      <section aria-label="Orden y resultados" className="mb-6">
        <SortFilterBar
          total={productsResult.total}
          currentSort={resolvedParams.orden || "newest"}
          isFeaturedOnly={isFeaturedFilter}
        />
      </section>

      {/* Grilla de productos responsiva */}
      <section aria-label="Catálogo de productos">
        <ProductGrid products={productsResult.items} />
      </section>
    </>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando catálogo">
      <div className="h-10 w-full animate-pulse rounded-lg bg-[#f5f2eb]" />
      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-xl border border-[#e7e2da] bg-[#f5f2eb]"
          />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const deps = getProductServiceDeps();
  const [settings, allCategories, featuredResult] = await Promise.all([
    getShowroomSettings(deps),
    deps.categoryRepo.listAll(),
    listProducts({ isFeatured: true, pageSize: 6 }, deps),
  ]);
  const brandName = settings.showroomName || "Aura Studio";

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917]">
      {/* Inyección de paleta de colores configurada en Backoffice */}
      <StoreThemeStyles
        paletteId={settings.themePalette}
        primaryColor={settings.themePrimaryColor}
      />

      {/* Header fijo con buscador por código (BR-24) */}
      <Header brandName={brandName} logoUrl={settings.logoUrl} />

      {/* Contenido principal del catálogo */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Portada / Hero configurable desde el Backoffice (Carrusel, Banner o Editorial) */}
        <HomeHero
          heroMode={settings.heroMode}
          heroTitle={settings.heroTitle}
          heroSubtitle={settings.heroSubtitle}
          heroBannerUrl={settings.heroBannerUrl}
          featuredProducts={featuredResult.items}
          brandName={brandName}
        />

        {/* Navegación por categorías desplegable y jerárquica (BR-16, BR-22, BR-38) */}
        <section aria-label="Categorías" className="mb-4">
          <CategoryNav categories={allCategories} />
        </section>

        {/* Streaming con Suspense para Partial Prerendering de Next.js 16 */}
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogContent searchParams={searchParams} categories={allCategories} />
        </Suspense>
      </main>

      {/* Footer con información de la tienda, redes y data fiscal */}
      <Footer
        brandName={brandName}
        logoUrl={settings.logoUrl}
        whatsappNumber={settings.whatsappNumber}
        instagramHandle={settings.instagramHandle}
        tiktokHandle={settings.tiktokHandle}
        address={settings.address}
        dataFiscalUrl={settings.dataFiscalUrl}
      />
    </div>
  );
}
