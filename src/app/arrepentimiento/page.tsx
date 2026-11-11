import { Metadata } from "next";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getShowroomSettings } from "../../services/settings.service";
import { RevocationFormClient } from "../../components/claims/RevocationFormClient";

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
    title: `Botón de Arrepentimiento | ${brandName}`,
    description:
      "Formulario oficial de revocación de compra conforme a la Resolución 424/2020 de la Secretaría de Comercio Interior.",
  };
}

export default async function RevocationPage() {
  const defaultBrand = process.env.COMMERCE_NAME || "Mi Tienda";
  const defaultPhone = process.env.COMMERCE_WHATSAPP || "+5491100000000";

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps).catch(() => ({
    showroomName: defaultBrand,
    whatsappNumber: defaultPhone,
    address: null,
  }));

  const brandName = settings.showroomName || defaultBrand;

  return (
    <main className="flex-1">
      <RevocationFormClient
        brandName={brandName}
        whatsappNumber={settings.whatsappNumber}
      />
    </main>
  );
}
