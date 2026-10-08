import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Tag } from "lucide-react";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { parseProductCode, formatProductCode } from "../../../domain/product/rules";
import { formatPrice } from "../../../lib/format/currency";
import { parseSizesList } from "../../../lib/parser/product-parser";
import { ProductGallery } from "../../../components/catalog/ProductGallery";
import { ProductOrderSection } from "../../../components/catalog/ProductOrderSection";
import { ProductGrid } from "../../../components/catalog/ProductGrid";
import { AnalyticsTracker } from "../../../components/analytics/AnalyticsTracker";
import { listProducts } from "../../../services/product.service";

interface ProductPageProps {
  params: Promise<{
    code: string;
  }>;
}

export const instant = false;

/**
 * Genera metadatos Open Graph dinámicos para compartir en WhatsApp e Instagram
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const codeNum = parseProductCode(resolvedParams.code);

  if (!codeNum) {
    return { title: "Pieza no disponible | Aura Studio" };
  }

  const deps = getProductServiceDeps();
  const product = await deps.productRepo.findByCode(codeNum);

  if (!product) {
    return { title: "Pieza ya no disponible | Aura Studio" };
  }

  const formattedCode = formatProductCode(product.code);
  const title = `${formattedCode} · ${product.title || "Prenda Exclusiva"} | Aura Studio`;
  const description = product.rawText.slice(0, 140);
  const photoUrl = product.photos?.[0]?.keyFull || product.photos?.[0]?.keyThumb;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: photoUrl ? [{ url: photoUrl }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const deps = getProductServiceDeps();
  const codeNum = parseProductCode(resolvedParams.code);

  const product = codeNum ? await deps.productRepo.findByCode(codeNum) : null;

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
      <div className="min-h-screen bg-[#faf8f5] px-4 py-16 text-[#1c1917] sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#e7e2da] bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f2eb] text-[#926a3c]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-serif text-2xl font-light text-stone-900 sm:text-3xl">
            Esta pieza ya no se encuentra disponible
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-stone-600 sm:text-sm">
            Nuestras prendas son piezas únicas y suelen agotarse rápidamente. Te invitamos a descubrir otras opciones disponibles en nuestro showroom:
          </p>

          <div className="mt-6 flex justify-center">
            <Link
              href="/"
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
              <Link href="/" className="text-xs font-medium text-stone-500 hover:text-stone-900">
                Ver todo →
              </Link>
            </div>
            <ProductGrid products={suggestions.items} />
          </div>
        )}
      </div>
    );
  }

  // Resolver categoría del producto
  const category = await deps.categoryRepo.findById(product.categoryId);

  // Configuración de WhatsApp y Marca (BR-35)
  const whatsappNumber =
    (await deps.settingsRepo?.get("whatsapp_number")) || "+5491100000000";
  const brandName =
    (await deps.settingsRepo?.get("brand_name")) || "Aura Studio";

  const formattedCode = formatProductCode(product.code);
  const sizes = parseSizesList(product.size);
  const isSoldOut = product.status === "SOLD_OUT";
  const isReserved = product.status === "RESERVED";

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-24 text-[#1c1917]">
      {/* Tracking de vista de producto (AR-07, BR-39) */}
      <AnalyticsTracker type="product_view" productId={product.id} />

      {/* Barra superior de navegación */}
      <header
        role="navigation"
        aria-label="Navegación de retorno"
        className="sticky top-0 z-40 border-b border-[#e7e2da] bg-[#faf8f5]/90 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            aria-label="Volver al catálogo principal"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#e7e2da] bg-white px-4 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver al catálogo</span>
          </Link>

          <span className="font-mono text-xs font-semibold tracking-wider text-stone-900">
            {formattedCode}
          </span>
        </div>
      </header>

      {/* Contenedor de la Ficha */}
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-12 items-start">
          {/* Galería de Fotos */}
          <div className="md:sticky md:top-20">
            <ProductGallery
              photos={product.photos || []}
              title={product.title}
              code={formattedCode}
            />
          </div>

          {/* Detalles de la Prenda */}
          <div className="flex flex-col justify-start">
            {/* Cabecera con Código y Estado */}
            <div className="flex items-center gap-2.5">
              <span className="rounded-md border border-[#e7e2da] bg-white px-2.5 py-1 font-mono text-xs font-semibold text-stone-900">
                {formattedCode}
              </span>

              {isReserved && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold tracking-wider text-amber-900 uppercase">
                  Reservada
                </span>
              )}

              {isSoldOut && (
                <span className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-bold tracking-wider text-stone-800 uppercase">
                  Agotada
                </span>
              )}

              {!isReserved && !isSoldOut && (
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wider text-emerald-900 uppercase">
                  Disponible
                </span>
              )}
            </div>

            {/* Título de la Prenda */}
            <h1 className="mt-4 font-serif text-3xl font-light tracking-wide text-stone-900 sm:text-4xl">
              {product.title || `Prenda ${formattedCode}`}
            </h1>

            {/* Precio destacado */}
            <div className="mt-3.5">
              <span className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
                {formatPrice(product.priceCents, product.currency)}
              </span>
            </div>

            {/* Categoría si aplica */}
            {category && category.slug !== "sin-clasificar" && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-600">
                <Tag className="h-3.5 w-3.5 text-stone-400" />
                <span className="font-medium text-stone-700">{category.name}</span>
              </div>
            )}

            {/* Selector interactivo de colores, talles y conversión directa a WhatsApp (BR-13, BR-14, BR-20) */}
            <ProductOrderSection
              productId={product.id}
              code={product.code}
              formattedCode={formattedCode}
              title={product.title}
              priceCents={product.priceCents}
              currency={product.currency}
              colors={product.colors}
              sizes={sizes}
              whatsappNumber={whatsappNumber}
              brandName={brandName}
              isSoldOut={isSoldOut}
              isReserved={isReserved}
            />

            {/* Descripción y Texto Original (BR-05, BR-06) */}
            <div className="mt-8 border-t border-[#e7e2da] pt-6">
              <h2 className="font-serif text-sm font-medium tracking-widest text-stone-900 uppercase">
                Descripción & Detalles de la pieza
              </h2>
              <div className="mt-3 whitespace-pre-line text-xs leading-relaxed text-stone-700 sm:text-sm">
                {product.rawText}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
