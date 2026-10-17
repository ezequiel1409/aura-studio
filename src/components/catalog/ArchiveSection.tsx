import { Product } from "../../domain/product/types";
import { formatProductCode } from "../../domain/product/rules";
import { formatPrice } from "../../lib/format/currency";

interface ArchiveSectionProps {
  soldProducts?: Product[];
}

export function ArchiveSection({ soldProducts = [] }: ArchiveSectionProps) {
  // Muestra piezas vendidas reales si existen, o piezas históricas del archivo
  const displayItems = soldProducts.length > 0 ? soldProducts.slice(0, 4) : [
    {
      id: 991,
      code: 104,
      title: "Tapado Trench Gabardina Británica",
      priceCents: 8500000,
      currency: "ARS",
      photoUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: 992,
      code: 105,
      title: "Camisa Seda Lavada Nácar",
      priceCents: 3200000,
      currency: "ARS",
      photoUrl: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: 993,
      code: 106,
      title: "Pantalón Sastrero Pinzado Marfil",
      priceCents: 4500000,
      currency: "ARS",
      photoUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <section
      aria-label="Archivo de piezas históricas vendidas"
      className="my-16 sm:my-20 rounded-2xl border border-[#e7e2da] bg-[#faf8f5] p-6 sm:p-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#926a3c]">
            Showroom & Archivo
          </span>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-light text-stone-900 tracking-wide">
            Piezas del Archivo
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-600 max-w-lg leading-relaxed">
            Prendas que formaron parte de nuestras colecciones pasadas y ya encontraron dueño. Cada pieza es irrepetible y no vuelve a confeccionarse idéntica.
          </p>
        </div>

        <span className="font-mono text-xs text-stone-500 bg-white border border-[#e7e2da] px-3 py-1.5 rounded-full w-fit">
          Curaduría Histórica
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
        {displayItems.map((item) => {
          const formattedCode = formatProductCode(item.code);
          const photo = "photos" in item && Array.isArray((item as any).photos) && (item as any).photos.length > 0
            ? (item as any).photos[0].keyThumb || (item as any).photos[0].keyFull
            : (item as any).photoUrl;

          return (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-[#e7e2da] bg-white opacity-85 hover:opacity-100 transition-opacity"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-100">
                {photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photo}
                    alt={`Pieza archivada ${item.title}`}
                    className="h-full w-full object-cover grayscale-40"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-stone-300">
                    AURA
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="rounded-full bg-stone-900/90 border border-stone-800 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-stone-100 uppercase shadow-2xs">
                    Vendida · En Archivo
                  </span>
                </div>
              </div>

              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <span className="font-mono text-[10px] text-stone-400">
                    {formattedCode}
                  </span>
                  <h3 className="line-clamp-1 font-serif text-sm sm:text-base font-normal text-stone-700">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-2 pt-2 border-t border-[#f0ece1] flex items-center justify-between text-xs text-stone-500">
                  <span className="font-serif">
                    {formatPrice(item.priceCents, item.currency)}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-stone-400">
                    Pieza única
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

