import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { getShowroomSettings } from "../../../services/settings.service";
import { getAuthenticatedCustomer } from "../../../infra/auth/customer-session";
import { CustomerAuthClient } from "../../../components/customer/CustomerAuthClient";
import { Footer } from "../../../components/layout/Footer";
import { StoreThemeStyles } from "../../../components/theme/StoreThemeStyles";

export const metadata: Metadata = {
  title: "Acceso Clientes | Aura Studio",
  description: "Iniciá sesión o registrate para gestionar tus pedidos y direcciones.",
};

export default async function CustomerAuthPage() {
  const customer = await getAuthenticatedCustomer();
  if (customer) {
    redirect("/cuenta");
  }

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);
  const brandName = settings.showroomName || "Aura Studio";

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col justify-between">
      <StoreThemeStyles
        paletteId={settings.themePalette}
        primaryColor={settings.themePrimaryColor}
      />

      {/* Cabecera */}
      <header
        role="banner"
        className="sticky top-0 z-40 w-full border-b border-[#e7e2da] bg-[#faf8f5]/90 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link
            href="/"
            aria-label={`${brandName} - Volver al inicio`}
            className="group flex items-center focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            {settings.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={settings.logoUrl}
                alt={brandName}
                className="h-8 sm:h-9 w-auto max-h-9 max-w-[150px] sm:max-w-[200px] object-contain transition-opacity group-hover:opacity-85"
              />
            ) : (
              <div className="flex flex-col">
                <span className="font-serif text-xl sm:text-2xl tracking-[0.2em] font-normal text-stone-900 uppercase">
                  {brandName}
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.3em] font-medium text-stone-500 uppercase">
                  Espacio Clientes
                </span>
              </div>
            )}
          </Link>

          <Link
            href="/"
            prefetch={true}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#e7e2da] bg-white px-4 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver al catálogo</span>
          </Link>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 flex items-center justify-center">
        <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">Cargando...</div>}>
          <CustomerAuthClient brandName={brandName} />
        </Suspense>
      </main>

      {/* Pie de página */}
      <Footer
        brandName={brandName}
        logoUrl={settings.logoUrl}
        whatsappNumber={settings.whatsappNumber}
        instagramHandle={settings.instagramHandle}
        tiktokHandle={settings.tiktokHandle}
        address={settings.address}
        dataFiscalUrl={settings.dataFiscalUrl}
      />
    </div>
  );
}

