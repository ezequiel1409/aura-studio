import { Loader2 } from "lucide-react";

/**
 * Fallback de carga instantáneo para la página principal del catálogo (AR-11).
 * Activado automáticamente por Next.js App Router ante transiciones de ruta hacia "/".
 */
export default function CatalogLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen bg-[#faf8f5] text-[#1c1917]"
    >
      {/* Header simulado */}
      <header className="sticky top-0 z-40 border-b border-[#e7e2da] bg-[#faf8f5]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="space-y-1">
            <div className="h-6 w-36 animate-pulse rounded bg-[#e7e2da]" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-[#f0ece1]" />
          </div>
          <div className="h-9 w-44 sm:w-72 animate-pulse rounded-full bg-[#f0ece1]" />
        </div>
      </header>

      {/* Contenido principal en carga */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Banner editorial en carga con spinner central */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-10 shadow-xs">
          <div className="max-w-2xl space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-[#f0ece1]" />
            <div className="h-8 w-72 sm:w-96 animate-pulse rounded-lg bg-[#e7e2da]" />
            <div className="h-4 w-full max-w-lg animate-pulse rounded bg-[#f5f2eb]" />
          </div>

          {/* Spinner flotante sutil indicando carga de catálogo */}
          <div className="mt-4 flex items-center gap-2 text-[#926a3c]">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <span className="font-serif text-xs font-medium tracking-wide">
              Cargando piezas del catálogo...
            </span>
          </div>
        </div>

        {/* Categorías pill skeleton */}
        <div className="mb-4 flex gap-2 overflow-hidden py-2" aria-hidden="true">
          <div className="h-9 w-20 animate-pulse rounded-full bg-[#1c1917]/20" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-[#f0ece1]" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-[#f0ece1]" />
          <div className="h-9 w-32 animate-pulse rounded-full bg-[#f0ece1]" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-[#f0ece1]" />
        </div>

        {/* Barra de orden y conteo skeleton */}
        <div className="mb-6 flex items-center justify-between border-y border-[#e7e2da] py-3">
          <div className="h-4 w-28 animate-pulse rounded bg-[#f0ece1]" />
          <div className="h-8 w-40 animate-pulse rounded-lg bg-[#f0ece1]" />
        </div>

        {/* Grilla de productos skeleton con aspecto lookbook (3:4) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-xl border border-[#e7e2da] bg-white shadow-2xs"
            >
              <div className="relative aspect-[3/4] w-full animate-pulse bg-[#f5f2eb]" />
              <div className="space-y-2 p-3.5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[#f0ece1]" />
                <div className="flex items-center justify-between border-t border-[#f0ece1] pt-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-[#f0ece1]" />
                  <div className="h-4 w-1/4 animate-pulse rounded bg-[#f5f2eb]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Anuncio accesible oculto para lectores de pantalla */}
      <span className="sr-only">Cargando catálogo completo de Aura Studio</span>
    </div>
  );
}
