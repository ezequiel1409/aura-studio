"use client";

import { useSyncExternalStore } from "react";
import { Heart } from "lucide-react";

const SAVED_PIECES_KEY = "app_saved_pieces";
const SAVED_PIECES_EVENT = "app:saved-pieces-changed";

function subscribeSavedPieces(callback: () => void) {
  window.addEventListener(SAVED_PIECES_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SAVED_PIECES_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSavedPiecesRaw(): string {
  try {
    return localStorage.getItem(SAVED_PIECES_KEY) || "[]";
  } catch {
    return "[]";
  }
}

interface FavoriteButtonProps {
  productId: number;
  productTitle: string;
}

export function FavoriteButton({ productId, productTitle }: FavoriteButtonProps) {
  const savedRaw = useSyncExternalStore(
    subscribeSavedPieces,
    getSavedPiecesRaw,
    () => "[]"
  );

  let isSaved = false;
  try {
    const ids = JSON.parse(savedRaw);
    if (Array.isArray(ids)) {
      isSaved = ids.includes(productId);
    }
  } catch {}

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const stored = localStorage.getItem(SAVED_PIECES_KEY);
      let ids: number[] = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) ids = parsed;
      }

      const updated = ids.includes(productId)
        ? ids.filter((id) => id !== productId)
        : [...ids, productId];

      localStorage.setItem(SAVED_PIECES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(SAVED_PIECES_EVENT));
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggleSave}
      aria-label={isSaved ? `Quitar ${productTitle} de guardados` : `Guardar ${productTitle}`}
      aria-pressed={isSaved}
      title={isSaved ? "Guardada" : "Guardar pieza"}
      className="group/fav flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-700 backdrop-blur-sm border border-[#e7e2da] shadow-2xs transition-all hover:bg-white hover:text-[#926a3c] focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer"
    >
      <Heart
        size={15}
        className={`transition-all ${
          isSaved
            ? "fill-[#926a3c] text-[#926a3c] scale-110"
            : "text-stone-600 group-hover/fav:text-[#926a3c]"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
