"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { WhatsAppPaymentAdapter } from "../../infra/payments/whatsapp.adapter";
import { WhatsAppButton } from "./WhatsAppButton";

interface ProductOrderSectionProps {
  productId: number;
  code: number;
  formattedCode: string;
  title: string | null;
  priceCents: number | null;
  currency: string;
  sizes: string[];
  whatsappNumber: string;
  brandName: string;
  isSoldOut: boolean;
  isReserved: boolean;
}

export function ProductOrderSection({
  productId,
  code,
  formattedCode,
  title,
  priceCents,
  currency,
  sizes,
  whatsappNumber,
  brandName,
  isSoldOut,
}: ProductOrderSectionProps) {
  // Preselecciona el primer talle disponible si existen opciones
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length > 0 ? sizes[0] : null
  );

  const paymentAdapter = useMemo(
    () => new WhatsAppPaymentAdapter({ whatsappNumber, brandName }),
    [whatsappNumber, brandName]
  );

  const paymentAction = paymentAdapter.createPaymentAction({
    code,
    formattedCode,
    title,
    priceCents,
    currency,
    selectedSize: sizes.length > 0 ? selectedSize : null,
  });

  const hasMultipleSizes = sizes.length > 1;
  const hasSingleSize = sizes.length === 1;

  return (
    <div className="mt-6 rounded-2xl border border-[#e7e2da] bg-white p-5 sm:p-6 shadow-2xs">
      {/* Selector de talles interactivo cuando hay más de un talle disponible */}
      {hasMultipleSizes && (
        <div className="mb-6">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-sans text-xs font-semibold tracking-wider text-stone-800 uppercase">
              Talles disponibles:
            </span>
            {selectedSize && (
              <span className="text-xs text-stone-500">
                Seleccionado:{" "}
                <strong className="font-mono font-bold text-stone-900">
                  {selectedSize}
                </strong>
              </span>
            )}
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Selecciona tu talle"
          >
            {sizes.map((size) => {
              const isChosen = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={isChosen}
                  onClick={() => setSelectedSize(size)}
                  className={`flex min-h-[44px] min-w-[50px] items-center justify-center rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-stone-900 ${
                    isChosen
                      ? "bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/10 scale-102"
                      : "border border-[#e7e2da] bg-[#faf8f5] text-stone-700 hover:border-stone-400 hover:text-stone-900 hover:bg-white"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            Al tocar el talle se incluirá automáticamente en tu mensaje de WhatsApp.
          </p>
        </div>
      )}

      {/* Talle único informativo */}
      {hasSingleSize && (
        <div className="mb-5 flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
            Talle:
          </span>
          <span className="rounded-lg border border-[#e7e2da] bg-[#faf8f5] px-3 py-1 font-mono text-xs font-bold text-stone-900">
            {sizes[0] === "ÚNICO" ? "Talle Único" : sizes[0]}
          </span>
        </div>
      )}

      {/* Botón de WhatsApp con el logo oficial y mensaje enriquecido */}
      <WhatsAppButton
        productId={productId}
        url={paymentAction.url}
        label={isSoldOut ? "Pieza Agotada" : paymentAction.label}
        disabled={isSoldOut}
      />

      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-center text-xs text-stone-500">
        <ShieldCheck className="h-4 w-4 text-[#926a3c]" />
        <span>Atención personalizada · Reserva directa desde el showroom</span>
      </div>
    </div>
  );
}
