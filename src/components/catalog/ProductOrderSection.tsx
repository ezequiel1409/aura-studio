"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, ShoppingBag, Plus, Minus } from "lucide-react";
import { useCartStore } from "../../stores/cart.store";
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
  whatsappNumber?: string;
  brandName?: string;
  isSoldOut: boolean;
  isReserved: boolean;
  photoUrl?: string | null;
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
  isSoldOut,
  photoUrl,
}: ProductOrderSectionProps) {
  const { addItem } = useCartStore();

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

  const selectedSizeItem = currentSizes.find((s) => s.size === selectedSize);
  const maxStock = selectedSizeItem ? selectedSizeItem.stock : 0;
  const isSelectedOutOfStock = maxStock <= 0;

  // Selector de cantidad (no pudiendo superar el stock disponible, BR-40)
  const [quantity, setQuantity] = useState<number>(1);

  // Al cambiar de color, ajustar el talle seleccionado y reiniciar cantidad
  const handleColorChange = (colorId: number) => {
    setSelectedColorId(colorId);
    const newColor = colors.find((c) => c.id === colorId);
    if (newColor && newColor.sizes.length > 0) {
      const inStock = newColor.sizes.find((s) => s.stock > 0);
      const chosenSize = inStock ? inStock.size : newColor.sizes[0].size;
      setSelectedSize(chosenSize);
      const chosenStock = inStock ? inStock.stock : newColor.sizes[0].stock;
      setQuantity(chosenStock > 0 ? 1 : 0);
    }
  };

  const handleSizeSelect = (newSize: string, sizeStock: number) => {
    setSelectedSize(newSize);
    if (sizeStock <= 0) {
      setQuantity(0);
    } else {
      setQuantity((prev) => Math.max(1, Math.min(prev, sizeStock)));
    }
  };

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => Math.min(maxStock, prev + 1));
  };

  const handleAddToCart = () => {
    if (isSoldOut || isSelectedOutOfStock || quantity <= 0) return;

    addItem(
      {
        productId,
        code,
        formattedCode,
        title,
        colorName: activeColor?.name || "Único",
        hexCode: activeColor?.hexCode,
        size: selectedSize || "ÚNICO",
        maxStock,
        unitPriceCents: priceCents,
        currency,
        photoUrl: photoUrl || null,
      },
      quantity
    );
  };

  const hasMultipleColors = colors.length > 1;
  const hasMultipleSizes = currentSizes.length > 1;
  const hasSingleSize = currentSizes.length === 1;

  const isActionDisabled = isSoldOut || isSelectedOutOfStock || maxStock <= 0;

  return (
    <div className="mt-6 rounded-2xl border border-[#e7e2da] bg-white p-5 sm:p-6 shadow-2xs">
      {/* Selector de Color si el producto tiene más de 1 color */}
      {hasMultipleColors && (
        <div className="mb-6">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
              Color:
            </span>
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
            {selectedSizeItem && selectedSizeItem.stock > 0 && selectedSizeItem.stock <= 2 && (
              <span className="text-[11px] font-semibold text-amber-700">
                ¡Últimas {selectedSizeItem.stock} unidades!
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
                  onClick={() => handleSizeSelect(s.size, s.stock)}
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

      {/* Selector de Cantidad con tope de inventario (BR-40) */}
      {!isActionDisabled && (
        <div className="mb-6 flex items-center justify-between border-t border-[#e7e2da] pt-4">
          <div>
            <span className="block font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
              Cantidad:
            </span>
            <span className="text-[11px] text-stone-500">
              {maxStock > 1 ? `${maxStock} unidades disponibles` : "Última unidad disponible"}
            </span>
          </div>

          <div className="flex items-center rounded-xl border border-[#d8d2c7] bg-[#faf8f5]">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={handleDecreaseQuantity}
              aria-label="Disminuir cantidad"
              className="p-2 text-stone-600 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-mono text-sm font-bold text-stone-900">
              {quantity}
            </span>
            <button
              type="button"
              disabled={quantity >= maxStock}
              onClick={handleIncreaseQuantity}
              aria-label="Aumentar cantidad"
              className="p-2 text-stone-600 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Botón principal: Agregar al Carrito / Bolsa (BR-40) */}
      <button
        type="button"
        disabled={isActionDisabled}
        onClick={handleAddToCart}
        aria-label="Agregar a la bolsa de compras"
        className={`w-full flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-xs font-bold tracking-wider uppercase transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-stone-900 ${
          isActionDisabled
            ? "border border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
            : "bg-stone-900 text-white hover:bg-stone-800 cursor-pointer scale-100 active:scale-98"
        }`}
      >
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        <span>
          {isSoldOut
            ? "Pieza Agotada"
            : isSelectedOutOfStock
            ? "Talle sin stock"
            : "Agregar a la bolsa"}
        </span>
      </button>

      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-center text-xs text-stone-500">
        <ShieldCheck className="h-4 w-4 text-[#926a3c]" />
        <span>Atención personalizada · Reserva y coordinación de envío directa</span>
      </div>
    </div>
  );
}
