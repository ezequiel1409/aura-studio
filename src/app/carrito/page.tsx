import { Metadata } from "next";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getShowroomSettings } from "../../services/settings.service";
import { getAvailablePaymentMethods } from "../../services/payment.service";
import { CartPageClient } from "../../components/cart/CartPageClient";

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
    title: `Mi Carrito | ${brandName}`,
    description: `Bolsa de compras y checkout de productos exclusivos en ${brandName}.`,
  };
}

export default async function CarritoPage() {
  const defaultBrand = process.env.COMMERCE_NAME || "Mi Tienda";
  const deps = getProductServiceDeps();
  const [settings, availablePaymentMethods] = await Promise.all([
    getShowroomSettings(deps),
    getAvailablePaymentMethods(deps),
  ]);
  const brandName = settings.showroomName || defaultBrand;

  return (
    <main className="flex-1">
      <CartPageClient
        showroomAddress={settings.address}
        storeLocation={settings.storeLocation}
        storeSchedule={settings.storeSchedule}
        brandName={brandName}
        whatsappNumber={settings.whatsappNumber}
        reservationHours={settings.reservationHours}
        ordersPaused={settings.ordersPaused}
        ordersPausedNotice={settings.ordersPausedNotice}
        initialPaymentMethods={availablePaymentMethods}
        initialBankDetails={
          settings.transferEnabled
            ? {
                bankName: settings.transferBankName,
                accountHolder: settings.transferAccountHolder,
                cbu: settings.transferCbu,
                alias: settings.transferAlias,
                cuit: settings.transferCuit,
                discountPercent: settings.transferDiscountPercent,
              }
            : null
        }
      />
    </main>
  );
}
