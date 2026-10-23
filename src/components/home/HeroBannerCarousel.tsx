"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { HomeBanner } from "../../domain/promotion/types";

export interface HeroBannerCarouselProps {
  banners: HomeBanner[];
  fallbackTitle?: string | null;
  fallbackSubtitle?: string | null;
  fallbackBannerUrl?: string | null;
  brandName?: string;
}

export function HeroBannerCarousel({
  banners,
  fallbackTitle,
  fallbackSubtitle,
  fallbackBannerUrl,
  brandName = "Aura Studio",
}: HeroBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Construir slides (1 a 5 slides; si el comercio no cargó banners en home_banners, usamos el hero configurado en settings o uno por defecto)
  const slides: HomeBanner[] =
    banners.length > 0
      ? banners.slice(0, 5)
      : [
          {
            id: 0,
            title:
              fallbackTitle ||
              "Piezas seleccionadas de edición limitada",
            subtitle:
              fallbackSubtitle ||
              "Descubrí las nuevas colecciones, beneficios bancarios exclusivos y retiro sin cargo en nuestro showroom.",
            ctaLabel: "Explorar catálogo",
            ctaHref: "/catalogo",
            desktopImageUrl: fallbackBannerUrl || null,
            mobileImageUrl: fallbackBannerUrl || null,
            promotionSlug: null,
            startsAt: null,
            endsAt: null,
            position: 1,
            isActive: true,
          },
        ];

  // Regla 3.2: El carrusel no cambia solo en menos de 6 segundos
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const currentSlide = slides[activeIndex % slides.length];
  // Regla 3.5: Un banner de promoción bancaria lleva siempre a la página de esa promo
  const resolvedHref = currentSlide.promotionSlug
    ? `/promociones/${currentSlide.promotionSlug}`
    : currentSlide.ctaHref || "/catalogo";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (slides.length <= 1) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }
  };

  const hasImage = Boolean(
    currentSlide.desktopImageUrl || currentSlide.mobileImageUrl
  );

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Banner principal de novedades y promociones"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden rounded-3xl border border-[#e7e2da] bg-[#f3efe6] shadow-xs"
    >
      <div className="relative min-h-[280px] sm:min-h-[340px] md:min-h-[380px] flex items-center">
        {/* Imágenes responsivas: primer banner con prioridad, resto diferido */}
        {hasImage ? (
          <>
            {currentSlide.desktopImageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentSlide.desktopImageUrl}
                alt={currentSlide.title}
                loading={activeIndex === 0 ? "eager" : "lazy"}
                fetchPriority={activeIndex === 0 ? "high" : "auto"}
                className="hidden sm:block absolute inset-0 h-full w-full object-cover"
              />
            )}
            {(currentSlide.mobileImageUrl || currentSlide.desktopImageUrl) && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={
                  currentSlide.mobileImageUrl ||
                  currentSlide.desktopImageUrl ||
                  ""
                }
                alt={currentSlide.title}
                loading={activeIndex === 0 ? "eager" : "lazy"}
                fetchPriority={activeIndex === 0 ? "high" : "auto"}
                className="block sm:hidden absolute inset-0 h-full w-full object-cover"
              />
            )}
            {/* Capa de contraste >= 4.5:1 para texto sobre imagen */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/65 to-stone-950/35"
              aria-hidden="true"
            />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#faf8f5] via-[#f2ece1] to-[#e7dfd1]"
            aria-hidden="true"
          />
        )}

        {/* Contenido editorial del slide */}
        <div className="relative z-10 w-full px-6 py-8 sm:px-10 sm:py-12 md:max-w-2xl space-y-4">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
              hasImage
                ? "bg-white/15 text-stone-100 border border-white/25 backdrop-blur-xs"
                : "bg-white/90 text-stone-700 border border-[#d8d2c7]"
            }`}
          >
            <Sparkles className="h-3 w-3 text-amber-500" aria-hidden="true" />
            <span>{brandName} · Temporada</span>
          </div>

          <h1
            className={`font-serif text-2xl sm:text-4xl md:text-5xl font-normal leading-tight tracking-wide ${
              hasImage ? "text-white" : "text-stone-900"
            }`}
          >
            {currentSlide.title}
          </h1>

          {currentSlide.subtitle && (
            <p
              className={`text-xs sm:text-sm md:text-base leading-relaxed max-w-xl ${
                hasImage ? "text-stone-200" : "text-stone-600"
              }`}
            >
              {currentSlide.subtitle}
            </p>
          )}

          {/* Un solo botón principal por slide */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link prefetch={false}
              href={resolvedHref}
              className={`min-h-[44px] inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition-all focus-visible:outline-2 ${
                hasImage
                  ? "bg-white text-stone-950 hover:bg-stone-100 focus-visible:outline-white"
                  : "bg-stone-900 text-white hover:bg-stone-800 focus-visible:outline-stone-900"
              }`}
            >
              <span>{currentSlide.ctaLabel || "Explorar colección"}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Controles accesibles del carrusel (anterior, pausa/play, siguiente e indicadores) */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 rounded-full bg-stone-950/75 px-3 py-1.5 text-white backdrop-blur-xs">
          <button
            type="button"
            onClick={() =>
              setActiveIndex(
                (prev) => (prev - 1 + slides.length) % slides.length
              )
            }
            aria-label="Banner anterior"
            className="p-1 hover:text-amber-300 rounded focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            aria-label={isPaused ? "Reanudar carrusel" : "Pausar carrusel"}
            className="p-1 hover:text-amber-300 rounded focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            {isPaused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </button>

          <span className="text-[11px] font-mono px-1">
            {activeIndex + 1}/{slides.length}
          </span>

          <button
            type="button"
            onClick={() =>
              setActiveIndex((prev) => (prev + 1) % slides.length)
            }
            aria-label="Siguiente banner"
            className="p-1 hover:text-amber-300 rounded focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

