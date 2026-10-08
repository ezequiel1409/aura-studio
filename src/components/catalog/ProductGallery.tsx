"use client";

import { useState } from "react";
import { ProductPhoto } from "../../domain/product/types";

interface ProductGalleryProps {
  photos: ProductPhoto[];
  title?: string | null;
  code: string;
}

export function ProductGallery({ photos, title, code }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#e7e2da] bg-[#f5f2eb] flex flex-col items-center justify-center p-8 text-center text-stone-400">
        <span className="font-serif text-5xl font-light text-stone-300">AURA</span>
        <span className="mt-2 font-mono text-xs tracking-widest text-stone-400">{code}</span>
      </div>
    );
  }

  const currentPhoto = photos[selectedIndex] || photos[0];

  return (
    <div className="flex flex-col gap-3.5" role="region" aria-label="Galería de imágenes">
      {/* Foto Principal */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#e7e2da] bg-[#f5f2eb] shadow-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto.keyFull || currentPhoto.keyThumb}
          alt={title ? `${title} - Imagen ${selectedIndex + 1}` : `Foto de ${code}`}
          className="h-full w-full object-cover object-center transition-all duration-500"
        />
      </div>

      {/* Miniaturas si hay más de 1 foto */}
      {photos.length > 1 && (
        <div
          className="flex gap-2.5 overflow-x-auto no-scrollbar py-1"
          role="tablist"
          aria-label="Miniaturas de la prenda"
        >
          {photos.map((photo, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={photo.id || index}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Ver foto ${index + 1} de ${photos.length}`}
                onClick={() => setSelectedIndex(index)}
                className={`relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-stone-900 ${
                  isSelected
                    ? "border-stone-900 shadow-sm opacity-100"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.keyThumb || photo.keyFull}
                  alt={`Miniatura ${index + 1}`}
                  className="h-full w-full object-cover object-center"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
