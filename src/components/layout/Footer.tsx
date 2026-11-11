import Link from "next/link";
import {
  Clock,
  ExternalLink,
  Landmark,
  MapPin,
  PackageCheck,
  RotateCcw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { InstagramIcon, TikTokIcon, WhatsAppLogo } from "../icons/SocialIcons";
import { BrandLogo } from "./BrandLogo";
import { NavigationSection } from "../../domain/navigation/types";
import {
  FooterConfig,
  DEFAULT_FOOTER_CONFIG,
} from "../../services/settings.service";
import {
  buildGoogleMapsSearchUrl,
  computeStoreOpenStatus,
  DEFAULT_STORE_LOCATION,
  DEFAULT_STORE_SCHEDULE,
  formatStoreScheduleSummary,
  StoreLocationConfig,
  StoreScheduleConfig,
} from "../../lib/schedule/store-schedule";

export interface FooterProps {
  brandName?: string;
  businessDescriptor?: string | null;
  aboutText?: string | null;
  logoUrl?: string | null;
  whatsappNumber?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  address?: string | null;
  dataFiscalUrl?: string | null;
  variant?: "default" | "minimal";
  sections?: NavigationSection[];
  storeLocation?: StoreLocationConfig | null;
  storeSchedule?: StoreScheduleConfig | null;
  bankPromotionsEnabled?: boolean;
  footerConfig?: FooterConfig | null;
  mercadopagoEnabled?: boolean;
  transferEnabled?: boolean;
  cashEnabled?: boolean;
}

export function Footer({
  brandName = "Aura Studio",
  businessDescriptor,
  aboutText,
  logoUrl,
  whatsappNumber,
  instagramHandle,
  tiktokHandle,
  address,
  dataFiscalUrl,
  variant = "default",
  sections = [],
  storeLocation,
  storeSchedule,
  bankPromotionsEnabled = true,
  footerConfig,
  mercadopagoEnabled = false,
  transferEnabled = true,
  cashEnabled = true,
}: FooterProps) {
  const showBankPromos = bankPromotionsEnabled !== false;
  const showDataFiscal = dataFiscalUrl === undefined || Boolean(dataFiscalUrl && dataFiscalUrl.trim());
  const cleanPhone = whatsappNumber
    ? whatsappNumber.replace(/[^0-9]/g, "")
    : null;
  const whatsappHref = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

  const cleanInstagram = instagramHandle
    ? instagramHandle
        .trim()
        .replace(/^@/, "")
        .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
        .replace(/\/$/, "")
    : null;
  const instagramHref = cleanInstagram
    ? `https://instagram.com/${cleanInstagram}`
    : null;

  const cleanTiktok = tiktokHandle
    ? tiktokHandle
        .trim()
        .replace(/^@/, "")
        .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, "")
        .replace(/\/$/, "")
    : null;
  const tiktokHref = cleanTiktok ? `https://tiktok.com/@${cleanTiktok}` : null;

  const resolvedLocation: StoreLocationConfig = {
    ...DEFAULT_STORE_LOCATION,
    ...(storeLocation || {}),
    streetAddress:
      storeLocation?.streetAddress || address || DEFAULT_STORE_LOCATION.streetAddress,
  };
  const resolvedSchedule: StoreScheduleConfig = {
    ...DEFAULT_STORE_SCHEDULE,
    ...(storeSchedule || {}),
    openingHours: Array.isArray(storeSchedule?.openingHours)
      ? storeSchedule.openingHours
      : DEFAULT_STORE_SCHEDULE.openingHours,
  };

  const openStatus = computeStoreOpenStatus(resolvedSchedule);
  const mapsUrl = buildGoogleMapsSearchUrl(resolvedLocation);
  const scheduleSummary = formatStoreScheduleSummary(
    resolvedSchedule,
    resolvedLocation
  );

  // Variante mínima (para checkout y carrito)
  if (variant === "minimal") {
    return (
      <footer
        role="contentinfo"
        aria-label="Pie de página simplificado"
        className="mt-12 border-t border-[#e7e2da] bg-white py-6 text-center text-xs text-stone-500"
      >
        <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-serif text-sm tracking-wider uppercase text-stone-800">
            {brandName}
          </p>
          <div className="flex items-center gap-4 text-xs">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 font-medium"
              >
                <WhatsAppLogo className="h-3.5 w-3.5 text-emerald-600" />
                <span>Ayuda por WhatsApp</span>
              </a>
            )}
            <span className="text-stone-300">·</span>
            <span>Compra protegida</span>
          </div>
          <p className="text-[11px] text-stone-400">
            © {new Date().getFullYear()} {brandName} · Creado por{" "}
            <strong className="font-medium text-stone-600">Altum</strong>
          </p>
        </div>
      </footer>
    );
  }

  const cfg = footerConfig || DEFAULT_FOOTER_CONFIG;
  const colSec = cfg.sections?.collections || DEFAULT_FOOTER_CONFIG.sections.collections;
  const helpSec = cfg.sections?.help || DEFAULT_FOOTER_CONFIG.sections.help;
  const locSec = cfg.sections?.location || DEFAULT_FOOTER_CONFIG.sections.location;
  const paySec = cfg.sections?.payments || DEFAULT_FOOTER_CONFIG.sections.payments;
  const bottomLegal = cfg.bottomLegal || DEFAULT_FOOTER_CONFIG.bottomLegal;

  const navLinks =
    sections && sections.length > 0
      ? sections.filter((s) => s.isVisible)
      : [
          { name: "MUJER", slug: "mujer" },
          { name: "HOMBRE", slug: "hombre" },
          { name: "RECIÉN LLEGADOS", slug: "recien-llegados" },
          { name: "SALE", slug: "sale" },
        ];

  // Datos estructurados JSON-LD para buscadores (LocalBusiness / Store)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: brandName,
    telephone: whatsappNumber || undefined,
    address: resolvedLocation.attendsPublic
      ? {
          "@type": "PostalAddress",
          streetAddress: resolvedLocation.streetAddress,
          addressLocality: resolvedLocation.locality,
          addressRegion: resolvedLocation.province,
          postalCode: resolvedLocation.postalCode,
          addressCountry: "AR",
        }
      : {
          "@type": "PostalAddress",
          postalCode: resolvedLocation.postalCode,
          addressCountry: "AR",
        },
    hasMap: resolvedLocation.attendsPublic ? mapsUrl : undefined,
  };

  return (
    <footer
      role="contentinfo"
      aria-label="Información de contacto, horarios y pie de página"
      className="mt-16 sm:mt-20 border-t border-[#e7e2da] bg-white pt-12 pb-8 text-xs text-stone-600 transition-colors"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Estructura en 4 Columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-10 border-b border-[#f0ece1]">
          {/* Columna 1: Marca y Contacto */}
          <div className="space-y-3.5">
            {logoUrl ? (
              <BrandLogo src={logoUrl} alt={brandName} className="h-16 w-16" />
            ) : (
              <div>
                {businessDescriptor && businessDescriptor.trim() && (
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c] block">
                    {businessDescriptor.trim()}
                  </span>
                )}
                <h3 className="font-serif text-xl font-normal text-stone-900 tracking-wider uppercase mt-0.5">
                  {brandName}
                </h3>
              </div>
            )}

            {aboutText && aboutText.trim() && (
              <p className="text-xs text-stone-600 leading-relaxed">
                {aboutText.trim()}
              </p>
            )}

            {/* Redes sociales y WhatsApp en la misma fila con iconos accesibles */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Contactar por WhatsApp al ${whatsappNumber || ""}`}
                  title={`WhatsApp: ${whatsappNumber}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#155e42] hover:bg-[#0f4631] text-white transition-all shadow-2xs hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#155e42]"
                >
                  <WhatsAppLogo className="h-4 w-4 text-white" />
                </a>
              )}

              {instagramHref && (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Seguir en Instagram a @${cleanInstagram}`}
                  title={`Instagram: @${cleanInstagram}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8d2c7] bg-white text-stone-700 hover:text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-transparent transition-all shadow-2xs hover:scale-105"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              )}

              {tiktokHref && (
                <a
                  href={tiktokHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Seguir en TikTok a @${cleanTiktok}`}
                  title={`TikTok: @${cleanTiktok}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8d2c7] bg-white text-stone-700 hover:text-white hover:bg-stone-950 hover:border-stone-950 transition-all shadow-2xs hover:scale-105"
                >
                  <TikTokIcon className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="pt-2 space-y-1 text-[11px] text-stone-500">
              <p className="flex items-center gap-1.5 font-medium text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Stock en tiempo real y reservas garantizadas</span>
              </p>
              <p>
                Tienda online operada por <strong className="font-medium text-stone-700">Altum</strong>
              </p>
            </div>
          </div>

          {/* Columna 2: Secciones / Colecciones configurables */}
          {colSec.enabled && (
            <div className="space-y-3">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
                {colSec.subtitle}
              </span>
              <h3 className="font-serif text-lg font-normal text-stone-900 tracking-wide">
                {colSec.title}
              </h3>

              <ul className="space-y-2 text-stone-600 list-none p-0 m-0">
                {navLinks.map((sec) => (
                  <li key={sec.slug}>
                    <Link
                      href={`/${sec.slug}`}
                      className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors font-medium"
                    >
                      {sec.name}
                    </Link>
                  </li>
                ))}
                {colSec.customLinks?.filter((l) => l.enabled).map((link) => (
                  <li key={link.id}>
                    {link.isExternal ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors font-medium"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors font-medium"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
                {colSec.showAllCatalogLink && (
                  <li>
                    <Link
                      href="/catalogo"
                      className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors"
                    >
                      {colSec.allCatalogLabel || "Ver todo el catálogo"}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Columna 3: Ayuda al cliente y Promociones Bancarias configurables */}
          {helpSec.enabled && (
            <div className="space-y-3">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
                {helpSec.subtitle}
              </span>
              <h3 className="font-serif text-lg font-normal text-stone-900 tracking-wide">
                {helpSec.title}
              </h3>

              <ul className="space-y-2 text-stone-600 list-none p-0 m-0">
                {helpSec.links.filter((l) => l.enabled).map((item) => {
                  if (item.id === "promociones") {
                    if (!showBankPromos) return null;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-1.5 font-semibold text-stone-900 hover:underline underline-offset-4"
                        >
                          <Landmark className="h-3.5 w-3.5 text-stone-700" aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  }

                  if (item.id === "medios-pago") {
                    return (
                      <li key={item.id}>
                        <span>{item.label}</span>
                      </li>
                    );
                  }

                  if (item.isExternal) {
                    return (
                      <li key={item.id}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors"
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Columna 4: Local, Google Maps y Horarios de Atención y Retiro (ADM-07) / Medios de Pago */}
          {(locSec.enabled || paySec.enabled) && (
            <div className="space-y-3">
              {locSec.enabled && (
                <>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
                    {locSec.subtitle || "Ubicación y Horarios"}
                  </span>
                  <h3 className="font-serif text-lg font-normal text-stone-900 tracking-wide">
                    {locSec.title || "Local y retiro"}
                  </h3>

                  {resolvedLocation.attendsPublic ? (
                    <div className="space-y-2">
                      <p className="flex items-start gap-2 text-stone-800 font-medium">
                        <MapPin
                          className="h-4 w-4 text-stone-500 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>
                          {resolvedLocation.streetAddress}
                          {resolvedLocation.locality
                            ? `, ${resolvedLocation.locality}`
                            : ""}
                          {resolvedLocation.province
                            ? `, ${resolvedLocation.province}`
                            : ""}
                        </span>
                      </p>

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d2c7] bg-[#faf8f5] px-3 py-1 text-[11px] font-semibold text-stone-900 hover:border-stone-900 hover:bg-stone-100 transition-colors"
                      >
                        <MapPin className="h-3 w-3 text-stone-700" aria-hidden="true" />
                        <span>Ver en Google Maps</span>
                        <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
                      </a>
                    </div>
                  ) : (
                    <p className="flex items-start gap-2 text-stone-600">
                      <MapPin
                        className="h-4 w-4 text-stone-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>
                        Tienda online con envíos desde CP{" "}
                        {resolvedLocation.postalCode || "C1414"} (
                        {resolvedLocation.province || "Buenos Aires"}).
                      </span>
                    </p>
                  )}

                  {resolvedLocation.attendsPublic && (
                    <>
                      {/* Estado en vivo (Abierto ahora / Cerrado) */}
                      <div className="pt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                            openStatus.isOpen
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                              : "bg-stone-100 text-stone-700 border-stone-300"
                          }`}
                        >
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          <span>{openStatus.badgeText}</span>
                        </span>
                      </div>

                      {/* Horarios de atención y retiros agrupados (ADM-07) */}
                      <div
                        aria-label="Horarios de atención por día de la semana"
                        className="pt-1 space-y-1 text-[11px]"
                      >
                        {scheduleSummary.attendanceLines.map((line, idx) => (
                          <p key={`att-${idx}`} className="font-medium text-stone-800">
                            {line}
                          </p>
                        ))}
                        {scheduleSummary.pickupLines.map((line, idx) => (
                          <p
                            key={`pick-${idx}`}
                            className="font-medium text-stone-700 flex items-center gap-1.5 pt-0.5"
                          >
                            <PackageCheck
                              className="h-3.5 w-3.5 text-stone-500 shrink-0"
                              aria-hidden="true"
                            />
                            <span>{line}</span>
                          </p>
                        ))}
                      </div>

                      {resolvedSchedule.note && (
                        <p className="text-[11px] text-stone-500 italic">
                          {resolvedSchedule.note}
                        </p>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Medios de Pago Dinámicos y Configurables */}
              {paySec.enabled && (
                <div
                  className={`${
                    locSec.enabled ? "pt-2.5 border-t border-stone-200" : ""
                  } space-y-1.5 text-[11px] text-stone-500`}
                >
                  <span className="font-semibold text-stone-700 block">
                    {paySec.title || "Medios de pago"}:
                  </span>

                  {/* Badges dinámicos según métodos activados en el servidor */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {mercadopagoEnabled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#009ee3]/10 text-[#0081ba] font-semibold border border-[#009ee3]/20 text-[10px]">
                        Mercado Pago
                      </span>
                    )}
                    {transferEnabled !== false && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-medium border border-stone-200 text-[10px]">
                        Transferencia
                      </span>
                    )}
                    {cashEnabled !== false && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-medium border border-stone-200 text-[10px]">
                        Efectivo
                      </span>
                    )}
                  </div>

                  {paySec.text && (
                    <span className="text-[10px] text-stone-500 block pt-0.5">
                      {paySec.text}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Franja Inferior Legal: Términos y Condiciones, Arrepentimiento y Data Fiscal (ADM-09) */}
        {bottomLegal.enabled && (
          <div className="pt-8 border-t border-[#e7e2da] flex flex-col md:flex-row items-center justify-between gap-6 text-stone-500 text-[11px]">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {/* Placa Oficial AFIP Formulario 960 (Data Fiscal) - Solo si está disponible */}
              {showDataFiscal && (
                <a
                  href={dataFiscalUrl || "https://serviciosweb.afip.gob.ar/clavefiscal/qr/mobile/ver.aspx"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block shrink-0 transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-stone-800 rounded-lg p-0.5"
                  aria-label="Ver Formulario 960 Data Fiscal AFIP"
                  title="Formulario 960/D - Data Fiscal AFIP / ARCA"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/data-fiscal.png"
                    alt="Data Fiscal AFIP - Formulario 960/D"
                    width={80}
                    height={110}
                    className="h-24 sm:h-28 w-auto object-contain rounded shadow-xs border border-stone-200 bg-white"
                  />
                </a>
              )}

              <div>
                <p className="font-medium text-stone-700">
                  © {new Date().getFullYear()} {brandName}. Todos los derechos reservados.
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {bottomLegal.copyrightNotice || "Comercio adherido al régimen de transparencia fiscal (AFIP / ARCA - Res. Gral. 3377)."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {bottomLegal.showTermsLink && (
                <Link
                  href="/terminos"
                  className="hover:text-stone-900 transition-colors font-medium"
                >
                  Términos y Condiciones
                </Link>
              )}

              {showBankPromos && bottomLegal.showBankPromosLink && (
                <Link
                  href="/promociones"
                  className="hover:text-stone-900 transition-colors"
                >
                  Promociones bancarias
                </Link>
              )}

              {bottomLegal.showConsumerDefenseLink && (
                <a
                  href="https://www.argentina.gob.ar/defensadelconsumidor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-stone-900 transition-colors"
                >
                  <Scale className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
                  <span>Defensa del Consumidor (Ley 24.240)</span>
                </a>
              )}

              {bottomLegal.showRevocationButton && (
                <Link
                  href="/arrepentimiento"
                  className="inline-flex items-center gap-1 text-stone-600 hover:text-rose-700 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  <span>Botón de arrepentimiento</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
