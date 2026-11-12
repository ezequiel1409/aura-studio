"use client";

import { ProductPreviewCard } from "./ProductPreviewCard";
import { ColorState } from "./StockVariantsStep";
import { PhotoPreview } from "./MediaUploaderStep";
import { ModalDialog } from "../../ui/ModalDialog";

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
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Vista Previa de la Prenda"
      size="sm"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
        >
          Continuar editando
        </button>
      }
    >
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
    </ModalDialog>
  );
}

