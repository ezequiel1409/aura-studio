import Link from "next/link";
import { Sparkles } from "lucide-react";
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
        className="flex flex-col items-center justify-center rounded-2xl border border-[#e7e2da] bg-white py-20 px-4 text-center shadow-2xs"
      >
        <div className="rounded-full bg-[#f5f2eb] p-4 text-[#926a3c]">
          <Sparkles aria-hidden="true" className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-serif text-lg font-light text-stone-900">
          No encontramos piezas para este criterio
        </h3>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-stone-500">
          Intenta seleccionando otra categoría o limpiando los términos de búsqueda.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex min-h-[40px] items-center rounded-full border border-stone-800 bg-stone-900 px-5 py-2 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            Ver todas las piezas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Listado de prendas disponibles"
      className="grid grid-cols-2 gap-3.5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
