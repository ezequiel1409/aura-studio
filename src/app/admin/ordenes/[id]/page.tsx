import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getShowroomSettings } from "../../../../services/settings.service";
import { parseOrderCode, formatOrderCode } from "../../../../domain/order";
import { AdminOrderDetailClient } from "../../../../components/admin/AdminOrderDetailClient";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  const deps = getProductServiceDeps();

  let code = 0;
  const numId = parseInt(rawId, 10);
  if (!Number.isNaN(numId) && numId > 0) {
    const o = await deps.orderRepo.findById(numId);
    if (o) code = o.code;
  }
  if (!code) {
    const codeNum = parseOrderCode(rawId);
    if (codeNum) {
      const o = await deps.orderRepo.findByCode(codeNum);
      if (o) code = o.code;
    }
  }

  const title = code ? `Pedido ${formatOrderCode(code)} | Backoffice` : "Detalle de Pedido | Backoffice";

  return {
    title,
    description: "Detalle completo, artículos y estado de la orden de compra.",
  };
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  await connection();
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  const deps = getProductServiceDeps();

  let order = null;
  const numId = parseInt(rawId, 10);
  if (!Number.isNaN(numId) && numId > 0) {
    order = await deps.orderRepo.findById(numId);
  }

  if (!order) {
    const codeNum = parseOrderCode(rawId);
    if (codeNum) {
      order = await deps.orderRepo.findByCode(codeNum);
    }
  }

  if (!order) {
    notFound();
  }

  const settings = await getShowroomSettings(deps);

  return (
    <AdminOrderDetailClient
      initialOrder={order}
      brandName={settings.showroomName || "Aura Studio"}
      whatsappNumber={settings.whatsappNumber}
      showroomAddress={settings.address}
    />
  );
}

