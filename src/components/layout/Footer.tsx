import Link from "next/link";
import {
  ExternalLink,
  MapPin,
  Clock,
  ShieldCheck,
  RotateCcw,
  Scale,
  Mail,
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
  variant?: "default" | "minimal";
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
            © {new Date().getFullYear()} {brandName} · Creado por <strong className="font-medium text-stone-600">Altum</strong>
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer
      role="contentinfo"
      aria-label="Información de contacto y pie de página"
      className="mt-16 sm:mt-20 border-t border-[#e7e2da] bg-white pt-12 pb-8 text-xs text-stone-600 transition-colors"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Grilla Compacta de 3 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pb-10 border-b border-[#f0ece1]">
          {/* Columna 1: Showroom & Horarios */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
              Espacio Físico
            </span>
            <h3 className="font-serif text-lg font-normal text-stone-900 tracking-wide">
              Showroom & Archivo
            </h3>
            
            {address ? (
              <p className="flex items-start gap-2 text-stone-700">
                <MapPin className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{address}</span>
              </p>
            ) : (
              <p className="flex items-start gap-2 text-stone-700">
                <MapPin className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Palermo Soho, Buenos Aires, Argentina</span>
              </p>
            )}

            <p className="flex items-start gap-2 text-stone-600">
              <Clock className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Mar a Sáb de 14:00 a 19:30 hs. Cita y prueba previa por WhatsApp.</span>
            </p>

            <p className="text-[11px] text-stone-500 pt-1">
              Retiro gratuito de pedidos confirmados en el día.
            </p>
          </div>

          {/* Columna 2: Comprar & Legal */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
              Guía & Confianza
            </span>
            <h3 className="font-serif text-lg font-normal text-stone-900 tracking-wide">
              Cómo comprar
            </h3>
            <ul className="space-y-2 text-stone-600 list-none p-0 m-0">
              <li>
                <a href="#como-comprar" className="hover:text-stone-900 transition-colors">
                  Flujo de compra y reserva directa
                </a>
              </li>
              <li>
                <span className="hover:text-stone-900 cursor-default">
                  Envíos a todo el país (Correo & Moto Express)
                </span>
              </li>
              <li>
                <span className="hover:text-stone-900 cursor-default">
                  Cambios dentro de los 15 días corridos
                </span>
              </li>
              <li>
                <a
                  href="https://www.argentina.gob.ar/defensadelconsumidor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <Scale className="h-3.5 w-3.5 text-stone-400" />
                  <span>Defensa del Consumidor (Ley 24.240)</span>
                </a>
              </li>
              <li>
                {whatsappHref && (
                  <a
                    href={`${whatsappHref}?text=${encodeURIComponent("Hola! Deseo solicitar la revocación/arrepentimiento de mi compra conforme a la Resolución 424/2020.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-stone-500 hover:text-rose-700 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-stone-400" />
                    <span>Botón de arrepentimiento (Res. 424/2020)</span>
                  </a>
                )}
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto & Redes */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
              Atención Directa
            </span>
            <h3 className="font-serif text-lg font-normal text-stone-900 tracking-wide">
              Contacto Personalizado
            </h3>

            <div className="flex flex-col gap-2.5">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Contactar por WhatsApp al ${whatsappNumber || ""}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#155e42] hover:bg-[#0f4631] text-white font-medium text-xs shadow-xs transition-all w-fit focus-visible:outline-2 focus-visible:outline-[#155e42]"
                >
                  <WhatsAppLogo className="h-4 w-4 text-white" />
                  <span>WhatsApp: {whatsappNumber || "+54 9 11 0000-0000"}</span>
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

              {dataFiscalUrl && (
                <a
                  href={dataFiscalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-800 hover:text-blue-950 transition-colors pt-1 w-fit"
                >
                  <ShieldCheck className="h-4 w-4 text-blue-700" />
                  <span>Data Fiscal (AFIP)</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Barra Inferior Unificada: Copyright y Créditos Altum */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-400 text-[11px]">
          <p>
            © {new Date().getFullYear()} {brandName}. Curaduría de piezas únicas. Todos los derechos reservados.
          </p>

          <p className="tracking-wide">
            Creado por <strong className="font-semibold text-stone-600">Altum</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
