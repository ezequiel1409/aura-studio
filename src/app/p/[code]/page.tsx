import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Star, Tag, ShoppingBag } from "lucide-react";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { parseProductCode, formatProductCode } from "../../../domain/product/rules";
import { formatPrice } from "../../../lib/format/currency";
import { parseSizesList, cleanProductDescription } from "../../../lib/parser/product-parser";
import { ProductGallery } from "../../../components/catalog/ProductGallery";
import { ProductOrderSection } from "../../../components/catalog/ProductOrderSection";
import { ProductAccordions } from "../../../components/catalog/ProductAccordions";
import { ProductCard } from "../../../components/catalog/ProductCard";
import { ProductGrid } from "../../../components/catalog/ProductGrid";
import { AnalyticsTracker } from "../../../components/analytics/AnalyticsTracker";
import { CartHeaderButton } from "../../../components/cart/CartHeaderButton";
import { CartDrawer } from "../../../components/cart/CartDrawer";
import { CartToast } from "../../../components/cart/CartToast";
import { listProducts } from "../../../services/product.service";
import { getShowroomSettings } from "../../../services/settings.service";
import { Footer } from "../../../components/layout/Footer";

interface ProductPageProps {
  params: Promise<{
    code: string;
  }>;
}

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
  const [product, settings] = await Promise.all([
    deps.productRepo.findByCode(codeNum),
    getShowroomSettings(deps),
  ]);

  const brandName = settings.showroomName || "Aura Studio";

  if (!product) {
    return { title: `Pieza ya no disponible | ${brandName}` };
  }

  const formattedCode = formatProductCode(product.code);
  const title = `${formattedCode} · ${product.title || "Producto Exclusivo"} | ${brandName}`;
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
            Nuestros productos son piezas únicas y suelen agotarse rápidamente. Te invitamos a descubrir otras opciones disponibles en nuestro showroom:
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

  // Resolver categoría, configuración y piezas relacionadas
  const [category, settings, relatedResult] = await Promise.all([
    deps.categoryRepo.findById(product.categoryId),
    getShowroomSettings(deps),
    listProducts({ pageSize: 6, sortBy: "newest" }, deps),
  ]);

  const whatsappNumber = settings.whatsappNumber;
  const brandName = settings.showroomName || "Aura Studio";

  const formattedCode = formatProductCode(product.code);
  const sizes = parseSizesList(product.size);
  const isSoldOut = product.status === "SOLD_OUT";
  const isReserved = product.status === "RESERVED";

  const relatedProducts = relatedResult.items
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

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
          {/* A la izquierda: Imagen de marca / Logo */}
          <Link
            href="/"
            aria-label={`${brandName} - Inicio del catálogo`}
            className="group flex items-center focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            {settings.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={settings.logoUrl}
                alt={brandName}
                className="h-7 sm:h-8 w-auto max-h-8 max-w-[140px] sm:max-w-[200px] object-contain transition-opacity group-hover:opacity-85"
              />
            ) : (
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-xl tracking-[0.2em] font-normal text-stone-900 uppercase transition-opacity group-hover:opacity-80">
                  {brandName}
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.25em] font-medium text-stone-500 uppercase">
                  Showroom & Archivo
                </span>
              </div>
            )}
          </Link>

          {/* A la derecha: Bolsa de compras y Botón Volver al catálogo */}
          <div className="flex items-center gap-2.5">
            <CartHeaderButton />
            <Link
              href="/"
              prefetch={true}
              aria-label="Volver al catálogo principal"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#e7e2da] bg-white px-4 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver al catálogo</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenedor de la Ficha */}
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:py-8">
        {/* Migas de pan */}
        <nav aria-label="Migas de pan" className="mb-4 sm:mb-6 flex items-center gap-1.5 text-xs text-stone-500 font-medium">
          <Link href="/" className="hover:text-stone-900 transition-colors">
            Inicio
          </Link>
          <span className="text-stone-300">/</span>
          {category && category.slug !== "sin-clasificar" && (
            <>
              <Link href={`/?categoria=${category.slug}`} className="hover:text-stone-900 transition-colors">
                {category.name}
              </Link>
              <span className="text-stone-300">/</span>
            </>
          )}
          <span className="text-stone-900 font-semibold truncate max-w-[220px]">
            {product.title || formattedCode}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-12 items-start">
          {/* Galería de Fotos (Columna Sticky en desktop) */}
          <div className="md:sticky md:top-20 z-10 w-full">
            <ProductGallery
              photos={product.photos || []}
              title={product.title}
              code={formattedCode}
            />
          </div>

          {/* Detalles de la Prenda */}
          <div className="flex flex-col justify-start">
            {/* Cabecera con Código y Estado (un solo mensaje sin redundancias) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md border border-[#e7e2da] bg-white px-2.5 py-1 text-xs font-medium text-stone-500">
                SKU: <strong className="font-mono font-bold text-stone-900">{formattedCode}</strong>
              </span>

              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs font-bold tracking-wider text-amber-900 uppercase">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                  Destacada
                </span>
              )}

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
            </div>

            {/* Título del Producto */}
            <h1 className="mt-4 font-serif text-3xl font-light tracking-wide text-stone-900 sm:text-4xl">
              {product.title || `Producto ${formattedCode}`}
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

            {/* Selector interactivo de colores, talles, cantidad y adición a la bolsa */}
            <ProductOrderSection
              productId={product.id}
              code={product.code}
              formattedCode={formattedCode}
              title={product.title}
              priceCents={product.priceCents}
              currency={product.currency}
              colors={product.colors}
              sizes={sizes}
              whatsappNumber={settings.whatsappNumber}
              brandName={brandName}
              isSoldOut={isSoldOut}
              isReserved={isReserved}
              photoUrl={product.photos?.[0]?.keyThumb || product.photos?.[0]?.keyFull || null}
              showWhatsAppInquiry={true}
            />

            {/* Acordeones estructurados: Detalles, Medidas, Cuidados y Envíos */}
            <ProductAccordions
              rawDescription={cleanProductDescription(product.rawText, product.title)}
              categoryName={category?.name}
            />
          </div>
        </div>

        {/* Sección "Otras piezas exclusivas del showroom" para no terminar en vacío */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 sm:mt-20 border-t border-[#e7e2da] pt-10" aria-label="Otras piezas del showroom">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#926a3c] font-semibold">
                  Curaduría del Showroom
                </span>
                <h2 className="font-serif text-2xl font-light text-stone-900 sm:text-3xl mt-1">
                  Otras piezas que te pueden interesar
                </h2>
              </div>
              <Link href="/" className="text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors">
                Ver todo el archivo →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
              {relatedProducts.map((p) => (
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
          <span className="block text-[10px] font-mono text-stone-500 uppercase">{formattedCode}</span>
          <span className="font-serif text-lg font-bold text-stone-900">
            {formatPrice(product.priceCents, product.currency)}
          </span>
        </div>
        <a
          href="#order-section"
          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-stone-800"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>Agregar a la bolsa</span>
        </a>
      </aside>

      {/* Drawer lateral de Carrito / Bolsa accesible */}
      <CartDrawer
        showroomAddress={settings.address}
        whatsappNumber={settings.whatsappNumber}
        brandName={brandName}
      />

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

      {/* Toast accesible de confirmación de bolsa de compras */}
      <CartToast />
    </div>
  );
}
