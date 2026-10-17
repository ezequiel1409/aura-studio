"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  productId: number;
  productTitle: string;
}

export function FavoriteButton({ productId, productTitle }: FavoriteButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("aura_saved_pieces");
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids)) {
          setIsSaved(ids.includes(productId));
        }
      }
    } catch {}
  }, [productId]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const stored = localStorage.getItem("aura_saved_pieces");
      let ids: number[] = [];
      if (stored) {
        ids = JSON.parse(stored);
        if (!Array.isArray(ids)) ids = [];
      }

      let updated: number[];
      if (ids.includes(productId)) {
        updated = ids.filter((id) => id !== productId);
        setIsSaved(false);
      } else {
        updated = [...ids, productId];
        setIsSaved(true);
      }

      localStorage.setItem("aura_saved_pieces", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("aura_saved_updated", { detail: { savedIds: updated } }));
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggleSave}
      aria-label={isSaved ? `Quitar ${productTitle} de guardados` : `Guardar ${productTitle} en favoritos`}
      aria-pressed={isSaved}
      title={isSaved ? "Quitar de guardados" : "Guardar pieza"}
      className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-xs backdrop-blur-xs transition-transform hover:scale-110 hover:bg-white active:scale-95 focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          isSaved ? "fill-rose-500 text-rose-500" : "text-stone-700 hover:text-stone-950"
        }`}
      />
    </button>
  );
}

