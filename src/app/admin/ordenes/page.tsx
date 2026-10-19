import { Metadata } from "next";
import { connection } from "next/server";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { listOrders } from "../../../services/order.service";
import { getShowroomSettings } from "../../../services/settings.service";
import { OrdersManagerClient } from "../../../components/admin/OrdersManagerClient";

export const metadata: Metadata = {
  title: "Gestión de Pedidos | Backoffice",
  description: "Control de órdenes de compra, pagos y logística.",
};

export default async function AdminOrdersPage() {
  await connection();
  const deps = getProductServiceDeps();

  const [orders, settings] = await Promise.all([
    listOrders({ limit: 500 }, deps).catch((err) => {
      console.error("Error al cargar pedidos en /admin/ordenes:", err);
      return [];
    }),
    getShowroomSettings(deps).catch((err) => {
      console.error("Error al cargar configuración en /admin/ordenes:", err);
      return { showroomName: "Aura Studio", whatsappNumber: "+5491100000000" };
    }),
  ]);

  return (
    <OrdersManagerClient
      initialOrders={orders}
      brandName={settings.showroomName || "Aura Studio"}
      whatsappNumber={settings.whatsappNumber}
    />
  );
}

