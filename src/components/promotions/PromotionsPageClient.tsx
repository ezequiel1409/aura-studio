"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  ExternalLink,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { Bank, Promotion } from "../../domain/promotion/types";
import { formatPriceARS } from "../../lib/format/currency";

interface PromotionsPageClientProps {
  promotions: Promotion[];
  banks: Bank[];
}

const DAYS_FILTER = [
  "Todos",
  "Todos los días",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function PromotionsPageClient({
  promotions,
  banks,
}: PromotionsPageClientProps) {
  const [selectedBankId, setSelectedBankId] = useState<number | "ALL">("ALL");
  const [selectedDay, setSelectedDay] = useState<string>("Todos");

  const filtered = promotions.filter((promo) => {
    if (selectedBankId !== "ALL" && promo.bankId !== selectedBankId) {
      return false;
    }
    if (selectedDay !== "Todos") {
      const hasDay = promo.daysOfWeek.some(
        (d) =>
          d.toLowerCase() === selectedDay.toLowerCase() ||
          d.toLowerCase() === "todos los días"
      );
      if (!hasDay) return false;
    }
    return true;
  });

  // Bancos presentes en promociones activas
  const activeBanks = banks.filter((b) =>
    promotions.some((p) => p.bankId === b.id)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Encabezado */}
      <div className="rounded-3xl border border-[#e7e2da] bg-white p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d2c7] bg-[#faf8f5] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-stone-700">
          <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Beneficios Vigentes</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-wide text-stone-900">
          Promociones bancarias y medios de pago
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
          Conocé todos los beneficios vigentes por banco, billetera y día de la semana. Consultá las condiciones completas, topes de reintegro y términos legales de cada promoción antes de realizar tu compra.
        </p>
      </div>

      {/* Filtros por Banco y por Día de la semana */}
      <div className="space-y-4 rounded-2xl border border-[#e7e2da] bg-white p-4 sm:p-5">
        {activeBanks.length > 0 && (
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Filtrar por banco o entidad:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedBankId("ALL")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                  selectedBankId === "ALL"
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-[#d8d2c7] bg-[#faf8f5] text-stone-700 hover:border-stone-900"
                }`}
              >
                Todos los bancos
              </button>
              {activeBanks.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setSelectedBankId(bank.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                    selectedBankId === bank.id
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-[#d8d2c7] bg-[#faf8f5] text-stone-700 hover:border-stone-900"
                  }`}
                >
                  {bank.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-stone-600">
            Filtrar por día de la semana:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DAYS_FILTER.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  selectedDay === day
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-[#d8d2c7] bg-[#faf8f5] text-stone-700 hover:border-stone-900"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grilla de Promociones */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((promo) => {
            const bankName =
              promo.bank?.name ||
              (promo.promoType === "STORE"
                ? "Beneficio de la tienda"
                : "Entidad adherida");
            const badgeColor = promo.bank?.accentColor || "#292524";
            const startFormatted = new Date(promo.startsAt).toLocaleDateString(
              "es-AR"
            );
            const endFormatted = new Date(promo.endsAt).toLocaleDateString(
              "es-AR"
            );

            return (
              <article
                key={promo.id}
                className="flex flex-col justify-between rounded-3xl border border-[#e7e2da] bg-white p-6 shadow-2xs transition-all hover:border-stone-400"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: badgeColor }}
                    >
                      <CreditCard className="h-3 w-3" aria-hidden="true" />
                      <span>{bankName}</span>
                    </span>
                    <span className="text-xs font-semibold text-stone-600">
                      {promo.daysOfWeek.join(" · ")}
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl font-normal text-stone-900">
                    {promo.benefitShort}
                  </h2>

                  <p className="text-xs font-medium text-stone-800">
                    {promo.title}
                  </p>

                  <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-[#faf8f5] p-3 text-xs border border-[#e7e2da]">
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-stone-500">
                        Tope de reintegro
                      </dt>
                      <dd className="font-semibold text-stone-900">
                        {promo.capCents !== null
                          ? formatPriceARS(promo.capCents)
                          : "Sin tope"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-stone-500">
                        Modalidad
                      </dt>
                      <dd className="font-semibold text-stone-900">
                        {promo.modality === "INSTANT"
                          ? "En el acto"
                          : "Reintegro bancario"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] uppercase font-bold text-stone-500">
                        Medios incluidos
                      </dt>
                      <dd className="text-stone-700">
                        {promo.paymentMethods.join(", ")}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 pt-4 border-t border-[#f0ece1] flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {startFormatted} al {endFormatted}
                    </span>
                  </span>

                  <Link
                    href={`/promociones/${promo.slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
                  >
                    <span>Ver condiciones</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-[#e7e2da] bg-white p-10 text-center space-y-3">
          <p className="font-serif text-xl text-stone-800">
            No hay promociones vigentes para ese filtro.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedBankId("ALL");
              setSelectedDay("Todos");
            }}
            className="rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white"
          >
            Ver todas las promociones vigentes
          </button>
        </div>
      )}

      {/* Aviso informativo transparente */}
      <div className="rounded-2xl border border-[#e7e2da] bg-[#f5f2eb] p-4 flex items-start gap-3 text-xs text-stone-600">
        <ShieldCheck className="h-4 w-4 text-stone-800 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Las promociones bancarias y de billeteras dependen de la entidad emisora, cartera de cliente y medio de pago utilizado. Los reintegros bancarios son acreditados directamente por cada banco según sus términos y condiciones legales.
        </p>
      </div>
    </div>
  );
}

