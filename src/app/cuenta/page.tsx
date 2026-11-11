import { Metadata } from "next";
import { redirect } from "next/navigation";
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

export async function generateMetadata(): Promise<Metadata> {
  let brandName = process.env.COMMERCE_NAME || "Mi Tienda";
  try {
    const deps = getProductServiceDeps();
    const settings = await getShowroomSettings(deps);
    brandName = settings.showroomName || brandName;
  } catch {
    // Fallback silencioso
  }

  return {
    title: `Mi Cuenta | ${brandName}`,
    description: "Historial de pedidos, direcciones guardadas y datos de tu cuenta.",
  };
}

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

  const defaultBrand = process.env.COMMERCE_NAME || "Mi Tienda";
  const defaultPhone = process.env.COMMERCE_WHATSAPP || "+5491100000000";

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
    getShowroomSettings(deps).catch(
      () =>
        ({
          showroomName: defaultBrand,
          themePalette: "lino",
          themePrimaryColor: "#1c1917",
          whatsappNumber: defaultPhone,
          logoUrl: null,
          instagramHandle: null,
          tiktokHandle: null,
          address: null,
          dataFiscalUrl: null,
        }) as unknown as Awaited<ReturnType<typeof getShowroomSettings>>
    ),
    listProducts({ page: 1, pageSize: 50 }, deps).catch((err) => {
      console.error("Error al cargar productos en /cuenta:", err);
      return { items: [], total: 0 };
    }),
  ]);

  const brandName = settings.showroomName || defaultBrand;

  return (
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
  );
}
