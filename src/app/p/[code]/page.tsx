import { cache } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, ShoppingBag } from "lucide-react";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { parseProductCode, formatProductCode } from "../../../domain/product/rules";
import { Product } from "../../../domain/product/types";
import { formatPrice } from "../../../lib/format/currency";
import { parseSizesList } from "../../../lib/parser/product-parser";
import { ProductShowcaseClient } from "../../../components/catalog/ProductShowcaseClient";
import { ProductCard } from "../../../components/catalog/ProductCard";
import { ProductGrid } from "../../../components/catalog/ProductGrid";
import { AnalyticsTracker } from "../../../components/analytics/AnalyticsTracker";
import { ShareOutfitButton } from "../../../components/catalog/ShareOutfitButton";
import { listProducts } from "../../../services/product.service";
import { getShowroomSettings } from "../../../services/settings.service";

// Revalida la ficha de producto en Edge CDN cada 5 minutos
export const revalidate = 300;

interface ProductPageProps {
  params: Promise<{
    code: string;
  }>;
}

// Deduplicación por ciclo de request (evita dobles queries entre generateMetadata y el componente)
const getCachedProduct = cache(async (codeNum: number) => {
  const deps = getProductServiceDeps();
  return deps.productRepo.findByCode(codeNum);
});

const getCachedSettings = cache(async () => {
  const deps = getProductServiceDeps();
  return getShowroomSettings(deps);
});

/**
 * Busca piezas complementarias para combinar con el producto actual.
 * Si no encuentra combinación directa, recurre a las piezas disponibles más recientes.
 */
const getCachedRelatedProducts = cache(
  async (
    currentProduct: Product,
    currentCategory: { id: number; name: string; slug: string } | null
  ): Promise<{ items: Product[]; isComplementary: boolean }> => {
    const deps = getProductServiceDeps();
    const catSlug = (currentCategory?.slug || "").toLowerCase();
    const isTop =
      catSlug.includes("top") ||
      catSlug.includes("remera") ||
      catSlug.includes("camisa") ||
      catSlug.includes("buzo");
    const isBottom =
      catSlug.includes("calza") ||
      catSlug.includes("pantalon") ||
      catSlug.includes("short") ||
      catSlug.includes("biker") ||
      catSlug.includes("falda");

    if (isTop || isBottom) {
      try {
        const allCategories = await deps.categoryRepo.listAll();
        const targetCategories = allCategories.filter((c) => {
          const s = c.slug.toLowerCase();
          if (isTop) {
            return (
              s.includes("calza") ||
              s.includes("pantalon") ||
              s.includes("short") ||
              s.includes("biker") ||
              s.includes("falda")
            );
          }
          return (
            s.includes("top") ||
            s.includes("remera") ||
            s.includes("camisa") ||
            s.includes("buzo")
          );
        });

        if (targetCategories.length > 0) {
          const catIds = targetCategories.map((c) => c.id);
          const res = await deps.productRepo.list(
            {
              status: "AVAILABLE",
              pageSize: 6,
              sortBy: "newest",
            },
            catIds
          );
          const complementary = res.items.filter((p) => p.id !== currentProduct.id);
          if (complementary.length > 0) {
            return {
              items: complementary.slice(0, 3),
              isComplementary: true,
            };
          }
        }
      } catch {
        // Fallback al listado general
      }
    }

    // Fallback: 3 productos disponibles más recientes
    const fallback = await listProducts(
      { status: "AVAILABLE", pageSize: 6, sortBy: "newest" },
      deps
    );
    return {
      items: fallback.items.filter((p) => p.id !== currentProduct.id).slice(0, 3),
      isComplementary: false,
    };
  }
);

