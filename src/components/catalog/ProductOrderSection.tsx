"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { WhatsAppPaymentAdapter } from "../../infra/payments/whatsapp.adapter";
import { WhatsAppButton } from "./WhatsAppButton";

import { ProductColor } from "../../domain/product/types";

interface ProductOrderSectionProps {
  productId: number;
  code: number;
  formattedCode: string;
  title: string | null;
  priceCents: number | null;
  currency: string;
  sizes?: string[];
  colors?: ProductColor[];
  whatsappNumber: string;
  brandName: string;
  isSoldOut: boolean;
  isReserved: boolean;
}

export function ProductOrderSection({
  productId,
  code,
  formattedCode,
  title,
  priceCents,
  currency,
  sizes = [],
  colors = [],
  whatsappNumber,
  brandName,
  isSoldOut,
}: ProductOrderSectionProps) {
  // Inicialización de color: primer color disponible o el primero
  const [selectedColorId, setSelectedColorId] = useState<number | null>(() => {
    if (colors.length > 0) {
      const withStock = colors.find((c) => c.sizes.some((s) => s.stock > 0));
      return withStock ? withStock.id : colors[0].id;
    }
    return null;
  });

  const activeColor = useMemo(
    () => colors.find((c) => c.id === selectedColorId) || (colors.length > 0 ? colors[0] : null),
    [colors, selectedColorId]
  );

  // Talles disponibles según el color activo (o fallback a sizes)
  const currentSizes = useMemo(() => {
    if (activeColor && activeColor.sizes.length > 0) {
      return activeColor.sizes;
    }
    return sizes.map((s) => ({
      id: 0,
      productColorId: 0,
      size: s,
      stock: 1,
      reservedStock: 0,
    }));
  }, [activeColor, sizes]);

  // Preselecciona el primer talle con stock disponible
  const [selectedSize, setSelectedSize] = useState<string | null>(() => {
    const firstInStock = currentSizes.find((s) => s.stock > 0);
    return firstInStock ? firstInStock.size : currentSizes[0]?.size || null;
  });

  // Al cambiar de color, ajustar el talle seleccionado si ya no es válido o está sin stock
  const handleColorChange = (colorId: number) => {
    setSelectedColorId(colorId);
    const newColor = colors.find((c) => c.id === colorId);
    if (newColor && newColor.sizes.length > 0) {
      const inStock = newColor.sizes.find((s) => s.stock > 0);
      setSelectedSize(inStock ? inStock.size : newColor.sizes[0].size);
    }
  };

  const paymentAdapter = useMemo(
    () => new WhatsAppPaymentAdapter({ whatsappNumber, brandName }),
    [whatsappNumber, brandName]
  );

  const selectedSizeItem = currentSizes.find((s) => s.size === selectedSize);
  const isSelectedOutOfStock = selectedSizeItem ? selectedSizeItem.stock <= 0 : false;

  const paymentAction = paymentAdapter.createPaymentAction({
    code,
    formattedCode,
    title,
    priceCents,
    currency,
    selectedColor: activeColor ? activeColor.name : null,
    selectedSize,
  });

  const hasMultipleColors = colors.length > 1;
  const hasMultipleSizes = currentSizes.length > 1;
  const hasSingleSize = currentSizes.length === 1;

  return (
    <div className="mt-6 rounded-2xl border border-[#e7e2da] bg-white p-5 sm:p-6 shadow-2xs">
      {/* Selector de Color si el producto tiene más de 1 color */}
      {hasMultipleColors && (
        <div className="mb-6">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
              Color:
            </span>
            {activeColor && (
              <span className="text-xs text-stone-600 font-medium">
                {activeColor.name}
              </span>
            )}
          </div>

          <div
            className="flex flex-wrap gap-2.5"
            role="radiogroup"
            aria-label="Selecciona tu color"
          >
            {colors.map((color) => {
              const isSelected = color.id === activeColor?.id;
              const hasColorStock = color.sizes.some((s) => s.stock > 0);
              return (
                <button
                  key={color.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleColorChange(color.id)}
                  className={`flex min-h-[40px] items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-stone-900 ${
                    isSelected
                      ? "bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/10 scale-102"
                      : "border border-[#e7e2da] bg-[#faf8f5] text-stone-700 hover:border-stone-400 hover:text-stone-900 hover:bg-white"
                  } ${!hasColorStock ? "opacity-60" : ""}`}
                >
                  {color.hexCode && (
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/20 shadow-2xs shrink-0"
                      style={{ backgroundColor: color.hexCode }}
                      aria-hidden="true"
                    />
                  )}
                  <span>{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selector de talles interactivo según el color seleccionado */}
      {hasMultipleSizes && (
        <div className="mb-6">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
              Talles disponibles:
            </span>
            {selectedSize && (
              <span className="text-xs text-stone-500">
                Seleccionado:{" "}
                <strong className="font-mono font-bold text-stone-900">
                  {selectedSize}
                </strong>
                {selectedSizeItem && selectedSizeItem.stock > 0 && selectedSizeItem.stock <= 2 && (
                  <span className="ml-1.5 text-[11px] font-semibold text-amber-700">
                    (¡Últimas {selectedSizeItem.stock} unidades!)
                  </span>
                )}
              </span>
            )}
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Selecciona tu talle"
          >
            {currentSizes.map((s) => {
              const isChosen = selectedSize === s.size;
              const isOutOfStock = s.stock <= 0;
              return (
                <button
                  key={s.size}
                  type="button"
                  role="radio"
                  aria-checked={isChosen}
                  disabled={isOutOfStock}
                  onClick={() => setSelectedSize(s.size)}
                  className={`flex min-h-[44px] min-w-[50px] items-center justify-center rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isOutOfStock
                      ? "border border-stone-200 bg-stone-100 text-stone-400 line-through cursor-not-allowed"
                      : isChosen
                      ? "bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/10 scale-102 cursor-pointer"
                      : "border border-[#e7e2da] bg-[#faf8f5] text-stone-700 hover:border-stone-400 hover:text-stone-900 hover:bg-white cursor-pointer"
                  } focus-visible:outline-2 focus-visible:outline-stone-900`}
                >
                  {s.size}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            Al tocar el talle se incluirá automáticamente en tu mensaje de WhatsApp.
          </p>
        </div>
      )}

      {/* Talle único informativo */}
      {hasSingleSize && (
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              Talle:
            </span>
            <span className="rounded-lg border border-[#e7e2da] bg-[#faf8f5] px-3 py-1 font-mono text-xs font-bold text-stone-900">
              {currentSizes[0].size === "ÚNICO" ? "Talle Único" : currentSizes[0].size}
            </span>
          </div>
          {currentSizes[0].stock > 0 && currentSizes[0].stock <= 2 && (
            <span className="text-[11px] font-semibold text-amber-700">
              ¡Últimas {currentSizes[0].stock} unidades!
            </span>
          )}
        </div>
      )}

      {/* Botón de WhatsApp con el logo oficial y mensaje enriquecido */}
      <WhatsAppButton
        productId={productId}
        url={paymentAction.url}
        label={
          isSoldOut
            ? "Pieza Agotada"
            : isSelectedOutOfStock
            ? "Talle sin stock"
            : paymentAction.label
        }
        disabled={isSoldOut || isSelectedOutOfStock}
      />

      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-center text-xs text-stone-500">
        <ShieldCheck className="h-4 w-4 text-[#926a3c]" />
        <span>Atención personalizada · Reserva directa desde el showroom</span>
      </div>
    </div>
  );
}

