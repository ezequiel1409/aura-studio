"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ProductPreviewCard } from "./ProductPreviewCard";
import { ColorState } from "./StockVariantsStep";
import { PhotoPreview } from "./MediaUploaderStep";

interface MobileProductPreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pricePesos: string;
  isConsultPrice: boolean;
  categoryName: string;
  photos: PhotoPreview[];
  initialStatus: "AVAILABLE" | "RESERVED";
  isFeatured: boolean;
  colors: ColorState[];
}

export function MobileProductPreviewSheet({
  isOpen,
  onClose,
  title,
  pricePesos,
  isConsultPrice,
  categoryName,
  photos,
  initialStatus,
  isFeatured,
  colors,
}: MobileProductPreviewSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa del producto"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Vista Previa de la Prenda
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
            aria-label="Cerrar vista previa"
          >
            <X size={16} />
          </button>
        </div>

        <ProductPreviewCard
          title={title}
          pricePesos={pricePesos}
          isConsultPrice={isConsultPrice}
          categoryName={categoryName}
          photos={photos}
          initialStatus={initialStatus}
          isFeatured={isFeatured}
          colors={colors}
        />

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
        >
          Continuar editando
        </button>
      </div>
    </div>
  );
}

