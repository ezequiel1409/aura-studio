import Link from "next/link";
import { ArrowLeft, Compass, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#faf8f5] px-4 py-16 text-[#1c1917] sm:px-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-lg rounded-3xl border border-[#e7e2da] bg-white p-8 sm:p-12 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5f2eb] text-amber-800 border border-[#e7e2da]">
          <Compass className="h-8 w-8 stroke-[1.5]" aria-hidden="true" />
        </div>

        <span className="mt-6 inline-block font-mono text-xs font-bold uppercase tracking-widest text-amber-800">
          Error 404
        </span>

        <h1 className="mt-2 font-serif text-2xl sm:text-3xl font-light text-stone-900">
          Página no encontrada
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-xs sm:text-sm leading-relaxed text-stone-600">
          La dirección que buscas no existe o el enlace ha cambiado. Podés volver al catálogo para descubrir nuestras piezas disponibles.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link prefetch={false}
            href="/"
            className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Volver al catálogo</span>
          </Link>

          <Link prefetch={false}
            href="/carrito"
            className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-2.5 text-xs font-semibold tracking-wider text-stone-700 uppercase transition-colors hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span>Ver mi carrito</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

