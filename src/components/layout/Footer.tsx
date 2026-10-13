import Link from "next/link";
import {
  ExternalLink,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { InstagramIcon, TikTokIcon, WhatsAppLogo } from "../icons/SocialIcons";

export interface FooterProps {
  brandName?: string;
  logoUrl?: string | null;
  whatsappNumber?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  address?: string | null;
  dataFiscalUrl?: string | null;
}

export function Footer({
  brandName = "Aura Studio",
  logoUrl,
  whatsappNumber,
  instagramHandle,
  tiktokHandle,
  address,
  dataFiscalUrl,
}: FooterProps) {
  // Limpiar número de WhatsApp para enlace internacional wa.me
  const cleanPhone = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, "") : null;
  const whatsappHref = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

  // Limpiar handle de Instagram si viene con @ o con URL completa
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

  // Limpiar handle de TikTok si viene con @ o URL completa
  const cleanTiktok = tiktokHandle
    ? tiktokHandle
        .trim()
        .replace(/^@/, "")
        .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, "")
        .replace(/\/$/, "")
    : null;
  const tiktokHref = cleanTiktok ? `https://tiktok.com/@${cleanTiktok}` : null;

  return (
    <footer
      role="contentinfo"
      aria-label="Información de contacto y pie de página"
      className="mt-20 border-t border-[#e7e2da] bg-white py-14 text-center text-xs text-stone-600 transition-colors"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
        {/* Identidad / Logo de la Tienda */}
        <div className="space-y-3">
          {logoUrl ? (
            <Link
              href="/"
              aria-label={`${brandName} - Inicio`}
              className="inline-block focus-visible:outline-2 focus-visible:outline-stone-900 rounded-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={brandName}
                className="h-10 sm:h-12 w-auto max-w-[200px] sm:max-w-[260px] mx-auto object-contain"
              />
            </Link>
          ) : (
            <Link
              href="/"
              aria-label={`${brandName} - Inicio`}
              className="inline-block focus-visible:outline-2 focus-visible:outline-stone-900 rounded-sm"
            >
              <p className="font-serif text-lg tracking-[0.22em] font-medium text-stone-900 uppercase">
                {brandName}
              </p>
            </Link>
          )}

          {/* Dirección o Localidad del Showroom */}
          {address ? (
            <p className="inline-flex items-center justify-center gap-1.5 text-xs text-stone-600">
              <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" aria-hidden="true" />
              <span>{address}</span>
            </p>
          ) : (
            <p className="text-[11px] text-stone-500">
              Showroom & Archivo · Buenos Aires, Argentina
            </p>
          )}

          <p className="text-[11px] text-stone-500">
            Atención personalizada y consultas directas a través de WhatsApp.
          </p>
        </div>

        {/* Canales de Contacto & Redes Sociales Opcionales */}
        <nav aria-label="Canales de contacto y redes sociales">
          <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 list-none p-0 m-0">
            {/* WhatsApp */}
            {whatsappHref && (
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Contactar por WhatsApp al ${whatsappNumber || ""}`}
                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#155e42] hover:bg-[#0f4631] text-white font-medium text-xs shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#155e42]"
                >
                  <WhatsAppLogo className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
                  <span>WhatsApp</span>
                  <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
                </a>
              </li>
            )}

            {/* Instagram */}
            {instagramHref && (
              <li>
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Seguir en Instagram a @${cleanInstagram}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100/80 text-stone-800 border border-stone-200/80 hover:bg-stone-200 transition-colors font-medium text-xs shadow-2xs focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:outline-none"
                >
                  <InstagramIcon className="h-4 w-4 text-[#E4405F]" />
                  <span>@{cleanInstagram}</span>
                  <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                </a>
              </li>
            )}

            {/* TikTok (si fue configurado) */}
            {tiktokHref && (
              <li>
                <a
                  href={tiktokHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Seguir en TikTok a @${cleanTiktok}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100/80 text-stone-800 border border-stone-200/80 hover:bg-stone-200 transition-colors font-medium text-xs shadow-2xs focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:outline-none"
                >
                  <TikTokIcon className="h-4 w-4 text-stone-700" />
                  <span>TikTok</span>
                  <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                </a>
              </li>
            )}

            {/* AFIP Data Fiscal (opcional si fue cargado) */}
            {dataFiscalUrl && (
              <li>
                <a
                  href={dataFiscalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver Data Fiscal de AFIP (abre en nueva pestaña)"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/70 text-blue-900 border border-blue-200/80 hover:bg-blue-100/80 transition-colors font-medium text-xs shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
                >
                  <ShieldCheck className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  <span>Data Fiscal (AFIP)</span>
                  <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                </a>
              </li>
            )}
          </ul>
        </nav>

        {/* Separador y Acceso a Backoffice */}
        <div className="pt-6 border-t border-[#f0ece1] flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500">
          <p className="text-[11px]">
            © {new Date().getFullYear()} {brandName}. Piezas únicas de showroom.
          </p>

          <Link
            href="/admin"
            aria-label="Acceder al panel de administración de showroom"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 hover:text-stone-950 transition-colors py-2 px-3.5 rounded-lg bg-stone-100/80 hover:bg-stone-200/90 border border-stone-200/90 shadow-2xs focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:outline-none"
          >
            <span>Acceso Showroom / Admin</span>
            <span className="text-xs font-mono text-stone-500" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
