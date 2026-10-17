import Link from "next/link";
import { Star, Sparkles } from "lucide-react";
import { Product } from "../../domain/product/types";
import { formatProductCode, getAvailableSizesWithStock } from "../../domain/product/rules";
import { formatPrice } from "../../lib/format/currency";
import { parseSizesList } from "../../lib/parser/product-parser";
import { FavoriteButton } from "./FavoriteButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
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
  const priceDisplay = formatPrice(product.priceCents, product.currency);
  const titleDisplay = product.title || `Pieza ${formattedCode}`;

  // Talles disponibles con stock
  const availableSizes =
    product.colors && product.colors.length > 0
      ? getAvailableSizesWithStock(product.colors)
      : parseSizesList(product.size);

  // Calcular si queda última unidad total
  const totalStock = product.colors && product.colors.length > 0
    ? product.colors.reduce((sum, c) => sum + c.sizes.reduce((sSum, s) => sSum + s.stock, 0), 0)
    : 1;

  const isLastUnit = !isSoldOut && !isReserved && totalStock === 1;

  const accessibleLabel = `${titleDisplay}, código ${formattedCode}, ${priceDisplay}${
    product.isFeatured ? ", producto destacado" : ""
  }${availableSizes.length > 0 ? `, talles ${availableSizes.join(", ")}` : ""}${
    isReserved ? ", estado reservada" : ""
  }${isSoldOut ? ", estado agotada" : ""}`;

  return (
    <article className="group relative flex flex-col h-full w-full min-w-0">
      <div className="relative flex flex-col h-full w-full justify-between overflow-hidden rounded-2xl border border-[#e7e2da] bg-white shadow-2xs transition-all duration-300 hover:border-stone-400 hover:shadow-md focus-within:ring-2 focus-within:ring-stone-900">
        {/* Botón de Guardar en Favoritos */}
        <FavoriteButton productId={product.id} productTitle={titleDisplay} />

        <Link
          href={href}
          prefetch={true}
          aria-label={accessibleLabel}
          className="flex flex-col h-full w-full justify-between focus:outline-none"
        >
          {/* Contenedor de Imagen Proporción 4:5 Compacta */}
          <div className="relative aspect-[4/5] w-full min-h-[200px] max-h-[360px] sm:min-h-[260px] sm:max-h-[400px] shrink-0 overflow-hidden bg-[#f5f2eb]">
            {mainPhoto ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mainPhoto}
                  alt={`Fotografía de ${titleDisplay}`}
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ease-out ${
                    secondaryPhoto ? "group-hover:opacity-0" : "group-hover:scale-105"
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
                <span className="font-serif text-3xl font-light text-stone-300">AURA</span>
              </div>
            )}

            {/* Badges de Estado y Destacado */}
            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50/95 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-amber-900 uppercase shadow-2xs backdrop-blur-xs">
                  <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" aria-hidden="true" />
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
          </div>

          {/* Ficha de Detalles (Texto legible >= 13px) */}
          <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 min-h-[105px]">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-medium text-stone-400">
                  {formattedCode}
                </span>
              </div>

              <h2 className="mt-0.5 line-clamp-1 font-serif text-base sm:text-lg font-normal tracking-wide text-stone-900 transition-colors group-hover:text-stone-700">
                {titleDisplay}
              </h2>

              {/* Muestras de colores con etiquetas legibles */}
              {product.colors && product.colors.length > 1 ? (
                <div
                  className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-[13px] text-stone-600"
                  title={`Colores: ${product.colors.map((c) => c.name).join(", ")}`}
                >
                  <div className="flex items-center -space-x-1">
                    {product.colors.slice(0, 4).map((c) => (
                      <span
                        key={c.id}
                        className="inline-block h-3 w-3 rounded-full border border-white shadow-2xs"
                        style={{ backgroundColor: c.hexCode || "#78716c" }}
                        aria-hidden="true"
                        title={c.name}
                      />
                    ))}
                  </div>
                  <span>{product.colors.length} colores</span>
                </div>
              ) : (
                <div className="mt-1.5 h-4" aria-hidden="true" />
              )}
            </div>

            {/* Precio y Talles */}
            <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-[#f0ece1] pt-2.5">
              <span className="font-serif text-base sm:text-lg font-semibold tracking-tight text-stone-900 shrink-0">
                {priceDisplay}
              </span>

              {availableSizes.length > 0 && (
                <span
                  title={`Talles disponibles: ${availableSizes.join(", ")}`}
                  className="max-w-[60%] truncate shrink-0 rounded-md border border-[#e7e2da] bg-[#faf8f5] px-2 py-0.5 font-mono text-xs sm:text-[13px] font-medium text-stone-700"
                >
                  Talles: {availableSizes.join(" · ")}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </article>
  );
}
