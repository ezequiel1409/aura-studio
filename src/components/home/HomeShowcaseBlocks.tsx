import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Percent,
  RefreshCw,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { Product } from "../../domain/product/types";
import { ProductCard } from "../catalog/ProductCard";

/**
 * Bloque 6: Recién llegados (hasta 8 productos más "Ver todos")
 */
export function NewArrivalsBlock({
  products,
  sectionHref = "/recien-llegados",
}: {
  products: Product[];
  sectionHref?: string;
}) {
  if (!products || products.length === 0) return null;

  return (
    <section aria-labelledby="home-new-arrivals-heading" className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-500">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            <span>Novedades</span>
          </div>
          <h2
            id="home-new-arrivals-heading"
            className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-stone-900"
          >
            Recién llegados
          </h2>
        </div>

        <Link prefetch={false}
          href={sectionHref}
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 underline underline-offset-4 shrink-0"
        >
          <span>Ver todos</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/**
 * Bloque 7: Destacados (Grilla de 4 a 8 productos de selección manual)
 */
export function FeaturedProductsBlock({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section aria-labelledby="home-featured-heading" className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-500">
            <Star
              className="h-3.5 w-3.5 fill-amber-500 text-amber-500"
              aria-hidden="true"
            />
            <span>Curaduría</span>
          </div>
          <h2
            id="home-featured-heading"
            className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-stone-900"
          >
            Piezas destacadas
          </h2>
        </div>

        <Link prefetch={false}
          href="/catalogo?orden=destacados"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 underline underline-offset-4 shrink-0"
        >
          <span>Ver todo</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/**
 * Bloque 8: Sale (Banner más hasta 4 productos con descuento automático por precio anterior)
 */
export function SaleBlock({
  products,
  sectionHref = "/sale",
}: {
  products: Product[];
  sectionHref?: string;
}) {
  if (!products || products.length === 0) return null;

  return (
    <section
      aria-labelledby="home-sale-heading"
      className="rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50/70 via-[#faf8f5] to-white p-5 sm:p-7 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-200/60 pb-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-700 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
            <Percent className="h-3 w-3" aria-hidden="true" />
            <span>Oportunidades</span>
          </span>
          <h2
            id="home-sale-heading"
            className="font-serif text-2xl sm:text-3xl font-normal tracking-wide text-stone-900"
          >
            Sale · Precios especiales
          </h2>
          <p className="text-xs text-stone-600">
            Piezas seleccionadas con descuento directo sobre su precio anterior.
          </p>
        </div>

        <Link prefetch={false}
          href={sectionHref}
          className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-full bg-rose-700 hover:bg-rose-800 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors self-start sm:self-center"
        >
          <span>Ver todo Sale</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/**
 * Bloque 9: Confianza (Envíos y retiro, cambios, medios de pago)
 */
export function TrustStripBlock({
  shippingText = "Envíos a todo el país y retiro sin cargo en nuestro local.",
  returnsText = "Cambios ágiles dentro de los 30 días y botón de arrepentimiento.",
  paymentText = "Promociones bancarias, transferencia con descuento y efectivo.",
}: {
  shippingText?: string;
  returnsText?: string;
  paymentText?: string;
}) {
  return (
    <section
      aria-label="Beneficios de compra y confianza"
      className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl border border-[#e7e2da] bg-white p-5 sm:p-6 shadow-2xs"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#faf8f5] border border-[#e7e2da] text-stone-800">
          <Truck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-serif text-base font-medium text-stone-900">
            Envíos y retiro
          </h3>
          <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
            {shippingText}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#faf8f5] border border-[#e7e2da] text-stone-800">
          <RefreshCw className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-serif text-base font-medium text-stone-900">
            Cambios y devoluciones
          </h3>
          <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
            {returnsText}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#faf8f5] border border-[#e7e2da] text-stone-800">
          <CreditCard className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-serif text-base font-medium text-stone-900">
            Medios de pago
          </h3>
          <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
            {paymentText}{" "}
            <Link prefetch={false}
              href="/promociones"
              className="font-semibold text-stone-900 underline underline-offset-2"
            >
              Ver promociones
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

