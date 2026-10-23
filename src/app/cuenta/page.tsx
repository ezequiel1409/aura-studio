import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getShowroomSettings } from "../../services/settings.service";
import { getAuthenticatedCustomer } from "../../infra/auth/customer-session";
import {
  getCustomerProfile,
  getCustomerOrders,
  getCustomerAddresses,
} from "../../services/customer.service";
import { listProducts } from "../../services/product.service";
import { CustomerPortalClient } from "../../components/customer/CustomerPortalClient";
import { Footer } from "../../components/layout/Footer";
import { StoreThemeStyles } from "../../components/theme/StoreThemeStyles";
import { CartDrawer } from "../../components/cart/CartDrawer";

export const metadata: Metadata = {
  title: "Mi Cuenta | Aura Studio",
  description: "Historial de pedidos, direcciones guardadas y datos de tu cuenta.",
};

export default async function CustomerAccountPage() {
  const session = await getAuthenticatedCustomer();
  if (!session) {
    redirect("/cuenta/ingresar");
  }

  const deps = getProductServiceDeps();
  const customer = await getCustomerProfile(session.customerId, {
    customerRepo: deps.customerRepo,
  });

  if (!customer) {
    redirect("/cuenta/ingresar");
  }

  const [orders, addresses, settings, productsResult] = await Promise.all([
    getCustomerOrders(session.customerId, {
      customerRepo: deps.customerRepo,
      orderRepo: deps.orderRepo,
    }).catch((err) => {
      console.error("Error al cargar pedidos en /cuenta:", err);
      return [];
    }),
    getCustomerAddresses(session.customerId, {
      customerRepo: deps.customerRepo,
      customerAddressRepo: deps.customerAddressRepo,
    }).catch((err) => {
      console.error("Error al cargar direcciones en /cuenta:", err);
      return [];
    }),
    getShowroomSettings(deps).catch(() => ({
      showroomName: "Aura Studio",
      themePalette: "lino",
      themePrimaryColor: "#1c1917",
      whatsappNumber: "+5491100000000",
      logoUrl: null,
      instagramHandle: null,
      tiktokHandle: null,
      address: null,
      dataFiscalUrl: null,
    } as unknown as Awaited<ReturnType<typeof getShowroomSettings>>)),
    listProducts({ page: 1, pageSize: 50 }, deps).catch((err) => {
      console.error("Error al cargar productos en /cuenta:", err);
      return { items: [], total: 0 };
    }),
  ]);

  const brandName = settings.showroomName || "Aura Studio";

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col justify-between">
      <StoreThemeStyles
        paletteId={settings.themePalette}
        primaryColor={settings.themePrimaryColor}
        fontId={settings.themeFont}
      />

      {/* Cabecera */}
      <header
        role="banner"
        className="sticky top-0 z-40 w-full border-b border-[#e7e2da] bg-[#faf8f5]/90 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link prefetch={false}
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

          <div className="flex items-center gap-3">
            <Link
              href="/"
              prefetch={true}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#e7e2da] bg-white px-4 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver al catálogo</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Portal de Cliente */}
      <main className="flex-1">
        <CustomerPortalClient
          customer={customer}
          initialOrders={orders}
          initialAddresses={addresses}
          allProducts={productsResult.items}
          whatsappNumber={settings.whatsappNumber}
          brandName={brandName}
        />
      </main>

      <CartDrawer />

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

