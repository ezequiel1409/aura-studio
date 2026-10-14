"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
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
}

export function HomeHero({
  heroMode,
  heroTitle,
  heroSubtitle,
  heroBannerUrl,
  featuredProducts = [],
  brandName = "Aura Studio",
}: HomeHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const defaultTitle = "Piezas únicas con carácter propio";
  const defaultSubtitle =
    "Cada pieza de nuestro showroom es única e irrepetible. Explorá el catálogo de productos y consultá o reservá tu pieza al instante vía WhatsApp.";

  const title = heroTitle?.trim() || defaultTitle;
  const subtitle = heroSubtitle?.trim() || defaultSubtitle;

  const totalFeatured = featuredProducts.length;

  // Autoplay para el carrusel de destacados (si no está pausado por hover del usuario)
  useEffect(() => {
    if (heroMode !== "featured_carousel" || totalFeatured <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalFeatured);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroMode, totalFeatured, isPaused]);

  // Si eligió banner con imagen personalizada
  if (heroMode === "custom_banner" && heroBannerUrl) {
    return (
      <section
        aria-label="Campaña destacada"
        className="relative mb-8 overflow-hidden rounded-2xl border border-[#e7e2da] bg-stone-900 shadow-sm"
      >
        <div className="relative aspect-[21/9] min-h-[260px] sm:min-h-[340px] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroBannerUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-center brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
            <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-amber-300 uppercase">
              Campaña Oficial
            </span>
            <h1 className="mt-2 font-serif text-2xl sm:text-4xl font-light tracking-wide text-white">
              {title}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-200 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Si eligió carrusel de productos destacados y existen productos destacados
  if (heroMode === "featured_carousel" && totalFeatured > 0) {
    const current = featuredProducts[currentIndex];
    const formattedCode = formatProductCode(current.code);
    const paddedCode = current.code.toString().padStart(3, "0");
    const mainPhoto =
      current.photos && current.photos.length > 0
        ? current.photos[0].keyFull || current.photos[0].keyThumb
        : null;

    const handlePrev = () => {
      setCurrentIndex((prev) => (prev - 1 + totalFeatured) % totalFeatured);
    };

    const handleNext = () => {
      setCurrentIndex((prev) => (prev + 1) % totalFeatured);
    };

    return (
      <section
        aria-label="Colección de prendas destacadas"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative mb-8 overflow-hidden rounded-2xl border border-[#e7e2da] bg-white shadow-xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch min-h-[300px] sm:min-h-[360px]">
          {/* Foto de la Prenda */}
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
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-xs px-3 py-1 text-[11px] font-bold text-amber-900 border border-amber-200/60 shadow-2xs">
              <Sparkles className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
              <span>Pieza Destacada</span>
            </div>
          </div>

          {/* Información y Acción Editorial */}
          <div className="md:col-span-7 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-[#926a3c] uppercase">
                  Selección de Showroom
                </span>
                <span className="text-xs font-mono text-stone-400">
                  {currentIndex + 1} / {totalFeatured}
                </span>
              </div>

              <h2 className="mt-3 font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-stone-900">
                {current.title}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-serif text-xl sm:text-2xl font-semibold text-stone-900">
                  {formatPrice(current.priceCents, current.currency)}
                </span>
                {current.size && (
                  <span className="text-xs font-mono font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    Talle {current.size}
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
                {current.rawText.split("\n")[0] || "Pieza exclusiva disponible en nuestro archivo."}
              </p>
            </div>

            {/* Controles de Navegación y Botón */}
            <div className="mt-6 pt-5 border-t border-[#f0ece1] flex flex-wrap items-center justify-between gap-4">
              <Link
                href={`/p/${paddedCode}`}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-stone-900 px-6 py-2 text-xs font-semibold tracking-wider text-white uppercase transition-all hover:bg-stone-800 hover:gap-3 focus-visible:outline-2 focus-visible:outline-stone-900 shadow-xs"
              >
                <span>Descubrir pieza</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>

              {totalFeatured > 1 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-2">
                    {featuredProducts.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        aria-label={`Ver producto destacado ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === currentIndex ? "w-6 bg-stone-900" : "w-1.5 bg-stone-300 hover:bg-stone-400"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Producto destacado anterior"
                    className="p-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Siguiente producto destacado"
                    className="p-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Modo Editorial por Defecto
  return (
    <section
      aria-labelledby="hero-title"
      className="relative mb-8 overflow-hidden rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-10 shadow-xs"
    >
      <div className="max-w-2xl">
        <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-[#926a3c] uppercase">
          Colección Seleccionada
        </span>
        <h1
          id="hero-title"
          className="mt-2 font-serif text-3xl font-light tracking-wide text-stone-900 sm:text-4xl"
        >
          {title}
        </h1>
        <p className="mt-3 text-xs leading-relaxed text-stone-600 sm:text-sm">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
