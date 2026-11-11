import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { getShowroomSettings } from "../../../services/settings.service";
import { getAuthenticatedCustomer } from "../../../infra/auth/customer-session";
import { CustomerAuthClient } from "../../../components/customer/CustomerAuthClient";

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
    title: `Acceso Clientes | ${brandName}`,
    description: "Iniciá sesión o registrate para gestionar tus pedidos y direcciones.",
  };
}

export default async function CustomerAuthPage() {
  const customer = await getAuthenticatedCustomer();
  if (customer) {
    redirect("/cuenta");
  }

  const defaultBrand = process.env.COMMERCE_NAME || "Mi Tienda";
  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);
  const brandName = settings.showroomName || defaultBrand;

  return (
    <main className="flex-1">
      <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">Cargando...</div>}>
        <CustomerAuthClient brandName={brandName} />
      </Suspense>
    </main>
  );
}
