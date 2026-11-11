"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ProductPhoto } from "../../domain/product/types";

interface ProductLightboxModalProps {
  photos: ProductPhoto[];
  currentIndex: number;
  code: string;
  title?: string | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ProductLightboxModal({
  photos,
  currentIndex,
  code,
  title,
  onClose,
  onPrev,
  onNext,
}: ProductLightboxModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const totalPhotos = photos.length;
  const currentPhoto = photos[currentIndex] || photos[0];
  const photoAlt = title
    ? `${title} - Foto ${currentIndex + 1} de ${totalPhotos}`
    : `Foto de ${code}`;

  // Bloquear scroll de la página de fondo mientras el visor está abierto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Manejo de teclado para el visor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        onNext();
      } else if (e.key === "ArrowLeft") {
        onPrev();
      } else if (e.key === "+" || e.key === "=") {
        setZoomLevel((z) => Math.min(z + 0.5, 3.5));
      } else if (e.key === "-") {
        setZoomLevel((z) => Math.max(z - 0.5, 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  // Controles de zoom
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
    dragStartRef.current = {
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  if (typeof document === "undefined") return null;

  return createPortal(
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
            onClick={onClose}
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
          onClick={onPrev}
          aria-label="Foto anterior"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-stone-900/70 text-white shadow-md transition-all hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Área interactiva de la imagen con Zoom y Arrastre */}
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden p-4 ${
          zoomLevel > 1
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default"
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
            transform: `scale(${zoomLevel}) translate(${
              panPosition.x / zoomLevel
            }px, ${panPosition.y / zoomLevel}px)`,
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
          onClick={onNext}
          aria-label="Foto siguiente"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-stone-900/70 text-white shadow-md transition-all hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Instrucciones de ayuda al pie del visor */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-[11px] text-stone-400 pointer-events-none z-40">
        <span>
          Doble clic para acercar o alejar · Arrastra para explorar detalles ·
          ESC para salir
        </span>
      </div>
    </div>,
    document.body
  );
}
