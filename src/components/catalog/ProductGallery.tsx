"use client";

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { ProductPhoto } from "../../domain/product/types";

const ProductLightboxModal = dynamic(
  () =>
    import("./ProductLightboxModal").then((mod) => mod.ProductLightboxModal),
  { ssr: false }
);

interface ProductGalleryProps {
  photos: ProductPhoto[];
  title?: string | null;
  code: string;
  selectedColorId?: number | null;
}

const emptySubscribe = () => () => {};

export function ProductGallery({ photos, title, code, selectedColorId }: ProductGalleryProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const thumbnailContainerRef = useRef<HTMLDivElement | null>(null);

  // Swipe táctil en móvil
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const totalPhotos = photos?.length || 0;

  const slideTo = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= totalPhotos) return;
      setCurrentIndex(targetIndex);

      // Desplazamiento suave de la miniatura activa en el visor
      if (thumbnailContainerRef.current) {
        const thumbEl = thumbnailContainerRef.current.children[targetIndex] as HTMLElement | undefined;
        if (thumbEl && typeof thumbEl.scrollIntoView === "function") {
          thumbEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }
    },
    [totalPhotos]
  );

  const nextSlide = useCallback(() => {
    if (totalPhotos <= 1) return;
    slideTo((currentIndex + 1) % totalPhotos);
  }, [totalPhotos, currentIndex, slideTo]);

  const prevSlide = useCallback(() => {
    if (totalPhotos <= 1) return;
    slideTo((currentIndex - 1 + totalPhotos) % totalPhotos);
  }, [totalPhotos, currentIndex, slideTo]);

  // Sincronización automática variante de color -> deslizamiento suave hacia la primera imagen de la variante
  useEffect(() => {
    if (selectedColorId == null || !photos || photos.length === 0) return;
    const matchingIndex = photos.findIndex(
      (p) => p.productColorId != null && p.productColorId === selectedColorId
    );
    if (matchingIndex !== -1 && matchingIndex !== currentIndex) {
      slideTo(matchingIndex);
    }
  }, [selectedColorId, photos, currentIndex, slideTo]);

  // Manejo de teclado para el carrusel de página cuando el lightbox no está abierto
  useEffect(() => {
    if (isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, nextSlide, prevSlide]);

  // Gestos táctiles de deslizamiento (Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Solo si el deslizamiento es más horizontal que vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Si no hay fotos, mostrar placeholder elegante
  if (totalPhotos === 0) {
    return (
      <div className="relative mx-auto flex h-[310px] xs:h-[340px] sm:h-[390px] md:h-[410px] lg:h-[440px] w-full max-w-[360px] md:max-w-[400px] overflow-hidden rounded-2xl border border-[#e7e2da] bg-[#f5f2eb] flex-col items-center justify-center p-8 text-center text-stone-400">
        <span className="font-serif text-4xl font-light text-stone-300">SIN FOTO</span>
        <span className="mt-2 font-mono text-xs tracking-widest text-stone-400">{code}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Contenedor Principal del Carrusel con Slider Suave */}
      <div
        className="group relative mx-auto flex aspect-[4/5] min-h-[360px] sm:min-h-[440px] lg:min-h-[500px] w-full items-center justify-center overflow-hidden rounded-2xl border border-[#e7e2da] bg-[#f5f2eb] shadow-xs select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Tira horizontal deslizable con transición fluida */}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {photos.map((photo, idx) => (
            <div
              key={photo.id || idx}
              className="relative flex h-full min-w-full items-center justify-center overflow-hidden flex-shrink-0"
            >
              {/* Fondo difuminado ambiental suave en el tono de la prenda */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-15 blur-lg scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${photo.keyThumb || photo.keyFull})` }}
                aria-hidden="true"
              />

              {/* Imagen del Slide */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.keyFull || photo.keyThumb}
                alt={title ? `${title} - Foto ${idx + 1} de ${totalPhotos}` : `Foto de ${code}`}
                className="relative z-10 h-full w-full object-contain p-2 transition-all duration-300 cursor-zoom-in drop-shadow-xs"
                onClick={() => setIsLightboxOpen(true)}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Botón flotante para Zoom / Vista detallada */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          aria-label="Ampliar imagen para ver detalles"
          className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-stone-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium tracking-wide text-stone-800 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
        >
          <ZoomIn className="h-3.5 w-3.5 text-stone-600" />
          <span className="hidden sm:inline">Ver detalle</span>
        </button>

        {/* Indicador de posición (ej: 1 / 3) */}
        {totalPhotos > 1 && (
          <span className="absolute left-3 top-3 z-20 rounded-full bg-stone-950/60 px-2.5 py-1 font-mono text-[10px] font-medium text-white backdrop-blur-xs">
            {currentIndex + 1} / {totalPhotos}
          </span>
        )}

        {/* Flechas de Navegación del Carrusel (si hay más de 1 foto) */}
        {totalPhotos > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Ver foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-stone-200/80 bg-white/85 text-stone-800 shadow-xs backdrop-blur-xs transition-all hover:scale-105 hover:bg-white hover:shadow-md active:scale-95 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Ver foto siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-stone-200/80 bg-white/85 text-stone-800 shadow-xs backdrop-blur-xs transition-all hover:scale-105 hover:bg-white hover:shadow-md active:scale-95 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </>
        )}

        {/* Indicadores de barra inferior de posición */}
        {totalPhotos > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-stone-950/40 px-2.5 py-1 backdrop-blur-xs">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => slideTo(i)}
                aria-label={`Ir a foto ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniaturas de Navegación Rápida */}
      {totalPhotos > 1 && (
        <div className="flex flex-col gap-1.5">
          <div
            ref={thumbnailContainerRef}
            className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none"
          >
            {photos.map((photo, index) => {
              const isSelected = index === currentIndex;
              return (
                <button
                  key={photo.id || index}
                  type="button"
                  onClick={() => slideTo(index)}
                  className={`group/thumb relative h-14 w-12 sm:h-16 sm:w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-stone-900 ${
                    isSelected
                      ? "border-stone-900 shadow-sm ring-2 ring-stone-900/10 scale-102 opacity-100"
                      : "border-[#e7e2da] bg-white opacity-60 hover:opacity-100 hover:border-stone-400"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.keyThumb || photo.keyFull}
                    alt={`Miniatura ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                  <span className="absolute bottom-0.5 right-0.5 rounded bg-stone-950/75 px-1 py-0.2 font-mono text-[9px] font-bold text-white leading-none">
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-[11px] font-medium tracking-wide text-stone-500">
            {totalPhotos} fotos disponibles · Toca para alternar
          </span>
        </div>
      )}

      {/* MODAL LIGHTBOX DE ZOOM INMERSIVO (Carga diferida / Lazy loading bajo demanda) */}
      {isMounted && isLightboxOpen && (
        <ProductLightboxModal
          photos={photos}
          currentIndex={currentIndex}
          code={code}
          title={title}
          onClose={() => setIsLightboxOpen(false)}
          onPrev={prevSlide}
          onNext={nextSlide}
        />
      )}
    </div>
  );
}
