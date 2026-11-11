import { Metadata } from "next";
import { connection } from "next/server";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { getOrdersSummaryCounts, listOrders } from "../../../services/order.service";
import { getShowroomSettings } from "../../../services/settings.service";
import { OrdersManagerClient } from "../../../components/admin/OrdersManagerClient";

export const metadata: Metadata = {
  title: "Gestión de Pedidos | Backoffice",
  description: "Control de órdenes de compra, pagos y logística.",
};

export default async function AdminOrdersPage() {
  await connection();
  const deps = getProductServiceDeps();

  const [orders, ordersSummary, settings] = await Promise.all([
    listOrders({ limit: 100, offset: 0 }, deps).catch((err) => {
      console.error("Error al cargar pedidos en /admin/ordenes:", err);
      return [];
    }),
    getOrdersSummaryCounts(deps).catch(() => ({ total: 0, pending: 0 })),
    getShowroomSettings(deps).catch((err) => {
      console.error("Error al cargar configuración en /admin/ordenes:", err);
      return { showroomName: "", whatsappNumber: "" };
    }),
  ]);

  return (
    <OrdersManagerClient
      initialOrders={orders}
      initialTotalCount={ordersSummary.total}
      brandName={settings.showroomName || undefined}
      whatsappNumber={settings.whatsappNumber}
    />
  );
}

