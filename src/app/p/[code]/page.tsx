import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Tag } from "lucide-react";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { parseProductCode, formatProductCode } from "../../../domain/product/rules";
import { formatPrice } from "../../../lib/format/currency";
import { WhatsAppPaymentAdapter } from "../../../infra/payments/whatsapp.adapter";
import { ProductGallery } from "../../../components/catalog/ProductGallery";
import { WhatsAppButton } from "../../../components/catalog/WhatsAppButton";
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
      <div className="min-h-screen bg-stone-50/50 px-4 py-12 text-stone-900 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-200/80 text-stone-600">
            <Sparkles className="h-6 w-6 text-amber-700" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-light text-stone-900 sm:text-3xl">
            Esta pieza ya no se encuentra disponible
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs text-stone-500 sm:text-sm">
            Nuestras prendas son piezas únicas y suelen agotarse rápido. Pero seleccionamos otras piezas disponibles que podrían interesarte:
          </p>

          <div className="mt-6 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-medium text-white transition-colors hover:bg-stone-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Ver todo el catálogo</span>
            </Link>
          </div>
        </div>

        {/* Sugerencias de productos disponibles */}
        {suggestions.items.length > 0 && (
          <div className="mx-auto mt-16 max-w-5xl">
            <h2 className="mb-6 font-serif text-lg font-medium text-stone-800">
              Otras piezas que podrían gustarte
            </h2>
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

  // Generar acción de pago/reserva mediante WhatsAppPaymentAdapter (BR-13, BR-14)
  const formattedCode = formatProductCode(product.code);
  const paymentAdapter = new WhatsAppPaymentAdapter({
    whatsappNumber,
    brandName,
  });

  const paymentAction = paymentAdapter.createPaymentAction({
    code: product.code,
    formattedCode,
    title: product.title,
    priceCents: product.priceCents,
    currency: product.currency,
  });

  const isSoldOut = product.status === "SOLD_OUT";
  const isReserved = product.status === "RESERVED";

  return (
    <div className="min-h-screen bg-stone-50/50 pb-24 text-stone-900">
      {/* Tracking de vista de producto (AR-07, BR-39) */}
      <AnalyticsTracker type="product_view" productId={product.id} />

      {/* Barra superior de navegación */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-stone-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al catálogo</span>
          </Link>
          <span className="font-mono text-xs font-semibold text-stone-700">
            {formattedCode}
          </span>
        </div>
      </header>

      {/* Contenedor de la Ficha */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          {/* Galería de Fotos */}
          <div>
            <ProductGallery
              photos={product.photos || []}
              title={product.title}
              code={formattedCode}
            />
          </div>

          {/* Detalles del Producto */}
          <div className="flex flex-col">
            {/* Código y Estado */}
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-stone-200 px-2.5 py-1 font-mono text-xs font-semibold text-stone-800">
                {formattedCode}
              </span>

              {isReserved && (
                <span className="rounded-full bg-amber-500/90 px-3 py-0.5 text-xs font-semibold tracking-wider text-white uppercase shadow-sm">
                  Reservada
                </span>
              )}

              {isSoldOut && (
                <span className="rounded-full bg-stone-900/80 px-3 py-0.5 text-xs font-semibold tracking-wider text-white uppercase shadow-sm">
                  Agotada
                </span>
              )}

              {!isReserved && !isSoldOut && (
                <span className="rounded-full bg-emerald-700/10 px-3 py-0.5 text-xs font-semibold tracking-wider text-emerald-800 uppercase">
                  Disponible
                </span>
              )}
            </div>

            {/* Título */}
            <h1 className="mt-3 font-serif text-2xl font-light tracking-wide text-stone-900 sm:text-3xl">
              {product.title || `Prenda ${formattedCode}`}
            </h1>

            {/* Precio (BR-20, BR-23) */}
            <div className="mt-3">
              <span className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
                {formatPrice(product.priceCents, product.currency)}
              </span>
            </div>

            {/* Badges de Talle y Categoría */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {product.size && (
                <div className="flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-800">
                  <span>Talle:</span>
                  <span className="font-bold">{product.size}</span>
                </div>
              )}
              {category && category.slug !== "sin-clasificar" && (
                <div className="flex items-center gap-1 rounded-lg bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                  <Tag className="h-3.5 w-3.5 text-stone-400" />
                  <span>{category.name}</span>
                </div>
              )}
            </div>

            {/* Botón de WhatsApp para Mobile/Desktop (BR-13, 14, 39) */}
            <div className="mt-6">
              <WhatsAppButton
                productId={product.id}
                url={paymentAction.url}
                label={isSoldOut ? "Pieza Agotada" : paymentAction.label}
                disabled={isSoldOut}
              />
              <p className="mt-2 text-center text-[11px] text-stone-500">
                Atención personalizada · Consultas y reservas directas
              </p>
            </div>

            {/* Descripción y Texto Crudo Original (BR-05, BR-06) */}
            <div className="mt-8 border-t border-stone-200/80 pt-6">
              <h2 className="font-serif text-sm font-medium tracking-wider text-stone-900 uppercase">
                Descripción & Detalles
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