/**
 * Genera metadatos Open Graph, Twitter Card y Canonical para buscadores y redes sociales
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const defaultBrand = process.env.COMMERCE_NAME || "Mi Tienda";
  const resolvedParams = await params;
  const codeNum = parseProductCode(resolvedParams.code);

  if (!codeNum) {
    return { title: `Pieza no disponible | ${defaultBrand}` };
  }

  const [product, settings] = await Promise.all([
    getCachedProduct(codeNum),
    getCachedSettings(),
  ]);

  const brandName = settings.showroomName || defaultBrand;

  if (!product) {
    return { title: `Pieza ya no disponible | ${brandName}` };
  }

  const formattedCode = formatProductCode(product.code);
  const codePadded = product.code.toString().padStart(3, "0");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mitienda.local";
  const canonicalUrl = `${baseUrl}/p/${codePadded}`;

  const title = `${formattedCode} · ${product.title || "Producto Exclusivo"} | ${brandName}`;
  const description = product.rawText
    ? product.rawText.replace(/\s+/g, " ").trim().slice(0, 160)
    : `${product.title || "Producto seleccionado"} disponible en ${brandName}.`;
  const photoUrl = product.photos?.[0]?.keyFull || product.photos?.[0]?.keyThumb;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: brandName,
      locale: "es_AR",
      type: "website",
      images: photoUrl
        ? [
            {
              url: photoUrl,
              alt: product.title || `Producto ${formattedCode} - ${brandName}`,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: photoUrl ? [photoUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const defaultBrand = process.env.COMMERCE_NAME || "Mi Tienda";
  const resolvedParams = await params;
  const deps = getProductServiceDeps();
  const codeNum = parseProductCode(resolvedParams.code);

  const product = codeNum ? await getCachedProduct(codeNum) : null;

  // BR-09: Si no existe, fue purgada o eliminada, página amable con sugerencias (no 404 seco)
  if (!product) {
    const suggestions = await listProducts(
      {
        status: "AVAILABLE",
        pageSize: 4,
        sortBy: "newest",
      },
      deps
    );

    return (
      <div className="flex-1 bg-[#faf8f5] px-4 py-12 text-[#1c1917] sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#e7e2da] bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f2eb] text-[#926a3c]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-serif text-2xl font-light text-stone-900 sm:text-3xl">
            Esta pieza ya no se encuentra disponible
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-stone-600 sm:text-sm">
            Nuestros productos son piezas únicas y suelen agotarse rápidamente. Te invitamos a descubrir otras opciones disponibles en nuestro showroom:
          </p>

          <div className="mt-6 flex justify-center">
            <Link
              href="/catalogo"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Explorar catálogo completo</span>
            </Link>
          </div>
        </div>

        {/* Sugerencias de productos disponibles */}
        {suggestions.items.length > 0 && (
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="mb-6 flex items-center justify-between border-b border-[#e7e2da] pb-3">
              <h2 className="font-serif text-xl font-light text-stone-900">
                Otras piezas que podrían gustarte
              </h2>
              <Link href="/catalogo" className="text-xs font-medium text-stone-500 hover:text-stone-900">
                Ver todo →
              </Link>
            </div>
            <ProductGrid products={suggestions.items} />
          </div>
        )}
      </div>
    );
  }

  // Resolver categoría, configuración, piezas relacionadas y secciones de navegación visibles
  const [category, settings, visibleSections] = await Promise.all([
    deps.categoryRepo.findById(product.categoryId),
    getCachedSettings(),
    deps.navigationRepo.listSections({ visibleOnly: true }),
  ]);

  const relatedResult = await getCachedRelatedProducts(product, category);

  const brandName = settings.showroomName || defaultBrand;
  const formattedCode = formatProductCode(product.code);
  const codePadded = product.code.toString().padStart(3, "0");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mitienda.local";
  const productUrl = `${baseUrl}/p/${codePadded}`;

  const sizes = parseSizesList(product.size);
  const isSoldOut = product.status === "SOLD_OUT";
  const isReserved = product.status === "RESERVED";

  // Determinar la sección de navegación a la que pertenece el producto para armar las migas de pan
  const matchingSection = visibleSections.find((s) => {
    if (s.ruleType === "ATTRIBUTE" && product.attributes) {
      const targetSlug = (s.ruleConfig.attributeSlug || s.ruleConfig.attributeKey || "para")
        .toLowerCase()
        .trim();
      const targetVal = (s.ruleConfig.attributeValue || "").toLowerCase().trim();
      const rawAttr = product.attributes[targetSlug];
      const attrList = Array.isArray(rawAttr) ? rawAttr : rawAttr ? [rawAttr] : [];
      const productValues = attrList.map((v) => String(v).toLowerCase().trim());
      return targetVal ? productValues.includes(targetVal) : productValues.length > 0;
    }
    if (s.ruleType === "CATEGORY" && product.categoryId) {
      return (s.ruleConfig.categoryIds || []).includes(product.categoryId);
    }
    return false;
  });

  // Datos estructurados Schema.org para Google Rich Snippets y Agentes de IA
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title || `Producto ${formattedCode}`,
    description: product.rawText || `${product.title || "Producto"} - ${brandName}`,
    sku: formattedCode,
    image: (product.photos || []).map((p) => p.keyFull || p.keyThumb).filter(Boolean),
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    category: category?.name || "Catálogo",
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: product.currency || "ARS",
      price: product.priceCents ? (product.priceCents / 100).toFixed(2) : "0",
      availability:
        product.status === "AVAILABLE"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: brandName,
      },
    },
  };

  const breadcrumbElements: Array<{
    "@type": string;
    position: number;
    name: string;
    item: string;
  }> = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: baseUrl,
    },
  ];

  if (matchingSection) {
    breadcrumbElements.push({
      "@type": "ListItem",
      position: breadcrumbElements.length + 1,
      name: matchingSection.name,
      item: `${baseUrl}/${matchingSection.slug}`,
    });
  }

  if (category && category.slug !== "sin-clasificar") {
    breadcrumbElements.push({
      "@type": "ListItem",
      position: breadcrumbElements.length + 1,
      name: category.name,
      item: matchingSection
        ? `${baseUrl}/${matchingSection.slug}?categoria=${category.slug}`
        : `${baseUrl}/catalogo?categoria=${category.slug}`,
    });
  }

  breadcrumbElements.push({
    "@type": "ListItem",
    position: breadcrumbElements.length + 1,
    name: product.title || formattedCode,
    item: productUrl,
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbElements,
  };

  return (
    <div className="flex-1 pb-24 text-[#1c1917]">
      {/* Datos Estructurados JSON-LD para buscadores */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productJsonLd, breadcrumbJsonLd]),
        }}
      />

      {/* Tracking de vista de producto (AR-07, BR-39) */}
      <AnalyticsTracker type="product_view" productId={product.id} />

      {/* Contenedor de la Ficha */}
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:py-8">
        {/* Cabecera superior: Migas de pan y Botón Compartir */}
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Migas de pan"
            className="flex items-center gap-1.5 text-xs text-stone-500 font-medium flex-wrap"
          >
            <Link href="/" className="hover:text-stone-900 transition-colors">
              Inicio
            </Link>
            <span className="text-stone-300">/</span>
            {matchingSection && (
              <>
                <Link
                  href={`/${matchingSection.slug}`}
                  className="hover:text-stone-900 transition-colors"
                >
                  {matchingSection.name}
                </Link>
                <span className="text-stone-300">/</span>
              </>
            )}
            {category && category.slug !== "sin-clasificar" && (
              <>
                <Link
                  href={
                    matchingSection
                      ? `/${matchingSection.slug}?categoria=${category.slug}`
                      : `/catalogo?categoria=${category.slug}`
                  }
                  className="hover:text-stone-900 transition-colors"
                >
                  {category.name}
                </Link>
                <span className="text-stone-300">/</span>
              </>
            )}
            <span className="text-stone-900 font-semibold truncate max-w-[220px]">
              {product.title || formattedCode}
            </span>
          </nav>

          <ShareOutfitButton
            productTitle={product.title || formattedCode}
            productCode={formattedCode}
            brandName={brandName}
          />
        </div>

        <ProductShowcaseClient
          product={product}
          formattedCode={formattedCode}
          sizes={sizes}
          category={category}
          brandName={brandName}
          whatsappNumber={settings.whatsappNumber}
          isReserved={isReserved}
          isSoldOut={isSoldOut}
          ordersPaused={settings.ordersPaused}
          ordersPausedNotice={settings.ordersPausedNotice}
        />

        {/* Sección de recomendaciones */}
        {relatedResult.items.length > 0 && (
          <section
            className="mt-16 sm:mt-20 border-t border-[#e7e2da] pt-10"
            aria-label={
              relatedResult.isComplementary
                ? "Combinaciones recomendadas"
                : "Productos recomendados"
            }
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#926a3c] font-semibold">
                  {relatedResult.isComplementary
                    ? "Shop the Look · Conjunto recomendado"
                    : "Colección recomendada"}
                </span>
                <h2 className="font-serif text-2xl font-light text-stone-900 sm:text-3xl mt-1">
                  {relatedResult.isComplementary
                    ? "Completá tu conjunto"
                    : "También te puede interesar"}
                </h2>
              </div>
              <Link
                href="/catalogo"
                className="text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors"
              >
                Ver todo el catálogo →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
              {relatedResult.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Barra fija inferior en mobile con precio y acción rápida */}
      <aside
        aria-label="Acción de compra rápida móvil"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#e7e2da] px-4 py-3 shadow-lg flex items-center justify-between gap-3"
      >
        <div>
          <span className="block text-[10px] font-mono text-stone-500 uppercase">
            {formattedCode}
          </span>
          <span className="font-serif text-lg font-bold text-stone-900">
            {formatPrice(product.priceCents, product.currency)}
          </span>
        </div>
        <a
          href="#order-section"
          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-stone-800"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>{settings.ordersPaused ? "Ventas pausadas" : "Agregar a la bolsa"}</span>
        </a>
      </aside>
    </div>
  );
}
