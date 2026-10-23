import Link from "next/link";
import { ArrowRight, Percent } from "lucide-react";
import { NavigationSection } from "../../domain/navigation/types";

export interface FeaturedSectionsMosaicProps {
  sections: NavigationSection[];
}

export function FeaturedSectionsMosaic({
  sections,
}: FeaturedSectionsMosaicProps) {
  const mosaicSections = sections
    .filter((s) => s.isVisible && s.showInHomeMosaic)
    .slice(0, 4);

  if (mosaicSections.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="home-sections-mosaic-heading"
      className="space-y-4"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2
            id="home-sections-mosaic-heading"
            className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-stone-900"
          >
            Explorar por sección
          </h2>
          <p className="text-xs text-stone-500">
            Colecciones curadas listas para recorrer en el catálogo
          </p>
        </div>

        <Link prefetch={false}
          href="/catalogo"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 underline underline-offset-4"
        >
          <span>Ver catálogo completo</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 ${
          mosaicSections.length === 2
            ? "sm:grid-cols-2"
            : mosaicSections.length === 3
            ? "sm:grid-cols-3"
            : "sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {mosaicSections.map((sec) => {
          const isSale =
            sec.ruleType === "SALE" || sec.slug.toLowerCase() === "sale";

          return (
            <Link prefetch={false}
              key={sec.slug}
              href={`/${sec.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-[#e7e2da] bg-[#f3efe6] min-h-[180px] sm:min-h-[220px] p-6 flex flex-col justify-between transition-all hover:border-stone-500 hover:shadow-md focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              {sec.bannerImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sec.bannerImageUrl}
                    alt={sec.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Contraste >= 4.5:1 para texto sobre imagen */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/45 to-stone-950/20"
                    aria-hidden="true"
                  />
                </>
              ) : (
                <div
                  className={`absolute inset-0 ${
                    isSale
                      ? "bg-gradient-to-br from-rose-950 via-rose-900 to-stone-900"
                      : "bg-gradient-to-br from-[#faf8f5] via-[#f0eadf] to-[#e4dccb]"
                  }`}
                  aria-hidden="true"
                />
              )}

              <div className="relative z-10 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                    sec.bannerImageUrl || isSale
                      ? "bg-white/15 text-white border border-white/25"
                      : "bg-white/90 text-stone-700 border border-[#d8d2c7]"
                  }`}
                >
                  {isSale && <Percent className="h-3 w-3" aria-hidden="true" />}
                  <span>Colección</span>
                </span>

                {sec.productCount !== undefined && sec.productCount > 0 && (
                  <span
                    className={`font-mono text-xs ${
                      sec.bannerImageUrl || isSale
                        ? "text-stone-200"
                        : "text-stone-500"
                    }`}
                  >
                    {sec.productCount} piezas
                  </span>
                )}
              </div>

              <div className="relative z-10 flex items-end justify-between gap-2 pt-8">
                <div>
                  <h3
                    className={`font-serif text-2xl sm:text-3xl font-normal tracking-wider uppercase ${
                      sec.bannerImageUrl || isSale
                        ? "text-white"
                        : "text-stone-900"
                    }`}
                  >
                    {sec.name}
                  </h3>
                  <p
                    className={`mt-1 text-xs ${
                      sec.bannerImageUrl || isSale
                        ? "text-stone-200"
                        : "text-stone-600"
                    }`}
                  >
                    {isSale
                      ? "Precios especiales sobre piezas seleccionadas"
                      : `Explorar ${sec.name.toLowerCase()}`}
                  </p>
                </div>

                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-1 ${
                    sec.bannerImageUrl || isSale
                      ? "bg-white text-stone-950"
                      : "bg-stone-900 text-white"
                  }`}
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

