import Link from "next/link";
import { Product } from "../../domain/product/types";
import { formatProductCode } from "../../domain/product/rules";
import { formatPrice } from "../../lib/format/currency";

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

  const isSoldOut = product.status === "SOLD_OUT";
  const isReserved = product.status === "RESERVED";
  const priceDisplay = formatPrice(product.priceCents, product.currency);
  const titleDisplay = product.title || `Pieza ${formattedCode}`;

  const accessibleLabel = `${titleDisplay}, código ${formattedCode}, ${priceDisplay}${
    product.size ? `, talle ${product.size}` : ""
  }${isReserved ? ", estado reservada" : ""}${isSoldOut ? ", estado agotada" : ""}`;

  return (
    <article className="group relative flex flex-col">
      <Link
        href={href}
        aria-label={accessibleLabel}
        className="flex flex-col overflow-hidden rounded-xl border border-[#e7e2da] bg-white shadow-2xs transition-all duration-300 hover:border-stone-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-stone-900"
      >
        {/* Contenedor de Imagen tipo Lookbook */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f5f2eb]">
          {mainPhoto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mainPhoto}
              alt={`Fotografía de ${titleDisplay}`}
              loading="lazy"
              className={`h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 ${
                isSoldOut ? "grayscale-30 opacity-70" : ""
              }`}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-stone-400">
              <span className="font-serif text-3xl font-light text-stone-300">AURA</span>
              <span className="mt-1 font-mono text-xs tracking-wider">{formattedCode}</span>
            </div>
          )}

          {/* Badges de Estado de Alto Contraste (BR-02) */}
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
            {isReserved && (
              <span className="rounded-full border border-amber-600/40 bg-amber-500/95 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-white uppercase shadow-sm">
                Reservada
              </span>
            )}
            {isSoldOut && (
              <span className="rounded-full border border-stone-800 bg-stone-900/90 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-stone-100 uppercase shadow-sm">
                Agotada
              </span>
            )}
          </div>

          {/* Badge de Código #001 (BR-01) */}
          <span className="absolute bottom-2.5 right-2.5 rounded-md bg-stone-950/75 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-white backdrop-blur-xs">
            {formattedCode}
          </span>
        </div>

        {/* Ficha de Detalles */}
        <div className="flex flex-1 flex-col justify-between p-3.5">
          <div>
            <h2 className="line-clamp-1 font-serif text-base font-normal tracking-wide text-stone-900 transition-colors group-hover:text-amber-950">
              {titleDisplay}
            </h2>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-1 border-t border-[#f0ece1] pt-2">
            {/* Precio destacado */}
            <span className="font-serif text-base font-semibold tracking-tight text-stone-900">
              {priceDisplay}
            </span>

            {/* Talle si aplica */}
            {product.size && (
              <span className="rounded border border-[#e7e2da] bg-[#faf8f5] px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                T. {product.size}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
