import { Suspense } from "react";
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

  // 4. Obtener productos mediante el servicio listProducts (AR-02)
  const productsResult = await listProducts(
    {
      categoryId: activeCategoryId,
      search: resolvedParams.q,
      sortBy,
      page: resolvedParams.pagina ? parseInt(resolvedParams.pagina, 10) : 1,
      pageSize: 30,
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
      <div className="mb-4">
        <CategoryNav
          categories={allCategories}
          activeSlug={resolvedParams.categoria}
        />
      </div>

      {/* Barra de ordenamiento y conteo (BR-21, BR-22) */}
      <div className="mb-6">
        <SortFilterBar
          total={productsResult.total}
          currentSort={resolvedParams.orden || "newest"}
        />
      </div>

      {/* Grilla de productos responsiva */}
      <ProductGrid products={productsResult.items} />
    </>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-72 animate-pulse rounded-full bg-stone-200/80" />
      <div className="h-6 w-full animate-pulse rounded bg-stone-100" />
      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-stone-200/60" />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const deps = getProductServiceDeps();
  const brandName = (await deps.settingsRepo?.get("brand_name")) || "Aura Studio";

  return (
    <div className="min-h-screen bg-stone-50/50 text-stone-900">
      {/* Header fijo con buscador por código (BR-24) */}
      <Header brandName={brandName} />

      {/* Contenido principal del catálogo */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Banner editorial sutil */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 p-6 text-stone-100 shadow-sm sm:p-8">
          <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-amber-300 uppercase">
            Colección & Showroom
          </p>
          <h1 className="mt-1 font-serif text-2xl font-light tracking-wide sm:text-3xl">
            Piezas Únicas & Selección Exclusiva
          </h1>
          <p className="mt-2 max-w-xl text-xs text-stone-300 sm:text-sm">
            Explora nuestras prendas disponibles. Cada pieza es única y puedes reservarla directamente por WhatsApp.
          </p>
        </div>

        {/* Streaming con Suspense para Partial Prerendering de Next.js 16 */}
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogContent searchParams={searchParams} />
        </Suspense>
      </main>

      {/* Footer minimalista */}
      <footer className="mt-20 border-t border-stone-200 bg-white py-10 text-center text-xs text-stone-500">
        <p className="font-serif tracking-widest uppercase">{brandName}</p>
        <p className="mt-1 text-[11px] text-stone-400">
          Piezas únicas con reserva directa por WhatsApp · Buenos Aires, Argentina
        </p>
      </footer>
    </div>
  );
}

