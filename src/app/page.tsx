// Revalida en segundo plano cada 60 segundos (Edge ISR - Cloudflare CDN)
export const revalidate = 60;

import { getProductServiceDeps } from "../infra/db/connection";
import { listProducts } from "../services/product.service";
import { getShowroomSettings } from "../services/settings.service";
import { NavigationService } from "../services/navigation.service";
import { PromotionService } from "../services/promotion.service";
import { NewPiecesAlertSection } from "../components/catalog/NewPiecesAlertSection";
import { HeroBannerCarousel } from "../components/home/HeroBannerCarousel";
import { BankPromosBlock } from "../components/home/BankPromosBlock";
import { FeaturedSectionsMosaic } from "../components/home/FeaturedSectionsMosaic";
import {
  FeaturedProductsBlock,
  NewArrivalsBlock,
  SaleBlock,
  TrustStripBlock,
} from "../components/home/HomeShowcaseBlocks";

const ONE_HOUR_MS = 60 * 60 * 1000;

function getHourlyAlignedPastMs(days: number): number {
  return (
    Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / ONE_HOUR_MS) *
    ONE_HOUR_MS
  );
}

export default async function HomePage() {
  const deps = getProductServiceDeps();
  const navService = new NavigationService({
    navigationRepo: deps.navigationRepo,
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
  });
  const promotionService = new PromotionService(deps.promotionRepo);

  const thirtyDaysAgoMs = getHourlyAlignedPastMs(30);

  const [
    settings,
    publicSections,
    homeSections,
    activeBanners,
    activePromotions,
    newArrivalsResult,
    featuredResult,
    saleResult,
  ] = await Promise.all([
    getShowroomSettings(deps),
    navService.listPublicNavigationSections(),
    navService.listHomeSections(),
    promotionService.listActiveHomeBanners(),
    promotionService.listActivePublicPromotions(),
    listProducts(
      {
        publishedAfter: thirtyDaysAgoMs,
        onlyAvailable: true,
        sortBy: "newest",
        pageSize: 8,
      },
      deps
    ),
    listProducts(
      {
        isFeatured: true,
        onlyAvailable: true,
        sortBy: "featured",
        pageSize: 8,
      },
      deps
    ),
    listProducts(
      {
        onlyOnSale: true,
        onlyAvailable: true,
        sortBy: "featured",
        pageSize: 4,
      },
      deps
    ),
  ]);

  const defaultBrand = process.env.COMMERCE_NAME || "Mi Tienda";
  const brandName = settings.showroomName || defaultBrand;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mitienda.local";

  const paymentLabels = [
    ...(settings.mercadopagoEnabled ? ["Mercado Pago", "Tarjeta de Crédito"] : []),
    ...(settings.transferEnabled ? ["Transferencia Bancaria"] : []),
    ...(settings.cashEnabled ? ["Efectivo"] : []),
  ];

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: brandName,
    description:
      settings.aboutText ||
      settings.businessDescriptor ||
      "Catálogo online con piezas seleccionadas y reserva directa.",
    url: baseUrl,
    ...(settings.logoUrl ? { logo: settings.logoUrl } : {}),
    priceRange: "$$",
    currenciesAccepted: "ARS",
    ...(paymentLabels.length > 0 ? { paymentAccepted: paymentLabels.join(", ") } : {}),
    ...(settings.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
            addressCountry: "AR",
          },
        }
      : {}),
    ...(settings.whatsappNumber
      ? {
          telephone: settings.whatsappNumber,
        }
      : {}),
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/catalogo?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const rawBlocks = Array.isArray(settings.homeBlocks)
    ? settings.homeBlocks
    : settings.homeBlocks?.blocks || [];
  const orderedBlocks = [...rawBlocks]
    .filter((b) => b.enabled)
    .sort((a, b) => a.position - b.position);

  return (
    <>
      {/* Datos Estructurados JSON-LD (Schema.org Store) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />

      {/* Vidriera por bloques ordenables desde el backoffice */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 pt-3 pb-8 sm:px-6 sm:pt-4 sm:pb-12 space-y-8 sm:space-y-12">
        {orderedBlocks.map((block) => {
          switch (block.id) {
            case "hero":
            case "hero_banner":
              return (
                <HeroBannerCarousel
                  key={block.id}
                  banners={activeBanners}
                  fallbackTitle={settings.heroTitle}
                  fallbackSubtitle={settings.heroSubtitle}
                  fallbackBannerUrl={settings.heroBannerUrl}
                  brandName={brandName}
                />
              );

            case "bank_promos":
            case "bank_promotions":
              return (
                <BankPromosBlock
                  key={block.id}
                  promotions={activePromotions}
                />
              );

            case "featured_sections":
              return (
                <FeaturedSectionsMosaic
                  key={block.id}
                  sections={homeSections}
                />
              );

            case "new_arrivals":
              return (
                <NewArrivalsBlock
                  key={block.id}
                  products={newArrivalsResult.items}
                  sectionHref={
                    publicSections.some((s) => s.slug === "recien-llegados")
                      ? "/recien-llegados"
                      : "/catalogo?orden=recien-llegados"
                  }
                />
              );

            case "featured_products":
              return (
                <FeaturedProductsBlock
                  key={block.id}
                  products={featuredResult.items}
                />
              );

            case "sale":
            case "sale_block":
              return (
                <SaleBlock
                  key={block.id}
                  products={saleResult.items}
                  sectionHref={
                    publicSections.some((s) => s.slug === "sale")
                      ? "/sale"
                      : "/catalogo?oferta=1"
                  }
                />
              );

            case "trust":
            case "trust_bar":
              return <TrustStripBlock key={block.id} />;

            case "drops":
            case "drops_newsletter":
              return <NewPiecesAlertSection key={block.id} />;

            default:
              return null;
          }
        })}
      </main>
    </>
  );
}
