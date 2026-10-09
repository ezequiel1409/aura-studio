import { Suspense } from "react";
import Link from "next/link";
import { getProductServiceDeps } from "../infra/db/connection";
import { listProducts } from "../services/product.service";
import { Header } from "../components/layout/Header";
import { CategoryNav } from "../components/catalog/CategoryNav";
import { SortFilterBar } from "../components/catalog/SortFilterBar";
import { ProductGrid } from "../components/catalog/ProductGrid";
import { AnalyticsTracker } from "../components/analytics/AnalyticsTracker";
import { ProductSortOption } from "../domain/product/types";

interface HomePageProps {
  searchParams: Promise<{
    categoria?: string;
    orden?: string;
    q?: string;
    pagina?: string;
    destacados?: string;
  }>;
}

export const instant = false;

async function CatalogContent({
  searchParams,
}: {
  searchParams: Promise<{
    categoria?: string;
    orden?: string;
    q?: string;
    pagina?: string;
    destacados?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const deps = getProductServiceDeps();

  // 1. Obtener todas las categorías para la navegación (BR-38)
  const allCategories = await deps.categoryRepo.listAll();

  // 2. Resolver categoría activa si se especificó en la URL
  let activeCategoryId: number | undefined = undefined;
  if (resolvedParams.categoria) {
    const matchedCategory = allCategories.find((c) => c.slug === resolvedParams.categoria);
    if (matchedCategory) {
      activeCategoryId = matchedCategory.id;
    }
  }

  // 3. Resolver orden (BR-21)
  const sortBy: ProductSortOption =
    resolvedParams.orden === "price_asc" || resolvedParams.orden === "price_desc"
      ? resolvedParams.orden
      : "newest";

  const isFeaturedFilter = resolvedParams.destacados === "true";

  // 4. Obtener productos mediante el servicio listProducts (AR-02)
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

      {/* Navegación por categorías con scroll horizontal (BR-16, BR-22, BR-38) */}
      <section aria-label="Categorías" className="mb-4">
        <CategoryNav
          categories={allCategories}
          activeSlug={resolvedParams.categoria}
        />
      </section>

      {/* Barra de ordenamiento y conteo (BR-21, BR-22) */}
      <section aria-label="Orden y resultados" className="mb-6">
        <SortFilterBar
          total={productsResult.total}
          currentSort={resolvedParams.orden || "newest"}
          isFeaturedOnly={isFeaturedFilter}
        />
      </section>

      {/* Grilla de productos responsiva */}
      <section aria-label="Listado de prendas">
        <ProductGrid products={productsResult.items} />
      </section>
    </>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando catálogo">
      <div className="h-10 w-80 animate-pulse rounded-full bg-[#f0ece1]" />
      <div className="h-8 w-full animate-pulse rounded-lg bg-[#f5f2eb]" />
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
  const brandName = (await deps.settingsRepo?.get("brand_name")) || "Aura Studio";

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917]">
      {/* Header fijo con buscador por código (BR-24) */}
      <Header brandName={brandName} />

      {/* Contenido principal del catálogo */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Banner editorial de bienvenida */}
        <section
          aria-labelledby="hero-title"
          className="relative mb-8 overflow-hidden rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-10 shadow-xs"
        >
          <div className="max-w-2xl">
            <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-[#926a3c] uppercase">
              Colección Seleccionada
            </span>
            <h1
              id="hero-title"
              className="mt-2 font-serif text-3xl font-light tracking-wide text-stone-900 sm:text-4xl"
            >
              Piezas únicas con carácter propio
            </h1>
            <p className="mt-3 text-xs leading-relaxed text-stone-600 sm:text-sm">
              Cada prenda de nuestro showroom es única e irrepetible. Explora el catálogo y reserva tu pieza al instante vía WhatsApp.
            </p>
          </div>
        </section>

        {/* Streaming con Suspense para Partial Prerendering de Next.js 16 */}
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogContent searchParams={searchParams} />
        </Suspense>
      </main>

      {/* Footer minimalista */}
      <footer
        role="contentinfo"
        className="mt-20 border-t border-[#e7e2da] bg-white py-12 text-center text-xs text-stone-500"
      >
        <p className="font-serif text-base tracking-[0.2em] font-medium text-stone-900 uppercase">
          {brandName}
        </p>
        <p className="mt-1 text-[11px] text-stone-500">
          Showroom & Archivo · Buenos Aires, Argentina
        </p>
        <p className="mt-3 text-[10px] text-stone-400">
          Atención y reservas directas a través de WhatsApp
        </p>
        <div className="mt-6 pt-4 border-t border-[#f0ece1]/80 flex justify-center">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-800 transition-colors py-1 px-2.5 rounded-md hover:bg-stone-100"
          >
            <span>Acceso Showroom / Admin</span>
            <span className="text-[9px] font-mono text-stone-400">→</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
