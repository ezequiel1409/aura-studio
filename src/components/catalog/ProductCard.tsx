"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, ShoppingBag, Sparkles, Star, X } from "lucide-react";
import { Product } from "../../domain/product/types";
import {
  formatProductCode,
  getAvailableSizesWithStock,
} from "../../domain/product/rules";
import { formatPrice } from "../../lib/format/currency";
import { parseSizesList } from "../../lib/parser/product-parser";
import { useCartStore } from "../../stores/cart.store";
import { FavoriteButton } from "./FavoriteButton";

export interface ProductCardProps {
  product: Product;
  priority?: boolean;
  cardId?: string;
}

export function ProductCard({
  product,
  priority = false,
  cardId,
}: ProductCardProps) {
  const { addItem } = useCartStore();

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [addingSize, setAddingSize] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [stockErrorMsg, setStockErrorMsg] = useState<string | null>(null);
  const [depletedSizes, setDepletedSizes] = useState<Record<string, boolean>>(
    {}
  );
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showSizePickerDesktop, setShowSizePickerDesktop] = useState(false);

  const formattedCode = formatProductCode(product.code);
  const paddedCode = product.code.toString().padStart(3, "0");
  const href = `/p/${paddedCode}`;

  const mainPhoto =
    product.photos && product.photos.length > 0
      ? product.photos[0].keyThumb || product.photos[0].keyFull
      : null;

  const secondaryPhoto =
    product.photos && product.photos.length > 1
      ? product.photos[1].keyThumb || product.photos[1].keyFull
      : null;

  const isSoldOut = product.status === "SOLD_OUT";
  const isReserved = product.status === "RESERVED";
  const canPurchase =
    !isSoldOut && !isReserved && product.priceCents !== null && product.priceCents > 0;

  const priceDisplay = formatPrice(product.priceCents, product.currency);
  const hasDiscount =
    product.compareAtPriceCents !== null &&
    product.compareAtPriceCents !== undefined &&
    product.priceCents !== null &&
    product.compareAtPriceCents > product.priceCents;

  const comparePriceDisplay = hasDiscount
    ? formatPrice(product.compareAtPriceCents!, product.currency)
    : null;

  const discountPercent =
    hasDiscount && product.compareAtPriceCents
      ? Math.round(
          ((product.compareAtPriceCents - (product.priceCents || 0)) /
            product.compareAtPriceCents) *
            100
        )
      : 0;

  // Es "Nuevo" si fue publicado en los últimos 30 días
  const isNew = (() => {
    const pubStr = product.publishedAt || product.createdAt;
    if (!pubStr) return false;
    const pubMs = new Date(pubStr).getTime();
    if (Number.isNaN(pubMs)) return false;
    const daysDiff = (Date.now() - pubMs) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  })();

  const titleDisplay = product.title || `Pieza ${formattedCode}`;

  // Talles disponibles con stock
  const availableSizes =
    product.colors && product.colors.length > 0
      ? getAvailableSizesWithStock(product.colors)
      : parseSizesList(product.size);

  const activeColor =
    product.colors && product.colors.length > 0
      ? product.colors[selectedColorIdx] || product.colors[0]
      : {
          id: 0,
          productId: product.id,
          name: "Único",
          hexCode: null,
          position: 0,
          sizes: availableSizes.map((sz, i) => ({
            id: i,
            productColorId: 0,
            size: sz,
            stock: 1,
          })),
        };

  // Calcular si queda última unidad total
  const totalStock =
    product.colors && product.colors.length > 0
      ? product.colors.reduce(
          (sum, c) => sum + c.sizes.reduce((sSum, s) => sSum + s.stock, 0),
          0
        )
      : 1;

  const isLastUnit = !isSoldOut && !isReserved && totalStock === 1;

  // Determinar si es producto sin variantes (1 solo color y 1 solo talle)
  const isSingleVariant =
    (!product.colors || product.colors.length <= 1) &&
    activeColor.sizes.filter((s) => s.stock > 0).length <= 1;

  const handleQuickAddVariant = async (
    colorName: string,
    hexCode: string | null | undefined,
    sizeName: string
  ) => {
    if (!canPurchase || addingSize) return;
    setAddingSize(sizeName);
    setStockErrorMsg(null);

    try {
      const res = await fetch("/api/catalog/validate-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          colorName,
          size: sizeName,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.available || data.stock <= 0) {
        setDepletedSizes((prev) => ({
          ...prev,
          [`${colorName}__${sizeName}`]: true,
        }));
        setStockErrorMsg(
          data.reason || `El talle ${sizeName} acaba de agotarse.`
        );
        return;
      }

      addItem(
        {
          productId: product.id,
          code: product.code,
          formattedCode,
          title: product.title,
          colorName,
          hexCode: hexCode || null,
          size: sizeName,
          maxStock: data.stock,
          unitPriceCents: product.priceCents,
          currency: product.currency,
          photoUrl: mainPhoto,
        },
        1
      );

      setAddedSuccess(true);
      setShowSizePickerDesktop(false);
      setMobileSheetOpen(false);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 1500);
    } catch {
      // Fallback local si no hay red
      const szObj = activeColor.sizes.find((s) => s.size === sizeName);
      addItem(
        {
          productId: product.id,
          code: product.code,
          formattedCode,
          title: product.title,
          colorName,
          hexCode: hexCode || null,
          size: sizeName,
          maxStock: szObj?.stock || 1,
          unitPriceCents: product.priceCents,
          currency: product.currency,
          photoUrl: mainPhoto,
        },
        1
      );
      setAddedSuccess(true);
      setShowSizePickerDesktop(false);
      setMobileSheetOpen(false);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 1500);
    } finally {
      setAddingSize(null);
    }
  };

  const handlePrimaryAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canPurchase) return;

    if (isSingleVariant) {
      const firstAvailSize =
        activeColor.sizes.find((s) => s.stock > 0)?.size ||
        availableSizes[0] ||
        "ÚNICO";
      handleQuickAddVariant(
        activeColor.name,
        activeColor.hexCode,
        firstAvailSize
      );
      return;
    }

    // En celular (< 640px) abrimos la hoja inferior; en escritorio mostramos los chips en la tarjeta
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setMobileSheetOpen(true);
    } else {
      setShowSizePickerDesktop((prev) => !prev);
    }
  };

  const accessibleLabel = `${titleDisplay}, código ${formattedCode}, ${priceDisplay}${
    comparePriceDisplay ? `, antes ${comparePriceDisplay}` : ""
  }${product.isFeatured ? ", producto destacado" : ""}${
    availableSizes.length > 0 ? `, talles ${availableSizes.join(", ")}` : ""
  }${isReserved ? ", estado reservada" : ""}${
    isSoldOut ? ", estado agotada" : ""
  }`;

  const extraColorsCount =
    product.colors && product.colors.length > 4
      ? product.colors.length - 4
      : 0;

  return (
    <article
      id={cardId}
      tabIndex={cardId ? -1 : undefined}
      className="group relative flex flex-col h-full w-full min-w-0 focus:outline-none"
    >
      <div className="relative flex flex-col h-full w-full justify-between overflow-hidden rounded-2xl border border-[#e7e2da] bg-white shadow-2xs transition-all duration-300 hover:border-stone-400 hover:shadow-md focus-within:ring-2 focus-within:ring-stone-900">
        {/* Botón de Guardar en Favoritos */}
        <FavoriteButton productId={product.id} productTitle={titleDisplay} />

        {/* Imagen con relación de aspecto fija 4:5 (evita CLS) */}
        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#f5f2eb]">
          <Link
            href={href}
            prefetch={true}
            aria-label={accessibleLabel}
            className="block h-full w-full focus:outline-none"
          >
            {mainPhoto ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mainPhoto}
                  alt={`Fotografía de ${titleDisplay}`}
                  loading={priority ? "eager" : "lazy"}
                  fetchPriority={priority ? "high" : "auto"}
                  className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ease-out ${
                    secondaryPhoto
                      ? "group-hover:opacity-0"
                      : "group-hover:scale-105"
                  } ${isSoldOut ? "grayscale-30 opacity-70" : ""}`}
                />
                {secondaryPhoto && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={secondaryPhoto}
                    alt={`Detalle de ${titleDisplay}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                  />
                )}
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-stone-400">
                <span className="font-serif text-3xl font-light text-stone-300">
                  AURA
                </span>
              </div>
            )}
          </Link>

          {/* Etiquetas superiores (Nuevo, -XX %, Destacada, Última unidad, Estado) */}
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
            {hasDiscount && discountPercent > 0 && !isSoldOut && (
              <span className="rounded-full bg-rose-700 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-white uppercase shadow-2xs">
                -{discountPercent} %
              </span>
            )}

            {isNew && !isSoldOut && (
              <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white/95 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-stone-900 uppercase shadow-2xs">
                <Sparkles className="h-2.5 w-2.5 text-amber-600" aria-hidden="true" />
                Nuevo
              </span>
            )}

            {product.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50/95 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-amber-900 uppercase shadow-2xs backdrop-blur-xs">
                <Star
                  className="h-2.5 w-2.5 fill-amber-500 text-amber-500"
                  aria-hidden="true"
                />
                Destacada
              </span>
            )}

            {isLastUnit && (
              <span className="rounded-full border border-amber-300 bg-amber-50/95 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-amber-900 uppercase shadow-2xs">
                Última unidad
              </span>
            )}

            {isReserved && (
              <span className="rounded-full border border-amber-600/40 bg-amber-500/95 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-white uppercase shadow-2xs">
                Reservada
              </span>
            )}

            {isSoldOut && (
              <span className="rounded-full border border-stone-800 bg-stone-900/90 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-stone-100 uppercase shadow-2xs">
                Agotada
              </span>
            )}
          </div>

          {/* Selector rápido de talles sobre la tarjeta en escritorio */}
          {canPurchase && !isSingleVariant && showSizePickerDesktop && (
            <div
              role="region"
              aria-label={`Seleccionar talle para ${titleDisplay}`}
              className="absolute inset-x-2 bottom-2 z-20 rounded-xl border border-[#e7e2da] bg-[#faf8f5]/95 p-2.5 shadow-lg backdrop-blur-md space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                <span>Elegí un talle ({activeColor.name}):</span>
                <button
                  type="button"
                  onClick={() => setShowSizePickerDesktop(false)}
                  aria-label="Cerrar selector de talle"
                  className="p-0.5 text-stone-500 hover:text-stone-900"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeColor.sizes.map((sz) => {
                  const key = `${activeColor.name}__${sz.size}`;
                  const disabled = sz.stock <= 0 || depletedSizes[key];
                  const isAdding = addingSize === sz.size;
                  return (
                    <button
                      key={sz.size}
                      type="button"
                      disabled={disabled || Boolean(addingSize)}
                      onClick={() =>
                        handleQuickAddVariant(
                          activeColor.name,
                          activeColor.hexCode,
                          sz.size
                        )
                      }
                      className={`min-w-[36px] min-h-[34px] px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                        disabled
                          ? "border-stone-200 bg-stone-100 text-stone-400 line-through cursor-not-allowed"
                          : "border-stone-300 bg-white text-stone-900 hover:bg-stone-900 hover:text-white hover:border-stone-900 cursor-pointer"
                      }`}
                    >
                      {isAdding ? "..." : sz.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Ficha de Detalles */}
        <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-medium text-stone-400">
                {formattedCode}
              </span>
              {availableSizes.length > 0 && (
                <span
                  title={`Talles disponibles: ${availableSizes.join(", ")}`}
                  className="max-w-[65%] truncate font-mono text-[11px] font-medium text-stone-500"
                >
                  {availableSizes.join(" · ")}
                </span>
              )}
            </div>

            <Link
              href={href}
              className="mt-0.5 block font-serif text-base sm:text-lg font-normal tracking-wide text-stone-900 transition-colors hover:text-stone-700 line-clamp-1"
            >
              {titleDisplay}
            </Link>

            {/* Muestras de colores (hasta 4 más "+N") */}
            {product.colors && product.colors.length > 0 ? (
              <div
                className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-600"
                title={`Colores: ${product.colors.map((c) => c.name).join(", ")}`}
              >
                <div className="flex items-center gap-1">
                  {product.colors.slice(0, 4).map((c, idx) => (
                    <button
                      key={c.id || c.name}
                      type="button"
                      onClick={() => setSelectedColorIdx(idx)}
                      aria-label={`Color ${c.name}`}
                      title={c.name}
                      className={`inline-block h-3.5 w-3.5 rounded-full border shadow-2xs transition-transform ${
                        selectedColorIdx === idx
                          ? "ring-2 ring-stone-900 ring-offset-1 scale-110"
                          : "border-stone-300"
                      }`}
                      style={{ backgroundColor: c.hexCode || "#78716c" }}
                    />
                  ))}
                </div>
                {extraColorsCount > 0 ? (
                  <span className="text-[11px] font-semibold text-stone-600">
                    +{extraColorsCount}
                  </span>
                ) : product.colors.length > 1 ? (
                  <span className="text-[11px] text-stone-500">
                    {product.colors.length} colores
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-500">
                    {product.colors[0].name}
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-1.5 h-4" aria-hidden="true" />
            )}
          </div>

          {/* Precio (con precio anterior tachado si está en Sale) y Botón de Agregado Rápido */}
          <div className="mt-3 pt-2.5 border-t border-[#f0ece1] space-y-2">
            <div className="flex items-baseline flex-wrap gap-2">
              <span className="font-serif text-base sm:text-lg font-semibold tracking-tight text-stone-900">
                {priceDisplay}
              </span>
              {comparePriceDisplay && (
                <span className="font-sans text-xs text-stone-400 line-through">
                  {comparePriceDisplay}
                </span>
              )}
            </div>

            {stockErrorMsg && (
              <p
                role="alert"
                className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1"
              >
                {stockErrorMsg}
              </p>
            )}

            {canPurchase ? (
              <button
                type="button"
                onClick={handlePrimaryAddClick}
                disabled={Boolean(addingSize)}
                aria-label={
                  addedSuccess
                    ? `${titleDisplay} agregado a la bolsa`
                    : `Agregar ${titleDisplay} a la bolsa`
                }
                className={`w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer ${
                  addedSuccess
                    ? "bg-emerald-800 text-white"
                    : "bg-[#faf8f5] hover:bg-stone-900 text-stone-900 hover:text-white border border-[#d8d2c7] hover:border-stone-900"
                }`}
              >
                {addingSize ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Verificando...</span>
                  </>
                ) : addedSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Agregado ✓</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {isSingleVariant ? "Agregar a la bolsa" : "Elegir talle +"}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <Link
                href={href}
                className="w-full min-h-[38px] inline-flex items-center justify-center rounded-xl border border-[#e7e2da] bg-[#faf8f5] px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                {isSoldOut
                  ? "Ver pieza agotada"
                  : isReserved
                  ? "Pieza reservada"
                  : "Consultar pieza"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hoja inferior en celular para selección rápida de color y talle */}
      {mobileSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Seleccionar variante de ${titleDisplay}`}
          className="fixed inset-0 z-50 sm:hidden flex items-end justify-center"
        >
          <div
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs"
            onClick={() => setMobileSheetOpen(false)}
          />
          <div className="relative z-10 w-full rounded-t-3xl bg-[#faf8f5] border-t border-[#e7e2da] p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {mainPhoto && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={mainPhoto}
                    alt={titleDisplay}
                    className="h-16 w-13 rounded-xl object-cover border border-[#e7e2da]"
                  />
                )}
                <div>
                  <span className="font-mono text-[11px] text-stone-500">
                    {formattedCode}
                  </span>
                  <h3 className="font-serif text-base font-medium text-stone-900">
                    {titleDisplay}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-base font-semibold text-stone-900">
                      {priceDisplay}
                    </span>
                    {comparePriceDisplay && (
                      <span className="text-xs text-stone-400 line-through">
                        {comparePriceDisplay}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                aria-label="Cerrar selector"
                className="p-2 rounded-full text-stone-500 hover:text-stone-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {product.colors && product.colors.length > 1 && (
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-stone-700">
                  Color: {activeColor.name}
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c, idx) => (
                    <button
                      key={c.id || c.name}
                      type="button"
                      onClick={() => setSelectedColorIdx(idx)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        selectedColorIdx === idx
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-[#d8d2c7] bg-white text-stone-700"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-stone-700">
                Seleccioná tu talle para agregar a la bolsa:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {activeColor.sizes.map((sz) => {
                  const key = `${activeColor.name}__${sz.size}`;
                  const disabled = sz.stock <= 0 || depletedSizes[key];
                  return (
                    <button
                      key={sz.size}
                      type="button"
                      disabled={disabled || Boolean(addingSize)}
                      onClick={() =>
                        handleQuickAddVariant(
                          activeColor.name,
                          activeColor.hexCode,
                          sz.size
                        )
                      }
                      className={`min-h-[44px] rounded-xl text-xs font-mono font-bold border ${
                        disabled
                          ? "border-stone-200 bg-stone-100 text-stone-400 line-through"
                          : "border-[#d8d2c7] bg-white text-stone-900 active:bg-stone-900 active:text-white"
                      }`}
                    >
                      {sz.size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
