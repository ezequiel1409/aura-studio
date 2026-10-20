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
import { NavigationSection } from "../../domain/navigation/types";
import {
  buildGoogleMapsSearchUrl,
  computeStoreOpenStatus,
  DAY_LABELS,
  DAY_ORDER,
  DEFAULT_STORE_LOCATION,
  DEFAULT_STORE_SCHEDULE,
  formatDayRanges,
  StoreLocationConfig,
  StoreScheduleConfig,
} from "../../lib/schedule/store-schedule";

export interface FooterProps {
  brandName?: string;
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
}

export function Footer({
  brandName = "Aura Studio",
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
}: FooterProps) {
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
        {/* Estructura en 4 Columnas (Sección 6.1 del Plan) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-10 border-b border-[#f0ece1]">
          {/* Columna 1: Marca y Contacto */}
          <div className="space-y-3.5">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={brandName}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
                  Showroom & Archivo
                </span>
                <h3 className="font-serif text-xl font-normal text-stone-900 tracking-wider uppercase mt-0.5">
                  {brandName}
                </h3>
              </div>
            )}

            <p className="text-xs text-stone-600 leading-relaxed">
              Curaduría de prendas seleccionadas, atención personalizada y envíos a todo el país.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Contactar por WhatsApp al ${whatsappNumber || ""}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#155e42] hover:bg-[#0f4631] text-white font-medium text-xs shadow-xs transition-all w-fit focus-visible:outline-2 focus-visible:outline-[#155e42]"
                >
                  <WhatsAppLogo className="h-4 w-4 text-white" />
                  <span>WhatsApp: {whatsappNumber}</span>
                </a>
              )}

              {instagramHref && (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Seguir en Instagram a @${cleanInstagram}`}
                  className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-950 transition-colors w-fit"
                >
                  <InstagramIcon className="h-4 w-4 text-[#E4405F]" />
                  <span>Instagram: @{cleanInstagram}</span>
                </a>
              )}

              {tiktokHref && (
                <a
                  href={tiktokHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Seguir en TikTok a @${cleanTiktok}`}
                  className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-950 transition-colors w-fit"
                >
                  <TikTokIcon className="h-4 w-4 text-stone-800" />
                  <span>TikTok: @{cleanTiktok}</span>
                </a>
              )}
            </div>
          </div>

          {/* Columna 2: Secciones Activas */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
              Colecciones
            </span>
            <h3 className="font-serif text-lg font-normal text-stone-900 tracking-wide">
              Secciones
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
              <li>
                <Link
                  href="/catalogo"
                  className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors"
                >
                  Ver todo el catálogo
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Ayuda y Promociones Bancarias */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
              Guía & Confianza
            </span>
            <h3 className="font-serif text-lg font-normal text-stone-900 tracking-wide">
              Ayuda al cliente
            </h3>

            <ul className="space-y-2 text-stone-600 list-none p-0 m-0">
              <li>
                <Link
                  href="/promociones"
                  className="inline-flex items-center gap-1.5 font-semibold text-stone-900 hover:underline underline-offset-4"
                >
                  <Landmark className="h-3.5 w-3.5 text-stone-700" aria-hidden="true" />
                  <span>Promociones bancarias</span>
                </Link>
              </li>
              <li>
                <span>Envíos a domicilio y retiro en el local</span>
              </li>
              <li>
                <span>Cambios y devoluciones dentro de los 30 días</span>
              </li>
              <li>
                <span>Medios de pago: tarjetas, transferencia y efectivo</span>
              </li>
              <li>
                <Link
                  href="/cuenta"
                  className="hover:text-stone-900 hover:underline underline-offset-4"
                >
                  Estado de mi pedido y cuenta
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Local, Google Maps y Horarios de Atención y Retiro */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
              Ubicación y Horarios
            </span>
            <h3 className="font-serif text-lg font-normal text-stone-900 tracking-wide">
              Local y retiro
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

                {/* Tabla accesible de horarios de atención con día actual destacado */}
                <div className="pt-1">
                  <table
                    aria-label="Horarios de atención por día de la semana"
                    className="w-full text-[11px] border-collapse"
                  >
                    <tbody>
                      {DAY_ORDER.map((dayKey) => {
                        const dayRow = resolvedSchedule.openingHours.find(
                          (d) => d.day === dayKey
                        );
                        const isToday = dayKey === openStatus.todayKey;
                        return (
                          <tr
                            key={dayKey}
                            className={
                              isToday
                                ? "font-bold text-stone-950 bg-[#faf8f5]"
                                : "text-stone-600"
                            }
                          >
                            <th
                              scope="row"
                              className="py-0.5 pr-2 text-left font-inherit"
                            >
                              {DAY_LABELS[dayKey]}
                              {isToday ? " (Hoy)" : ""}
                            </th>
                            <td className="py-0.5 text-right font-mono">
                              {formatDayRanges(dayRow)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {resolvedSchedule.note && (
                  <p className="text-[11px] text-stone-500 italic">
                    {resolvedSchedule.note}
                  </p>
                )}

                {resolvedSchedule.separatePickupHours && (
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-stone-700 pt-1">
                    <PackageCheck className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
                    <span>Horario especial de retiro disponible en el checkout.</span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Franja Inferior Legal: Derechos, Defensa del Consumidor, Botón de Arrepentimiento y Data Fiscal */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
          <p>
            © {new Date().getFullYear()} {brandName}. Todos los derechos
            reservados.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/promociones"
              className="hover:text-stone-900 transition-colors"
            >
              Términos de promociones
            </Link>

            <a
              href="https://www.argentina.gob.ar/defensadelconsumidor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-stone-900 transition-colors"
            >
              <Scale className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
              <span>Defensa del Consumidor (Ley 24.240)</span>
            </a>

            <Link
              href="/arrepentimiento"
              className="inline-flex items-center gap-1 hover:text-rose-700 transition-colors font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
              <span>Botón de arrepentimiento</span>
            </Link>

            {dataFiscalUrl && (
              <a
                href={dataFiscalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-800 hover:text-blue-950 font-medium"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                <span>Data Fiscal (AFIP)</span>
              </a>
            )}
          </div>

          <p className="tracking-wide">
            Creado por{" "}
            <strong className="font-semibold text-stone-700">Altum</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
