"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Store,
  Truck,
  MessageCircle,
} from "lucide-react";
import { Product } from "../../domain/product/types";
import { formatProductCode } from "../../domain/product/rules";
import { formatPrice } from "../../lib/format/currency";
import { HeroMode } from "../../services/settings.service";

interface HomeHeroProps {
  heroMode: HeroMode;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroBannerUrl?: string | null;
  featuredProducts?: Product[];
  brandName?: string;
  whatsappNumber?: string;
}

export function HomeHero({
  heroMode,
  heroTitle,
  heroSubtitle,
  heroBannerUrl,
  featuredProducts = [],
  brandName = "Aura Studio",
  whatsappNumber = "+5491100000000",
}: HomeHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const defaultTitle = "Piezas únicas con carácter propio";
  const defaultSubtitle =
    "Curaduría contemporánea de prendas exclusivas. Cada pieza es irrepetible y se reserva de forma directa y personalizada.";

  const title = heroTitle?.trim() || defaultTitle;
  const subtitle = heroSubtitle?.trim() || defaultSubtitle;
  const cleanPhone = whatsappNumber.replace(/\D/g, "");

  const totalFeatured = featuredProducts.length;
  const firstPiece = totalFeatured > 0 ? featuredProducts[0] : null;

  // Autoplay para el carrusel de destacados
  useEffect(() => {
    if (heroMode !== "featured_carousel" || totalFeatured <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalFeatured);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroMode, totalFeatured, isPaused]);

  return (
    <div className="mb-8 space-y-4">
      {/* 1. HERO PRINCIPAL COMPACTO (320 - 380 px) */}
      {heroMode === "custom_banner" && heroBannerUrl ? (
        <section
          aria-label="Campaña destacada"
          className="relative overflow-hidden rounded-2xl border border-[#e7e2da] bg-stone-900 shadow-xs"
        >
          <div className="relative aspect-[21/9] min-h-[260px] sm:min-h-[320px] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroBannerUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover object-center brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
              <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-amber-300 uppercase">
                Campaña Oficial
              </span>
              <h1 className="mt-1 font-serif text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide text-white">
                {title}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-200 max-w-xl leading-relaxed">
                {subtitle}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="#catalogo"
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-stone-900 uppercase tracking-wider hover:bg-stone-100 transition-colors"
                >
                  <span>Ver piezas</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : heroMode === "featured_carousel" && totalFeatured > 0 ? (
        <section
          aria-label="Colección de prendas destacadas"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative overflow-hidden rounded-2xl border border-[#e7e2da] bg-white shadow-xs"
        >
          {(() => {
            const current = featuredProducts[currentIndex];
            const formattedCode = formatProductCode(current.code);
            const paddedCode = current.code.toString().padStart(3, "0");
            const mainPhoto =
              current.photos && current.photos.length > 0
                ? current.photos[0].keyFull || current.photos[0].keyThumb
                : null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-12 items-stretch min-h-[280px] sm:min-h-[340px]">
                {/* Información a la izquierda */}
                <div className="md:col-span-7 flex flex-col justify-between p-6 sm:p-8">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-[#926a3c] uppercase">
                        Selección de Showroom
                      </span>
                      <span className="text-xs font-mono text-stone-400">
                        {currentIndex + 1} / {totalFeatured}
                      </span>
                    </div>

                    <h1 className="mt-2.5 font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-stone-900 tracking-wide">
                      {current.title}
                    </h1>

                    <p className="mt-2 text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
                      {subtitle}
                    </p>

                    <div className="mt-3 flex items-baseline gap-3">
                      <span className="font-serif text-xl sm:text-2xl font-semibold text-stone-900">
                        {formatPrice(current.priceCents, current.currency)}
                      </span>
                      <span className="font-mono text-xs text-stone-500 bg-[#faf8f5] border border-[#e7e2da] px-2.5 py-0.5 rounded-md">
                        SKU {formattedCode}
                      </span>
                    </div>
                  </div>

                  {/* Acciones del Hero */}
                  <div className="mt-5 pt-4 border-t border-[#f0ece1] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Link prefetch={false}
                        href={`/p/${paddedCode}`}
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold tracking-wider text-white uppercase transition-all hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900 shadow-2xs"
                      >
                        <span>Ver pieza</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>

                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `¡Hola! Quisiera consultar por la pieza destacada ${current.title || ""} (${formattedCode}) de ${brandName}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors shadow-2xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                        <span>Consultar</span>
                      </a>
                    </div>

                    {totalFeatured > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCurrentIndex((prev) => (prev - 1 + totalFeatured) % totalFeatured)}
                          aria-label="Anterior"
                          className="p-1.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentIndex((prev) => (prev + 1) % totalFeatured)}
                          aria-label="Siguiente"
                          className="p-1.5 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Foto de la prenda a la derecha */}
                <div className="relative md:col-span-5 bg-[#f5f2eb] aspect-[4/3] md:aspect-auto overflow-hidden">
                  {mainPhoto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={mainPhoto}
                      alt={current.title || `Pieza ${formattedCode}`}
                      className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center font-serif text-stone-400">
                      {brandName}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-amber-900 border border-amber-200/80 shadow-2xs">
                    <Sparkles className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                    <span>Pieza Única</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      ) : (
        /* HERO COMPACTO EDITORIAL CON FOTO A LA DERECHA (Evita mitad vacía) */
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden rounded-2xl border border-[#e7e2da] bg-white shadow-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[300px] sm:min-h-[340px]">
            {/* Columna Izquierda: Texto y Llamados a la Acción */}
            <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <div>
                <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-[#926a3c] uppercase">
                  Curaduría de Showroom
                </span>
                <h1
                  id="hero-title"
                  className="mt-2 font-serif text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide text-stone-900"
                >
                  {title}
                </h1>
                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-stone-600 max-w-xl">
                  {subtitle}
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#catalogo"
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-all hover:bg-stone-800 hover:gap-3 focus-visible:outline-2 focus-visible:outline-stone-900 shadow-2xs"
                >
                  <span>Ver piezas</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>

                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `¡Hola! Me comunico desde la tienda online de ${brandName}. Quisiera consultar disponibilidad para visitar el showroom o coordinar una pieza.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 hover:border-stone-400 transition-colors shadow-2xs"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden="true" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta visual de pieza destacada */}
            <div className="md:col-span-5 p-4 sm:p-6 bg-[#faf8f5] flex items-center justify-center border-t md:border-t-0 md:border-l border-[#e7e2da] self-stretch">
              {firstPiece ? (
                <Link prefetch={false}
                  href={`/p/${firstPiece.code.toString().padStart(3, "0")}`}
                  className="group block relative w-full max-w-[280px] aspect-[4/5] rounded-xl overflow-hidden border border-[#e7e2da] shadow-sm hover:shadow-md transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={firstPiece.photos?.[0]?.keyThumb || firstPiece.photos?.[0]?.keyFull || ""}
                    alt={firstPiece.title || "Pieza destacada"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300">
                      Pieza Destacada
                    </span>
                    <span className="font-serif text-base font-normal line-clamp-1">
                      {firstPiece.title}
                    </span>
                    <span className="font-serif text-sm font-semibold">
                      {formatPrice(firstPiece.priceCents, firstPiece.currency)}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="w-full max-w-[280px] aspect-[4/5] rounded-xl border border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 p-6 text-center">
                  <span className="font-serif text-3xl font-light text-stone-300">AURA</span>
                  <span className="mt-2 font-mono text-[10px] tracking-widest uppercase">
                    Piezas Únicas & Archivo
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. BARRA DE CONFIANZA CON 4 ÍTEMS (Clave para resolver sensación de vacío) */}
      <section
        aria-label="Ventajas y garantías de compra"
        className="rounded-xl border border-[#e7e2da] bg-white px-4 py-3 sm:px-6 shadow-2xs"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#e7e2da]/70">
          <div className="flex items-center gap-2.5 pt-2 sm:pt-0 sm:px-2">
            <Sparkles className="h-4 w-4 text-[#926a3c] shrink-0" aria-hidden="true" />
            <div>
              <span className="block font-sans text-xs font-bold text-stone-900">Piezas únicas</span>
              <span className="block text-[11px] text-stone-500">Selección irrepetible</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2 sm:pt-0 sm:px-3">
            <Store className="h-4 w-4 text-[#926a3c] shrink-0" aria-hidden="true" />
            <div>
              <span className="block font-sans text-xs font-bold text-stone-900">Retiro en showroom</span>
              <span className="block text-[11px] text-stone-500">Gratis en Palermo Soho</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2 sm:pt-0 sm:px-3">
            <Truck className="h-4 w-4 text-[#926a3c] shrink-0" aria-hidden="true" />
            <div>
              <span className="block font-sans text-xs font-bold text-stone-900">Envíos a todo el país</span>
              <span className="block text-[11px] text-stone-500">Correo y Moto Express</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2 sm:pt-0 sm:px-3">
            <ShieldCheck className="h-4 w-4 text-[#926a3c] shrink-0" aria-hidden="true" />
            <div>
              <span className="block font-sans text-xs font-bold text-stone-900">Reserva por WhatsApp</span>
              <span className="block text-[11px] text-stone-500">Atención personalizada</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
