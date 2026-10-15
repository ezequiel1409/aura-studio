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
    listOrders({ limit: 100 }, deps),
    getShowroomSettings(deps),
  ]);

  return (
    <OrdersManagerClient
      initialOrders={orders}
      brandName={settings.showroomName || "Aura Studio"}
      whatsappNumber={settings.whatsappNumber}
    />
  );
}

