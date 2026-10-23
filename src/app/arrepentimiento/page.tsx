import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getShowroomSettings } from "../../services/settings.service";
import { RevocationFormClient } from "../../components/claims/RevocationFormClient";
import { Footer } from "../../components/layout/Footer";

export const metadata: Metadata = {
  title: "Botón de Arrepentimiento | Aura Studio",
  description: "Formulario oficial de revocación de compra conforme a la Resolución 424/2020 de la Secretaría de Comercio Interior.",
};

export default async function RevocationPage() {
  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps).catch(() => ({
    showroomName: "Aura Studio",
    whatsappNumber: "+5491100000000",
    address: "Palermo Soho, Buenos Aires",
  }));

  const brandName = settings.showroomName || "Aura Studio";

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col justify-between">
      {/* Barra de Navegación Simple */}
      <header className="sticky top-0 z-30 border-b border-[#e7e2da] bg-[#faf8f5]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link prefetch={false}
            href="/"
            className="font-serif text-lg sm:text-xl tracking-wider text-stone-900 uppercase"
          >
            {brandName}
          </Link>

          <Link prefetch={false}
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e7e2da] bg-white px-3.5 py-1 text-xs font-medium text-stone-700 hover:border-stone-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a la tienda</span>
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 flex-1">
        <RevocationFormClient
          brandName={brandName}
          whatsappNumber={settings.whatsappNumber}
        />
      </main>

      {/* Footer Mínimo */}
      <Footer variant="minimal" brandName={brandName} whatsappNumber={settings.whatsappNumber} />
    </div>
  );
}

