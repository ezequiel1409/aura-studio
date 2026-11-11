import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, RotateCcw, ShieldCheck } from "lucide-react";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getShowroomSettings, DEFAULT_SUGGESTED_TERMS } from "../../services/settings.service";
import { TermsContentRenderer } from "../../components/legal/TermsContentRenderer";

export async function generateMetadata(): Promise<Metadata> {
  let brandName = process.env.COMMERCE_NAME || "Mi Tienda";
  let reservationHours = 48;
  try {
    const deps = getProductServiceDeps();
    const settings = await getShowroomSettings(deps);
    brandName = settings.showroomName || brandName;
    reservationHours = settings.reservationHours || 48;
  } catch {
    // Fallback silencioso
  }

  return {
    title: `Términos y Condiciones | ${brandName}`,
    description: `Términos y condiciones generales de compra, políticas de reserva por ${reservationHours} horas, cambios y envíos en ${brandName}.`,
  };
}

export default async function TerminosPage() {
  const defaultBrand = process.env.COMMERCE_NAME || "Mi Tienda";
  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);

  const brandName = settings.showroomName || defaultBrand;
  const reservationHours = settings.reservationHours || 48;
  const reservationText =
    reservationHours === 1
      ? "1 hora"
      : reservationHours < 1
      ? `${Math.round(reservationHours * 60)} minutos`
      : `${reservationHours} horas`;

  return (
    <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Navegación y Encabezado */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver al inicio</span>
        </Link>

        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#926a3c] block">
          Políticas y Legales
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-stone-900 mt-1">
          Términos y Condiciones
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-2">
          Última actualización: Octubre 2026 · {brandName}
        </p>
      </div>

      {/* Resumen Destacado de Confianza */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="rounded-2xl border border-[#e7e2da] bg-white p-5 shadow-2xs">
          <Clock className="h-5 w-5 text-[#926a3c] mb-2" />
          <h2 className="font-serif text-base font-semibold text-stone-900">
            Reserva de Piezas
          </h2>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            Mantenemos tu reserva exclusiva por <strong>{reservationText}</strong> para coordinar pago o retiro.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e7e2da] bg-white p-5 shadow-2xs">
          <RotateCcw className="h-5 w-5 text-[#926a3c] mb-2" />
          <h2 className="font-serif text-base font-semibold text-stone-900">
            Cambios Simples
          </h2>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            Tenés hasta 15 días corridos desde la entrega para solicitar cambios con la pieza intacta y etiqueta.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e7e2da] bg-white p-5 shadow-2xs">
          <ShieldCheck className="h-5 w-5 text-[#926a3c] mb-2" />
          <h2 className="font-serif text-base font-semibold text-stone-900">
            Compra Segura
          </h2>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            Operamos con medios de pago verificados, transferencias y atención directa personalizada.
          </p>
        </div>
      </div>

      {/* Cláusulas Detalladas con Hipervínculos e Interactividad */}
      <div className="bg-white rounded-3xl border border-[#e7e2da] p-6 sm:p-10 shadow-xs">
        <TermsContentRenderer
          content={
            settings.customTermsText && settings.customTermsText.trim()
              ? settings.customTermsText
              : DEFAULT_SUGGESTED_TERMS
          }
          brandName={brandName}
        />
      </div>
    </main>
  );
}
