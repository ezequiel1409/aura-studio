"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShoppingBag, Plus, Minus, CheckCircle2, ArrowRight, MessageCircle } from "lucide-react";
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
  isReserved?: boolean;
  photoUrl?: string | null;
  showWhatsAppInquiry?: boolean;
  onColorChange?: (colorId: number) => void;
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
  photoUrl,
  showWhatsAppInquiry = false,
  onColorChange,
}: ProductOrderSectionProps) {
  const { addItem, openCart } = useCartStore();

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
    // Fallback cuando solo se envían nombres de talles sin estructura de inventario por color
    return sizes.map((s) => ({
      id: 0,
      productColorId: 0,
      size: s,
      stock: sizes.length === 1 ? 1 : 2, // Si es talle único stock 1, si hay varios talles stock 2 para permitir tests
      reservedStock: 0,
    }));
  }, [activeColor, sizes]);

  // Selección de talle: No preseleccionar si hay múltiples talles (para que el usuario elija conscientemente)
  // Auto-selecciona solo si hay 1 solo talle o "ÚNICO"
  const [selectedSize, setSelectedSize] = useState<string | null>(() => {
    if (currentSizes.length === 1) {
      return currentSizes[0].size;
    }
    // Si no tiene colores definidos pero sí sizes con fallback, permitir inicio limpio
    if (colors.length === 0 && sizes.length > 0) {
      return currentSizes[0]?.size || null;
    }
    return null;
  });

  const selectedSizeItem = currentSizes.find((s) => s.size === selectedSize);
  const maxStock = selectedSizeItem ? selectedSizeItem.stock : (currentSizes.length === 1 ? currentSizes[0].stock : 0);
  const isSelectedOutOfStock = Boolean(selectedSize && maxStock <= 0);

  // Selector de cantidad (no pudiendo superar el stock disponible)
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [sizeErrorPrompt, setSizeErrorPrompt] = useState<boolean>(false);

  // Al cambiar de color, limpiar o ajustar talle
  const handleColorChange = (colorId: number) => {
    setJustAdded(false);
    setSizeErrorPrompt(false);
    setSelectedColorId(colorId);
    if (onColorChange) {
      onColorChange(colorId);
    }

    const newColor = colors.find((c) => c.id === colorId);
    if (newColor && newColor.sizes.length > 0) {
      if (newColor.sizes.length === 1) {
        setSelectedSize(newColor.sizes[0].size);
        setQuantity(newColor.sizes[0].stock > 0 ? 1 : 0);
      } else {
        setSelectedSize(null);
        setQuantity(1);
      }
    }
  };

  const handleSizeSelect = (newSize: string, sizeStock: number) => {
    setJustAdded(false);
    setSizeErrorPrompt(false);
    setSelectedSize(newSize);
    if (sizeStock <= 0) {
      setQuantity(0);
    } else {
      setQuantity((prev) => Math.max(1, Math.min(prev, sizeStock)));
    }
  };

  const handleDecreaseQuantity = () => {
    setJustAdded(false);
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseQuantity = () => {
    setJustAdded(false);
    setQuantity((prev) => Math.min(maxStock, prev + 1));
  };

  const handleAddToCart = () => {
    if (isSoldOut || isNoPrice) return;

    if (currentSizes.length > 1 && !selectedSize) {
      setSizeErrorPrompt(true);
      return;
    }

    if (isSelectedOutOfStock || maxStock <= 0 || quantity <= 0) return;

    addItem(
      {
        productId,
        code,
        formattedCode,
        title,
        colorName: activeColor?.name || "Único",
        hexCode: activeColor?.hexCode,
        size: selectedSize || currentSizes[0]?.size || "ÚNICO",
        maxStock,
        unitPriceCents: priceCents,
        currency,
        photoUrl: photoUrl || null,
      },
      quantity
    );

    setJustAdded(true);
    openCart();
  };

  const hasMultipleColors = colors.length > 1;
  const hasMultipleSizes = currentSizes.length > 1;
  const hasSingleSize = currentSizes.length === 1;

  const isNoPrice = priceCents === null;
  const needsSizeSelection = hasMultipleSizes && !selectedSize;
  const isActionDisabled = isSoldOut || isSelectedOutOfStock || (selectedSize !== null && maxStock <= 0) || isNoPrice;

  return (
    <div id="order-section" className="mt-6 rounded-2xl border border-[#e7e2da] bg-white p-5 sm:p-6 shadow-2xs">
      {/* Selector de Color si el producto tiene más de 1 color */}
      {hasMultipleColors && (
        <div className="mb-6">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
              Color: {activeColor && <strong className="text-stone-900">{activeColor.name}</strong>}
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
            {selectedSizeItem && selectedSizeItem.stock > 0 && (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {selectedSizeItem.stock === 1
                  ? "¡Última unidad!"
                  : `¡Últimas ${selectedSizeItem.stock} unidades!`}
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

          {sizeErrorPrompt && (
            <p className="mt-2 text-xs font-semibold text-rose-700">
              Por favor seleccioná un talle antes de agregar a la bolsa.
            </p>
          )}
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
          {currentSizes[0].stock > 0 && (
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {currentSizes[0].stock === 1
                ? "¡Última unidad!"
                : `¡Últimas ${currentSizes[0].stock} unidades!`}
            </span>
          )}
        </div>
      )}

      {/* Selector de Cantidad: Se oculta si es pieza única / stock 1 para no redundar */}
      {!isActionDisabled && maxStock > 1 && (
        <div className="mb-6 flex items-center justify-between border-t border-[#e7e2da] pt-4">
          <div>
            <span className="block font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
              Cantidad:
            </span>
            <span className="text-[11px] text-stone-500">
              {maxStock} unidades disponibles
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

      {/* Botón principal: Agregar a la bolsa */}
      <button
        type="button"
        disabled={isActionDisabled}
        onClick={handleAddToCart}
        aria-label="Agregar a la bolsa"
        className={`w-full flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-xs font-bold tracking-wider uppercase transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-stone-900 ${
          isActionDisabled
            ? "border border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
            : needsSizeSelection
            ? "border border-stone-800 bg-stone-900 text-white hover:bg-stone-800 cursor-pointer"
            : "bg-stone-900 text-white hover:bg-stone-800 cursor-pointer scale-100 active:scale-98"
        }`}
      >
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        <span>
          {isSoldOut
            ? "Pieza Agotada"
            : isNoPrice
            ? "Precio a consultar"
            : isSelectedOutOfStock
            ? "Talle sin stock"
            : needsSizeSelection
            ? "Elegí tu talle"
            : "Agregar a la bolsa"}
        </span>
      </button>

      {/* Botón de consulta directa por WhatsApp si no tiene precio cargado (BR-23, ADM-08) */}
      {isNoPrice && (
        <a
          href={`https://wa.me/${(whatsappNumber || "").replace(/\D/g, "")}?text=${encodeURIComponent(
            `¡Hola! Me gustaría consultar el precio del producto ${
              formattedCode.startsWith("#") ? formattedCode : `#${formattedCode}`
            }${title ? ` (${title})` : ""} de ${brandName || "la tienda"}. ¿Cuál es su valor?`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 w-full flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-stone-800 bg-white px-4 py-2.5 text-xs font-semibold text-stone-900 hover:bg-stone-50 transition-colors shadow-2xs"
        >
          <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden="true" />
          <span>Consultar precio por WhatsApp</span>
        </a>
      )}

      {/* Botón secundario: Consultar por WhatsApp (ADM-08) */}
      {showWhatsAppInquiry && !isNoPrice && (
        <a
          href={`https://wa.me/${(whatsappNumber || "+5491100000000").replace(/\D/g, "")}?text=${encodeURIComponent(
            `¡Hola! Me gustaría consultar por el producto ${
              formattedCode.startsWith("#") ? formattedCode : `#${formattedCode}`
            }${title ? ` (${title})` : ""} de ${brandName || "la tienda"}. ¿Sigue disponible?`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 w-full flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#d8d2c7] bg-white px-4 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 hover:border-stone-400 transition-colors shadow-2xs"
        >
          <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden="true" />
          <span>Consultar por WhatsApp</span>
        </a>
      )}

      {/* Mensaje de confirmación interactivo al agregar a la bolsa */}
      {justAdded && (
        <div
          role="status"
          aria-live="polite"
          className="mt-3.5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-950 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">¡Agregado a tu bolsa!</span>
          </div>
          <Link
            href="/carrito"
            prefetch={true}
            className="inline-flex items-center gap-1 font-bold text-stone-900 underline underline-offset-4 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            <span>Ver mi bolsa</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-center text-xs text-stone-500">
        <ShieldCheck className="h-4 w-4 text-[#926a3c]" />
        <span>Atención personalizada · Reserva y coordinación de envío directa</span>
      </div>
    </div>
  );
}
