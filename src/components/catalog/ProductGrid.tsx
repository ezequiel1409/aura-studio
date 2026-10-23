import Link from "next/link";
import { Sparkles, RefreshCw } from "lucide-react";
import { Product } from "../../domain/product/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center rounded-2xl border border-[#e7e2da] bg-white py-16 px-4 text-center shadow-2xs my-6"
      >
        <div className="rounded-full bg-[#f5f2eb] p-4 text-[#926a3c]">
          <Sparkles aria-hidden="true" className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-serif text-xl font-light text-stone-900">
          No encontramos piezas para este filtro
        </h3>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-500 sm:text-sm">
          Probá seleccionando otra categoría o restableciendo los filtros del catálogo para ver toda la colección disponible.
        </p>
        <div className="mt-6">
          <Link prefetch={false}
            href="/"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900 shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Ver todas las piezas</span>
          </Link>
        </div>
      </div>
    );
  }

  // Si hay menos de 8 productos, usamos 3 columnas en desktop para tarjetas más generosas
  // y evitar un producto huérfano solitario en la segunda fila (como sucede con 5 productos en 4 cols)
  const isFewProducts = products.length < 8;

  return (
    <div
      role="region"
      aria-label="Catálogo de productos disponibles"
      className={`grid grid-cols-2 gap-3.5 sm:gap-6 ${
        isFewProducts ? "md:grid-cols-3 lg:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-4"
      } items-stretch`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
