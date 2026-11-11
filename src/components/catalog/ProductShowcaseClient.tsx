"use client";

import { useState } from "react";
import { Star, Tag } from "lucide-react";
import { Product } from "../../domain/product/types";
import { formatPrice } from "../../lib/format/currency";
import { cleanProductDescription } from "../../lib/parser/product-parser";
import { ProductGallery } from "./ProductGallery";
import { ProductOrderSection } from "./ProductOrderSection";
import { ProductAccordions } from "./ProductAccordions";

interface ProductShowcaseClientProps {
  product: Product;
  formattedCode: string;
  sizes: string[];
  category: { id: number; name: string; slug: string } | null;
  brandName: string;
  whatsappNumber?: string;
  isReserved: boolean;
  isSoldOut: boolean;
  ordersPaused?: boolean;
  ordersPausedNotice?: string | null;
}

export function ProductShowcaseClient({
  product,
  formattedCode,
  sizes,
  category,
  brandName,
  whatsappNumber,
  isReserved,
  isSoldOut,
  ordersPaused = false,
  ordersPausedNotice,
}: ProductShowcaseClientProps) {
  // Inicialización del color activo según stock o primera variante
  const [selectedColorId, setSelectedColorId] = useState<number | null>(() => {
    if (product.colors && product.colors.length > 0) {
      const withStock = product.colors.find((c) => c.sizes.some((s) => s.stock > 0));
      return withStock ? withStock.id : product.colors[0].id;
    }
    return null;
  });

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-12 items-start">
      {/* Galería de Fotos interactiva sincronizada con variante (Columna Sticky en desktop) */}
      <div className="md:sticky md:top-20 z-10 w-full">
        <ProductGallery
          photos={product.photos || []}
          title={product.title}
          code={formattedCode}
          selectedColorId={selectedColorId}
        />
      </div>

      {/* Detalles de la Prenda y Selector de Variantes */}
      <div className="flex flex-col justify-start">
        {/* Cabecera con Código y Estado */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-md border border-[#e7e2da] bg-white px-2.5 py-1 text-xs font-medium text-stone-500">
            SKU: <strong className="font-mono font-bold text-stone-900">{formattedCode}</strong>
          </span>

          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs font-bold tracking-wider text-amber-900 uppercase">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
              Destacada
            </span>
          )}

          {isReserved && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold tracking-wider text-amber-900 uppercase">
              Reservada
            </span>
          )}

          {isSoldOut && (
            <span className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-bold tracking-wider text-stone-800 uppercase">
              Agotada
            </span>
          )}
        </div>

        {/* Título del Producto */}
        <h1 className="mt-4 font-serif text-3xl font-light tracking-wide text-stone-900 sm:text-4xl">
          {product.title || `Producto ${formattedCode}`}
        </h1>

        {/* Precio destacado */}
        <div className="mt-3.5">
          <span className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
            {formatPrice(product.priceCents, product.currency)}
          </span>
        </div>

        {/* Categoría si aplica */}
        {category && category.slug !== "sin-clasificar" && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-600">
            <Tag className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-medium text-stone-700">{category.name}</span>
          </div>
        )}

        {/* Selector interactivo de colores (sincroniza galería con slide suave), talles y adición a la bolsa */}
        <ProductOrderSection
          productId={product.id}
          code={product.code}
          formattedCode={formattedCode}
          title={product.title}
          priceCents={product.priceCents}
          currency={product.currency}
          colors={product.colors}
          sizes={sizes}
          whatsappNumber={whatsappNumber}
          brandName={brandName}
          isSoldOut={isSoldOut}
          isReserved={isReserved}
          photoUrl={product.photos?.[0]?.keyThumb || product.photos?.[0]?.keyFull || null}
          showWhatsAppInquiry={true}
          ordersPaused={ordersPaused}
          ordersPausedNotice={ordersPausedNotice}
          onColorChange={(colorId) => setSelectedColorId(colorId)}
        />

        {/* Aviso de Venta Final / Sin cambio ni devolución */}
        {product.allowReturn === false && (
          <div
            role="note"
            aria-label="Política especial de esta pieza"
            className="mt-4 rounded-xl border border-stone-200 bg-stone-100/90 p-3.5 text-xs text-stone-700 flex items-start gap-2.5 shadow-xs"
          >
            <span className="text-base leading-none select-none" aria-hidden="true">🚫</span>
            <div>
              <p className="font-semibold text-stone-900 tracking-wide">
                Pieza de Venta Final · Sin cambios ni devoluciones
              </p>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                Por tratarse de una pieza única, archivo o personalizada, este artículo no admite cambio ni devolución.
              </p>
            </div>
          </div>
        )}

        {/* Acordeones estructurados: Detalles, Medidas, Cuidados y Envíos */}
        <ProductAccordions
          rawDescription={cleanProductDescription(product.rawText, product.title)}
          categoryName={category?.name}
          allowReturn={product.allowReturn !== false}
        />
      </div>
    </div>
  );
}
