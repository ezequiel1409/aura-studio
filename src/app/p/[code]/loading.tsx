import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

/**
 * Fallback de carga instantáneo para la ficha de producto /p/[code] (AR-11).
 * Activado inmediatamente por Next.js App Router cuando el usuario hace clic en una prenda,
 * eliminando cualquier sensación de congelamiento o refresco de pantalla.
 */
export default function ProductDetailLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen bg-[#faf8f5] pb-24 text-[#1c1917]"
    >
      {/* Barra superior de retorno */}
      <header
        role="navigation"
        aria-label="Navegación de retorno"
        className="sticky top-0 z-40 border-b border-[#e7e2da] bg-[#faf8f5]/90 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            aria-label="Volver al catálogo principal"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#e7e2da] bg-white px-4 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver al catálogo</span>
          </Link>

          <div className="flex items-center gap-2 text-[#926a3c]">
            <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <span className="font-serif text-xs font-medium tracking-wide">
              Cargando pieza...
            </span>
          </div>
        </div>
      </header>

      {/* Contenedor de la Ficha en Carga */}
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-12 items-start">
          {/* Columna Izquierda: Galería Skeleton con Spinner */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#e7e2da] bg-[#f5f2eb] animate-pulse flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#926a3c]/60 motion-reduce:animate-none" aria-hidden="true" />
            <span className="mt-3 font-serif text-xs font-medium tracking-widest text-stone-500 uppercase">
              Aura Studio
            </span>
          </div>

          {/* Columna Derecha: Detalles Skeleton */}
          <div className="flex flex-col justify-start space-y-4">
            {/* Badge de estado y código */}
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-16 animate-pulse rounded-md bg-[#e7e2da]" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-[#f0ece1]" />
            </div>

            {/* Título de la prenda */}
            <div className="space-y-2 pt-1">
              <div className="h-8 w-4/5 animate-pulse rounded-lg bg-[#e7e2da]" />
              <div className="h-6 w-1/2 animate-pulse rounded-lg bg-[#f0ece1]" />
            </div>

            {/* Precio */}
            <div className="h-9 w-36 animate-pulse rounded-md bg-[#e7e2da] mt-2" />

            {/* Selector de variantes skeleton */}
            <div className="space-y-3 rounded-2xl border border-[#e7e2da] bg-white p-5 shadow-2xs mt-4">
              <div className="h-3 w-28 animate-pulse rounded bg-[#f0ece1]" />
              <div className="flex gap-2">
                <div className="h-8 w-12 animate-pulse rounded-lg bg-[#f5f2eb]" />
                <div className="h-8 w-12 animate-pulse rounded-lg bg-[#f5f2eb]" />
                <div className="h-8 w-12 animate-pulse rounded-lg bg-[#f5f2eb]" />
              </div>

              {/* Botón de WhatsApp skeleton */}
              <div className="h-12 w-full animate-pulse rounded-full bg-[#f0ece1] mt-4" />
            </div>

            {/* Descripción skeleton */}
            <div className="space-y-2 border-t border-[#e7e2da] pt-6 mt-6">
              <div className="h-3 w-40 animate-pulse rounded bg-[#f0ece1]" />
              <div className="h-3.5 w-full animate-pulse rounded bg-[#f5f2eb]" />
              <div className="h-3.5 w-5/6 animate-pulse rounded bg-[#f5f2eb]" />
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-[#f5f2eb]" />
            </div>
          </div>
        </div>
      </main>

      {/* Anuncio accesible para tecnologías de asistencia */}
      <span className="sr-only">Cargando detalles de la pieza seleccionada</span>
    </div>
  );
}
