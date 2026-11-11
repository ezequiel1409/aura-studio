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
    .slice(0, 12);

  if (mosaicSections.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="home-sections-mosaic-heading"
      className="space-y-4 w-full"
    >
      <div className="flex items-end justify-between gap-3 w-full">
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

        <Link
          href="/catalogo"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 underline underline-offset-4"
        >
          <span>Ver catálogo completo</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-4 sm:gap-6 w-full">
        {mosaicSections.map((sec) => {
          const isSale =
            sec.ruleType === "SALE" || sec.slug.toLowerCase() === "sale";
          const layout = sec.layout || "2_col";
          const targetHref =
            sec.targetUrl && sec.targetUrl.trim()
              ? sec.targetUrl.trim()
              : `/${sec.slug}`;

          const colSpanClass =
            layout === "1_col"
              ? "col-span-12 min-h-[260px] sm:min-h-[340px] md:min-h-[400px]"
              : layout === "3_col"
              ? "col-span-12 sm:col-span-6 lg:col-span-4 min-h-[180px] sm:min-h-[220px]"
              : layout === "4_col"
              ? "col-span-12 sm:col-span-6 lg:col-span-3 min-h-[160px] sm:min-h-[200px]"
              : "col-span-12 sm:col-span-6 min-h-[180px] sm:min-h-[240px]";

          return (
            <Link
              key={sec.slug}
              href={targetHref}
              className={`group relative overflow-hidden rounded-3xl border border-[#e7e2da] bg-[#f3efe6] p-6 sm:p-8 flex flex-col justify-between transition-all hover:border-stone-500 hover:shadow-md focus-visible:outline-2 focus-visible:outline-stone-900 w-full ${colSpanClass}`}
            >
              {sec.bannerImageUrl || sec.coverImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sec.bannerImageUrl || sec.coverImageUrl!}
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
                    sec.bannerImageUrl || sec.coverImageUrl || isSale
                      ? "bg-white/15 text-white border border-white/25"
                      : "bg-white/90 text-stone-700 border border-[#d8d2c7]"
                  }`}
                >
                  {isSale && <Percent className="h-3 w-3" aria-hidden="true" />}
                  <span>{layout === "1_col" ? "Destacado" : "Colección"}</span>
                </span>

                {Boolean(sec.showProductCount || sec.ruleConfig?.showProductCount) &&
                  sec.productCount !== undefined &&
                  sec.productCount > 0 && (
                    <span
                      className={`font-mono text-xs ${
                        sec.bannerImageUrl || sec.coverImageUrl || isSale
                          ? "text-stone-200"
                          : "text-stone-500"
                      }`}
                    >
                      {`${sec.productCount} piezas`}
                    </span>
                  )}
              </div>

              <div className="relative z-10 flex items-end justify-between gap-2 pt-8">
                <div>
                  <h3
                    className={`font-serif ${
                      layout === "1_col"
                        ? "text-2xl sm:text-4xl"
                        : "text-2xl sm:text-3xl"
                    } font-normal tracking-wider uppercase ${
                      sec.bannerImageUrl || sec.coverImageUrl || isSale
                        ? "text-white"
                        : "text-stone-900"
                    }`}
                  >
                    {sec.name}
                  </h3>
                  <p
                    className={`mt-1 text-xs ${
                      sec.bannerImageUrl || sec.coverImageUrl || isSale
                        ? "text-stone-200"
                        : "text-stone-600"
                    }`}
                  >
                    {sec.subtitle && sec.subtitle.trim()
                      ? sec.subtitle.trim()
                      : isSale
                      ? "Precios especiales sobre piezas seleccionadas"
                      : `Explorar ${sec.name.toLowerCase()}`}
                  </p>
                </div>

                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-1 ${
                    sec.bannerImageUrl || sec.coverImageUrl || isSale
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
