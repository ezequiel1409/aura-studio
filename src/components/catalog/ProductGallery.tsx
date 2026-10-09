"use client";

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { ProductPhoto } from "../../domain/product/types";

interface ProductGalleryProps {
  photos: ProductPhoto[];
  title?: string | null;
  code: string;
}

const emptySubscribe = () => () => {};

export function ProductGallery({ photos, title, code }: ProductGalleryProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Swipe táctil en móvil
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const totalPhotos = photos?.length || 0;

  const nextSlide = useCallback(() => {
    if (totalPhotos <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalPhotos);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [totalPhotos]);

  const prevSlide = useCallback(() => {
    if (totalPhotos <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [totalPhotos]);

  // Manejo de teclado para el carrusel y el modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === "Escape") {
          setIsLightboxOpen(false);
          setZoomLevel(1);
          setPanPosition({ x: 0, y: 0 });
        } else if (e.key === "ArrowRight") {
          nextSlide();
        } else if (e.key === "ArrowLeft") {
          prevSlide();
        } else if (e.key === "+" || e.key === "=") {
          setZoomLevel((z) => Math.min(z + 0.5, 3.5));
        } else if (e.key === "-") {
          setZoomLevel((z) => Math.max(z - 0.5, 1));
        }
      } else {
        if (e.key === "ArrowRight") {
          nextSlide();
        } else if (e.key === "ArrowLeft") {
          prevSlide();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, nextSlide, prevSlide]);

  // Bloquear scroll de la página de fondo mientras el visor está abierto
  useEffect(() => {
    if (!isLightboxOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLightboxOpen]);

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

  // Controles de zoom en modal
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.5, 3.5));
  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(z - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Arrastre al hacer zoom (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Si no hay fotos, mostrar placeholder elegante
  if (totalPhotos === 0) {
    return (
      <div className="relative mx-auto flex h-[310px] xs:h-[340px] sm:h-[390px] md:h-[410px] lg:h-[440px] w-full max-w-[360px] md:max-w-[400px] overflow-hidden rounded-2xl border border-[#e7e2da] bg-[#f5f2eb] flex-col items-center justify-center p-8 text-center text-stone-400">
        <span className="font-serif text-5xl font-light text-stone-300">AURA</span>
        <span className="mt-2 font-mono text-xs tracking-widest text-stone-400">{code}</span>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex] || photos[0];
  const photoAlt = title ? `${title} - Foto ${currentIndex + 1} de ${totalPhotos}` : `Foto de ${code}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Contenedor Principal del Carrusel */}
      <div
        className="group relative mx-auto flex h-[310px] xs:h-[340px] sm:h-[390px] md:h-[410px] lg:h-[440px] w-full max-w-[360px] md:max-w-[400px] items-center justify-center overflow-hidden rounded-2xl border border-[#e7e2da] bg-[#f5f2eb] shadow-xs select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Fondo difuminado ambiental suave en el tono de la prenda */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 blur-lg scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${currentPhoto.keyThumb || currentPhoto.keyFull})` }}
          aria-hidden="true"
        />

        {/* Imagen del Slide Actual (con object-contain para ver el producto completo sin recortes) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto.keyFull || currentPhoto.keyThumb}
          alt={photoAlt}
          className="relative z-10 h-full w-full object-contain p-2 transition-all duration-300 cursor-zoom-in drop-shadow-xs"
          onClick={() => setIsLightboxOpen(true)}
        />

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

        {/* Puntos indicadores inferiores del carrusel */}
        {totalPhotos > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-stone-950/40 px-2.5 py-1 backdrop-blur-xs">
            {photos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ir a la foto ${idx + 1}`}
                className={`h-1.5 transition-all rounded-full cursor-pointer ${
                  idx === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniaturas inferiores para selección directa (1 a 3 fotos) */}
      {totalPhotos > 1 && (
        <div className="flex flex-col items-center gap-1">
          <div
            className="flex items-center justify-center gap-2 sm:gap-2.5 py-0.5"
            role="tablist"
            aria-label="Miniaturas de la prenda"
          >
            {photos.map((photo, index) => {
              const isSelected = index === currentIndex;
              return (
                <button
                  key={photo.id || index}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`Foto ${index + 1} de ${totalPhotos}`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoomLevel(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
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

      {/* MODAL LIGHTBOX DE ZOOM INMERSIVO (Renderizado en Portal para evitar solapamiento de z-index) */}
      {isMounted && isLightboxOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Visor de alta resolución con zoom"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/95 backdrop-blur-md select-none"
          >
            {/* Barra superior de controles del visor */}
            <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-stone-300">
                  {code} · {currentIndex + 1} / {totalPhotos}
                </span>
                {zoomLevel > 1 && (
                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-mono">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                )}
              </div>

              {/* Herramientas de Zoom */}
              <div className="flex items-center gap-1.5 bg-stone-900/80 p-1 rounded-full border border-stone-800">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  aria-label="Alejar imagen"
                  className="rounded-full p-2 text-stone-300 hover:bg-stone-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  disabled={zoomLevel === 1}
                  aria-label="Restablecer tamaño original"
                  className="rounded-full p-2 text-stone-300 hover:bg-stone-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3.5}
                  aria-label="Acercar imagen"
                  className="rounded-full p-2 text-stone-300 hover:bg-stone-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="h-4 w-px bg-stone-700 mx-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setZoomLevel(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  aria-label="Cerrar visor de imagen"
                  className="rounded-full p-2 text-stone-300 hover:bg-rose-950/60 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Flecha previa en Lightbox */}
            {totalPhotos > 1 && (
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Foto anterior"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-stone-900/70 text-white shadow-md transition-all hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Área interactiva de la imagen con Zoom y Arrastre */}
            <div
              className={`relative flex h-full w-full items-center justify-center overflow-hidden p-4 ${
                zoomLevel > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={() => {
                if (zoomLevel === 1) {
                  setZoomLevel(2);
                } else {
                  handleResetZoom();
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentPhoto.keyFull || currentPhoto.keyThumb}
                alt={photoAlt}
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${
                    panPosition.y / zoomLevel
                  }px)`,
                  transition: isDragging ? "none" : "transform 0.2s ease-out",
                }}
                className="max-h-[85vh] max-w-[85vw] object-contain transition-transform select-none"
                draggable={false}
              />
            </div>

            {/* Flecha siguiente en Lightbox */}
            {totalPhotos > 1 && (
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Foto siguiente"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-stone-900/70 text-white shadow-md transition-all hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Instrucciones de ayuda al pie del visor */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-[11px] text-stone-400 pointer-events-none z-40">
              <span>Doble clic para acercar o alejar · Arrastra para explorar detalles · ESC para salir</span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
