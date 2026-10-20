import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Landmark,
  ShoppingBag,
} from "lucide-react";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { NavigationService } from "../../../services/navigation.service";
import { PromotionService } from "../../../services/promotion.service";
import { getShowroomSettings } from "../../../services/settings.service";
import { formatPriceARS } from "../../../lib/format/currency";
import { Header } from "../../../components/layout/Header";
import { Footer } from "../../../components/layout/Footer";
import { CartDrawer } from "../../../components/cart/CartDrawer";
import { CartToast } from "../../../components/cart/CartToast";
import { StoreThemeStyles } from "../../../components/theme/StoreThemeStyles";

interface PromotionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PromotionDetailPage({
  params,
}: PromotionDetailPageProps) {
  const { slug } = await params;
  const deps = getProductServiceDeps();

  const promotionService = new PromotionService(deps.promotionRepo);
  const navService = new NavigationService({
    navigationRepo: deps.navigationRepo,
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
  });

  const [promo, settings, categories, publicSections] = await Promise.all([
    promotionService.findPublicPromotionBySlug(slug),
    getShowroomSettings(deps),
    deps.categoryRepo.listAll(),
    navService.listPublicNavigationSections(),
  ]);

  if (!promo) {
    notFound();
  }

  const brandName = settings.showroomName || "Aura Studio";
  const bankName =
    promo.bank?.name ||
    (promo.promoType === "STORE" ? "Beneficio Propio" : "Entidad adherida");
  const badgeColor = promo.bank?.accentColor || "#292524";
  const startFormatted = new Date(promo.startsAt).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const endFormatted = new Date(promo.endsAt).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const howToSteps =
    promo.howToUseSteps && promo.howToUseSteps.length > 0
      ? promo.howToUseSteps
      : [
          "Elegí tus prendas favoritas en nuestro catálogo y agregalas a la bolsa.",
          "Al confirmar tu pedido, indicanos que abonás con la tarjeta o billetera incluida en la promoción.",
          promo.modality === "INSTANT"
            ? "El descuento se aplica en el acto al momento del cobro."
            : "Abonás con los medios adheridos y el banco acredita el reintegro según sus plazos.",
        ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col">
      <StoreThemeStyles
        paletteId={settings.themePalette}
        primaryColor={settings.themePrimaryColor}
        fontId={settings.themeFont}
      />

      <Header
        brandName={brandName}
        logoUrl={settings.logoUrl}
        sections={publicSections}
        categories={categories}
        announcementBar={settings.announcementBar}
      />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        {/* Volver a todas las promociones */}
        <Link
          href="/promociones"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Volver a todas las promociones</span>
        </Link>

        {/* 1. Encabezado con logo/nombre del banco, beneficio principal y vigencia */}
        <section className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: badgeColor }}
            >
              <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{bankName}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d2c7] bg-[#faf8f5] px-3 py-1 text-xs font-medium text-stone-700">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                Vigencia: {startFormatted} al {endFormatted}
              </span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-wide text-stone-900">
              {promo.benefitShort}
            </h1>
            <p className="text-sm sm:text-base text-stone-600">{promo.title}</p>
          </div>

          {/* 2. Resumen claro: días, tarjetas/billeteras, tope, compra mínima y modalidad */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 rounded-2xl border border-[#e7e2da] bg-[#faf8f5] p-5 text-xs">
            <div className="space-y-1">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Días que aplica
              </dt>
              <dd className="text-sm font-semibold text-stone-900">
                {promo.daysOfWeek.join(", ")}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Tarjetas y billeteras incluidas
              </dt>
              <dd className="text-sm font-semibold text-stone-900">
                {promo.paymentMethods.join(", ")}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Tope de reintegro
              </dt>
              <dd className="text-sm font-semibold text-stone-900">
                {promo.capCents !== null
                  ? formatPriceARS(promo.capCents)
                  : "Sin tope de reintegro"}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Compra mínima
              </dt>
              <dd className="text-sm font-semibold text-stone-900">
                {promo.minPurchaseCents !== null && promo.minPurchaseCents > 0
                  ? formatPriceARS(promo.minPurchaseCents)
                  : "Sin mínimo de compra"}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Aplicación del beneficio
              </dt>
              <dd className="text-sm font-semibold text-stone-900">
                {promo.modality === "INSTANT"
                  ? "Descuento en el acto"
                  : "Por reintegro del banco"}
              </dd>
            </div>

            {(promo.cftPercent || promo.tnaPercent) && (
              <div className="space-y-1">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Financiación (CFT / TNA)
                </dt>
                <dd className="text-sm font-mono font-semibold text-stone-900">
                  CFT: {promo.cftPercent || "0,00%"} · TNA:{" "}
                  {promo.tnaPercent || "0,00%"}
                </dd>
              </div>
            )}
          </dl>

          {/* 3. Cómo aprovecharla en pasos cortos */}
          <div className="space-y-3 pt-2">
            <h2 className="font-serif text-lg font-medium text-stone-900">
              Cómo aprovechar esta promoción
            </h2>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {howToSteps.map((step, i) => (
                <li
                  key={i}
                  className="rounded-2xl border border-[#e7e2da] bg-white p-4 space-y-1.5"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-xs font-mono font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* 5. Botón "Ir a comprar" al catálogo */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-[#f0ece1]">
            <Link
              href="/catalogo"
              className="min-h-[44px] inline-flex items-center gap-2 rounded-full bg-stone-900 hover:bg-stone-800 px-8 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-all focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span>Ir a comprar</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            {promo.officialUrl && (
              <a
                href={promo.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 underline underline-offset-4"
              >
                <span>Ver bases oficiales en {bankName}</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </section>

        {/* 4. Términos y condiciones completos (texto visible, no imagen) */}
        <section
          aria-labelledby="promo-terms-heading"
          className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-[#e7e2da] pb-3">
            <FileText className="h-4 w-4 text-stone-700" aria-hidden="true" />
            <h2
              id="promo-terms-heading"
              className="font-serif text-xl font-medium text-stone-900"
            >
              Términos y condiciones legales
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700 bg-[#faf8f5] rounded-2xl p-4 border border-[#e7e2da]">
            {promo.organizer && (
              <div>
                <span className="font-bold text-stone-900">Organizador: </span>
                <span>{promo.organizer}</span>
              </div>
            )}
            {promo.portfolio && (
              <div>
                <span className="font-bold text-stone-900">Cartera: </span>
                <span>{promo.portfolio}</span>
              </div>
            )}
            {promo.cftPercent && (
              <div>
                <span className="font-bold text-stone-900">
                  Costo Financiero Total (CFT):{" "}
                </span>
                <span className="font-mono font-bold">{promo.cftPercent}</span>
              </div>
            )}
            {promo.tnaPercent && (
              <div>
                <span className="font-bold text-stone-900">
                  Tasa Nominal Anual (TNA):{" "}
                </span>
                <span className="font-mono font-bold">{promo.tnaPercent}</span>
              </div>
            )}
            {promo.combinableWith && (
              <div className="sm:col-span-2">
                <span className="font-bold text-stone-900">
                  Acumulabilidad:{" "}
                </span>
                <span>{promo.combinableWith}</span>
              </div>
            )}
            {promo.exclusions && (
              <div className="sm:col-span-2">
                <span className="font-bold text-stone-900">Exclusiones: </span>
                <span>{promo.exclusions}</span>
              </div>
            )}
          </div>

          <div className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
            {promo.termsAndConditions}
          </div>
        </section>
      </main>

      <CartDrawer
        showroomAddress={settings.address}
        whatsappNumber={settings.whatsappNumber}
        brandName={brandName}
      />

      <Footer
        brandName={brandName}
        logoUrl={settings.logoUrl}
        whatsappNumber={settings.whatsappNumber}
        instagramHandle={settings.instagramHandle}
        tiktokHandle={settings.tiktokHandle}
        address={settings.address}
        dataFiscalUrl={settings.dataFiscalUrl}
        sections={publicSections}
        storeLocation={settings.storeLocation}
        storeSchedule={settings.storeSchedule}
      />

      <CartToast />
    </div>
  );
}

