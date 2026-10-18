import { Metadata } from "next";
import { connection } from "next/server";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { listCoupons } from "../../../services/coupon.service";
import { getShowroomSettings } from "../../../services/settings.service";
import { CouponsManagerClient } from "../../../components/admin/CouponsManagerClient";

export const metadata: Metadata = {
  title: "Cupones y Descuentos | Backoffice",
  description: "Gestión de promociones, límites por email y cupones de compra.",
};

export default async function AdminDiscountsPage() {
  await connection();
  const deps = getProductServiceDeps();

  const [coupons, settings] = await Promise.all([
    listCoupons(deps).catch((err) => {
      console.error("Error al cargar cupones en /admin/descuentos:", err);
      return [];
    }),
    getShowroomSettings(deps).catch((err) => {
      console.error("Error al cargar configuración en /admin/descuentos:", err);
      return { showroomName: "Aura Studio" };
    }),
  ]);

  return (
    <CouponsManagerClient
      initialCoupons={coupons}
      brandName={settings.showroomName || "Aura Studio"}
    />
  );
}
