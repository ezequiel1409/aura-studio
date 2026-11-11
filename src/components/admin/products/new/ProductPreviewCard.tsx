"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, ImageIcon } from "lucide-react";
import { formatPriceARS } from "../../../../lib/format/currency";
import { ColorState } from "./StockVariantsStep";
import { PhotoPreview } from "./MediaUploaderStep";

interface ProductPreviewCardProps {
  title: string;
  pricePesos: string;
  isConsultPrice: boolean;
  categoryName: string;
  photos: PhotoPreview[];
  initialStatus: "AVAILABLE" | "RESERVED";
  isFeatured: boolean;
  colors: ColorState[];
}

export function ProductPreviewCard({
  title,
  pricePesos,
  isConsultPrice,
  categoryName,
  photos,
  initialStatus,
  isFeatured,
  colors,
}: ProductPreviewCardProps) {
  const [tab, setTab] = useState<"card" | "detail">("card");

  const numericPriceCents =
    !isConsultPrice && pricePesos.trim()
      ? Math.round(parseFloat(pricePesos.replace(/,/g, ".")) * 100)
      : null;

  const coverPhoto = photos.length > 0 ? photos[0].keyThumb : null;

  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md space-y-3.5">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Eye size={15} className="text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Vista Previa
          </h3>
        </div>

        <div className="flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-[11px]">
          <button
            type="button"
            onClick={() => setTab("card")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              tab === "card"
                ? "bg-zinc-800 text-amber-300"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => setTab("detail")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
              tab === "detail"
                ? "bg-zinc-800 text-amber-300"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Ficha
          </button>
        </div>
      </div>

      {tab === "card" ? (
        /* Tarjeta tipo Catálogo */
        <div className="max-w-[260px] mx-auto rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-lg p-3 space-y-2.5">
          <div className="relative aspect-4/5 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-850">
            {coverPhoto ? (
              <Image
                src={coverPhoto}
                alt={title || "Vista previa"}
                fill
                unoptimized
                className="object-cover"
                sizes="260px"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 space-y-1.5">
                <ImageIcon size={28} />
                <span className="text-[10px]">Sin foto de portada</span>
              </div>
            )}

            {isFeatured && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-300 text-zinc-950 text-[10px] font-bold shadow-xs">
                Destacado
              </span>
            )}

            <span
              className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-xs ${
                initialStatus === "AVAILABLE"
                  ? "bg-zinc-900/90 text-emerald-400"
                  : "bg-zinc-900/90 text-amber-300"
              }`}
            >
              {initialStatus === "AVAILABLE" ? "Disponible" : "Borrador"}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>{categoryName || "Categoría"}</span>
              <span>#---</span>
            </div>
            <h4 className="font-serif text-xs font-bold text-zinc-100 truncate">
              {title || "Nombre de la prenda"}
            </h4>
            <p className="font-mono text-sm font-bold text-zinc-100 lining-nums tabular-nums">
              {isConsultPrice
                ? "Consultar precio"
                : numericPriceCents !== null
                ? formatPriceARS(numericPriceCents)
                : "$ 0"}
            </p>
          </div>
        </div>
      ) : (
        /* Ficha detallada de la prenda */
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-3 text-xs">
          <div className="flex gap-3">
            <div className="relative w-16 aspect-4/5 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
              {coverPhoto ? (
                <Image
                  src={coverPhoto}
                  alt="Miniatura"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <ImageIcon size={16} />
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400">
                {initialStatus === "AVAILABLE" ? "Disponible" : "Borrador"}
              </span>
              <h4 className="font-serif text-xs font-bold text-zinc-100 truncate">
                {title || "Nombre de la prenda"}
              </h4>
              <p className="font-bold text-zinc-100 font-mono text-sm">
                {isConsultPrice
                  ? "Consultar precio"
                  : numericPriceCents !== null
                  ? formatPriceARS(numericPriceCents)
                  : "$ 0"}
              </p>
            </div>
          </div>

          {/* Talles disponibles */}
          <div className="space-y-1 pt-1 border-t border-zinc-900">
            <span className="text-[10px] text-zinc-400 font-medium">
              Talles en stock:
            </span>
            <div className="flex flex-wrap gap-1">
              {colors.flatMap((c) =>
                c.sizes.map((s) => (
                  <span
                    key={`${c.id}-${s.id}`}
                    className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300"
                  >
                    {s.size} ({s.stock})
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

