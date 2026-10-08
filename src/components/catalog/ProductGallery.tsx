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
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-stone-100 flex items-center justify-center text-stone-300">
        <span className="font-serif text-4xl font-light">{code}</span>
      </div>
    );
  }

  const currentPhoto = photos[selectedIndex] || photos[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Foto Principal */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-stone-100 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto.keyFull || currentPhoto.keyThumb}
          alt={title || `Foto de ${code}`}
          className="h-full w-full object-cover object-center transition-all duration-300"
        />
      </div>

      {/* Miniaturas si hay más de 1 foto */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {photos.map((photo, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={photo.id || index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  isSelected ? "border-stone-900 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
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
