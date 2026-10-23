import Link from "next/link";
import { ArrowRight, Calendar, CreditCard, Landmark } from "lucide-react";
import { Promotion } from "../../domain/promotion/types";
import { formatPriceARS } from "../../lib/format/currency";

export interface BankPromosBlockProps {
  promotions: Promotion[];
}

export function BankPromosBlock({ promotions }: BankPromosBlockProps) {
  if (!promotions || promotions.length === 0) {
    return null;
  }

  const visiblePromos = promotions.slice(0, 4);

  return (
    <section
      aria-labelledby="home-bank-promos-heading"
      className="space-y-4"
    >
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-stone-700" aria-hidden="true" />
          <h2
            id="home-bank-promos-heading"
            className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-stone-900"
          >
            Promociones bancarias y beneficios
          </h2>
        </div>

        <Link prefetch={false}
          href="/promociones"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 underline underline-offset-4 shrink-0"
        >
          <span>Ver todas</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePromos.map((promo) => {
          const bankName =
            promo.bank?.name ||
            (promo.promoType === "STORE" ? "Beneficio Propio" : "Banco adherido");
          const badgeColor = promo.bank?.accentColor || "#292524";
          const endFormatted = new Date(promo.endsAt).toLocaleDateString(
            "es-AR",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }
          );

          return (
            <article
              key={promo.id}
              className="flex flex-col justify-between rounded-2xl border border-[#e7e2da] bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-stone-400"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: badgeColor }}
                  >
                    <CreditCard className="h-3 w-3" aria-hidden="true" />
                    <span>{bankName}</span>
                  </span>

                  <span className="text-[11px] font-semibold text-stone-600">
                    {promo.daysOfWeek.join(" · ")}
                  </span>
                </div>

                <h3 className="font-serif text-lg sm:text-xl font-medium text-stone-900">
                  {promo.benefitShort}
                </h3>

                <p className="text-xs text-stone-600 line-clamp-2">
                  {promo.title}
                  {promo.capCents !== null &&
                    ` · Tope de reintegro: ${formatPriceARS(promo.capCents)}`}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f0ece1] flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  <span>Hasta {endFormatted}</span>
                </span>

                <Link prefetch={false}
                  href={`/promociones/${promo.slug}`}
                  className="font-semibold text-stone-900 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-stone-900 rounded-xs"
                >
                  Ver condiciones &gt;
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

