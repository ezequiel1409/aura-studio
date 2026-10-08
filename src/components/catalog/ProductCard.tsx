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

  const mainPhoto = product.photos && product.photos.length > 0
    ? product.photos[0].keyThumb || product.photos[0].keyFull
    : null;

  const isSoldOut = product.status === "SOLD_OUT";
  const isReserved = product.status === "RESERVED";

  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-white transition-all duration-300 hover:shadow-md ${
        isSoldOut ? "opacity-75" : ""
      }`}
    >
      {/* Contenedor de Imagen */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        {mainPhoto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={mainPhoto}
            alt={product.title || `Prenda ${formattedCode}`}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-300">
            <span className="font-serif text-2xl font-light">{formattedCode}</span>
          </div>
        )}

        {/* Badge de Estado (BR-02) */}
        {isReserved && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase backdrop-blur-sm shadow-sm">
            Reservada
          </span>
        )}
        {isSoldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-stone-900/80 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase backdrop-blur-sm shadow-sm">
            Agotada
          </span>
        )}

        {/* Badge de Código (BR-01) */}
        <span className="absolute right-2.5 bottom-2.5 rounded-md bg-stone-950/60 px-2 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur-md">
          {formattedCode}
        </span>
      </div>

      {/* Información de la Prenda */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 font-sans text-sm font-normal text-stone-800 transition-colors group-hover:text-stone-950">
          {product.title || `Prenda ${formattedCode}`}
        </h3>

        <div className="mt-1 flex items-baseline justify-between gap-1">
          {/* Precio o Consultar precio (BR-20, BR-23) */}
          <span className="font-serif text-sm font-semibold text-stone-900">
            {formatPrice(product.priceCents, product.currency)}
          </span>

          {/* Talle si existe */}
          {product.size && (
            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
              T. {product.size}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
