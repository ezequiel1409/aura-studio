import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, RotateCcw, ShieldCheck, Store, Truck } from "lucide-react";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getShowroomSettings } from "../../services/settings.service";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { NavigationService } from "../../services/navigation.service";
import { StoreThemeStyles } from "../../components/theme/StoreThemeStyles";

export async function generateMetadata(): Promise<Metadata> {
  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);
  const brandName = settings.showroomName || "Aura Studio";
  return {
    title: `Términos y Condiciones | ${brandName}`,
    description: `Términos y condiciones generales de compra, políticas de reserva por ${settings.reservationHours || 48} horas, cambios y envíos en ${brandName}.`,
  };
}

export default async function TerminosPage() {
  const deps = getProductServiceDeps();
  const navService = new NavigationService({
    navigationRepo: deps.navigationRepo,
    productRepo: deps.productRepo,
    categoryRepo: deps.categoryRepo,
  });

  const [settings, categories, sections] = await Promise.all([
    getShowroomSettings(deps),
    deps.categoryRepo.listAll(),
    navService.listPublicNavigationSections(),
  ]);

  const brandName = settings.showroomName || "Aura Studio";
  const reservationHours = settings.reservationHours || 48;
  const reservationText =
    reservationHours === 1
      ? "1 hora"
      : reservationHours < 1
      ? `${Math.round(reservationHours * 60)} minutos`
      : `${reservationHours} horas`;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col justify-between">
      <StoreThemeStyles
        paletteId={settings.themePalette}
        primaryColor={settings.themePrimaryColor}
        fontId={settings.themeFont}
      />

      <Header
        brandName={brandName}
        logoUrl={settings.logoUrl}
        sections={sections}
        categories={categories}
        announcementBar={settings.announcementBar}
      />

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
              Tenés hasta 15 días corridos desde la entrega para solicitar cambios con la prenda intacta y etiqueta.
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

        {/* Cláusulas Detalladas */}
        <div className="space-y-8 text-xs sm:text-sm text-stone-700 leading-relaxed bg-white rounded-3xl border border-[#e7e2da] p-6 sm:p-10 shadow-xs">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-stone-900 border-b border-[#f0ece1] pb-2">
              1. Condiciones Generales y Disponibilidad
            </h2>
            <p>
              El acceso y uso de la tienda online de <strong>{brandName}</strong> implica la aceptación plena de los presentes Términos y Condiciones. Nuestras prendas y piezas son seleccionadas de forma exclusiva y cuentan con inventario limitado o de ejemplar único.
            </p>
            <p>
              En caso de que una pieza seleccionada se agote de manera simultánea durante el proceso de compra, se notificará de inmediato al cliente para ofrecer una alternativa equivalente o la restitución inmediata del importe abonado.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-stone-900 border-b border-[#f0ece1] pb-2">
              2. Política de Reserva y Pago
            </h2>
            <p>
              Al completar una solicitud de pedido mediante transferencia bancaria o WhatsApp, la prenda queda reservada a nombre del comprador por un plazo máximo de <strong>{reservationText}</strong>.
            </p>
            <p>
              Transcurrido este plazo sin que se haya acreditado el pago ni enviado el comprobante correspondiente, la reserva caducará automáticamente y la pieza volverá a estar disponible para la venta general en el showroom.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-stone-900 border-b border-[#f0ece1] pb-2">
              3. Envíos y Retiro en el Local
            </h2>
            <p>
              Realizamos envíos a todo el territorio argentino a través de correo privado y mensajería express. Los costos de envío y plazos estimados de entrega se informan con precisión en la bolsa de compras antes de confirmar el pedido.
            </p>
            <p>
              Los retiros en el local se realizan sin costo adicional en los horarios de atención y retiro habilitados, previa confirmación por WhatsApp o notificación de pedido listo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-stone-900 border-b border-[#f0ece1] pb-2">
              4. Cambios, Devoluciones y Botón de Arrepentimiento
            </h2>
            <p>
              Se aceptan cambios dentro de los 15 (quince) días corridos desde la fecha de recepción o retiro de la compra, siempre que la prenda se encuentre en perfecto estado de conservación, sin uso y con sus etiquetas originales colocadas.
            </p>
            <p>
              Conforme a la Ley Nacional de Defensa del Consumidor N° 24.240 y la Resolución 424/2020 de la Secretaría de Comercio Interior, los clientes disponen del <strong>Botón de Arrepentimiento</strong> disponible en el pie de página para revocar la compra dentro de los 10 días corridos de recibido el producto.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-medium text-stone-900 border-b border-[#f0ece1] pb-2">
              5. Promociones Bancarias y Descuentos
            </h2>
            <p>
              Los beneficios, cuotas sin interés y reintegros con entidades bancarias se rigen por las condiciones particulares publicadas en nuestra sección de{" "}
              <Link
                href="/promociones"
                className="font-semibold text-stone-900 underline underline-offset-4"
              >
                Promociones Bancarias
              </Link>
              , sujetas a vigencia y topes de reintegro establecidos por cada entidad emisora.
            </p>
          </section>
        </div>
      </main>

      <Footer
        brandName={brandName}
        logoUrl={settings.logoUrl}
        whatsappNumber={settings.whatsappNumber}
        instagramHandle={settings.instagramHandle}
        tiktokHandle={settings.tiktokHandle}
        address={settings.address}
        dataFiscalUrl={settings.dataFiscalUrl}
        sections={sections}
        storeLocation={settings.storeLocation}
        storeSchedule={settings.storeSchedule}
      />
    </div>
  );
}

