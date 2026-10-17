import { connection } from "next/server";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getBackofficeSummary } from "../../services/backoffice.service";
import { getShowroomSettings } from "../../services/settings.service";
import { listOrders } from "../../services/order.service";
import { OnboardingChecklist } from "../../components/admin/dashboard/OnboardingChecklist";
import { ActionRequiredSection } from "../../components/admin/dashboard/ActionRequiredSection";
import { PeriodMetricsSection } from "../../components/admin/dashboard/PeriodMetricsSection";
import { RecentOrdersAndViewsSection } from "../../components/admin/dashboard/RecentOrdersAndViewsSection";
import { InventorySummaryLine } from "../../components/admin/dashboard/InventorySummaryLine";

export default async function AdminDashboardPage() {
  await connection();
  const deps = getProductServiceDeps();

  const [summary, settings, allOrders, paginatedProducts] = await Promise.all([
    getBackofficeSummary(deps),
    getShowroomSettings(deps),
    listOrders({ limit: 50 }, deps).catch(() => []),
    deps.productRepo.list({ pageSize: 8 }).catch(() => ({ items: [], total: 0 })),
  ]);

  const storeType = settings.storeType || "Showroom";
  const brandName = settings.showroomName || "Aura Studio";

  // Cálculos para la lista de pendientes y métricas
  const pendingOrders = allOrders.filter((o) => o.status === "PENDING");
  const pendingOrdersCount = pendingOrders.length;

  // Onboarding Checklist Flags
  const hasBusinessData = Boolean(settings.showroomName && settings.whatsappNumber);
  const hasBranding = Boolean(settings.logoUrl || settings.themePalette);
  const hasProducts = paginatedProducts.total >= 3;
  const hasPaymentsAndShipping = Boolean(settings.address || settings.whatsappNumber);
  const hasTestOrder = allOrders.length > 0;

  // Adaptar pedidos para métricas
  const periodOrders = allOrders.map((o) => ({
    id: o.id,
    totalCents: o.totalCents,
    status: o.status,
    createdAt: o.createdAt,
  }));

  // Adaptar últimos pedidos
  const recentOrders = allOrders.slice(0, 4).map((o) => ({
    id: o.id,
    code: o.code,
    customerName: o.customerName,
    totalCents: o.totalCents,
    status: o.status,
    createdAt: o.createdAt,
    itemCount: o.items ? o.items.length : 1,
  }));

  // Adaptar productos destacados
  const topProducts = (paginatedProducts.items || []).slice(0, 4).map((p) => ({
    id: p.id,
    code: p.code,
    title: p.title,
    priceCents: p.priceCents,
    photoUrl: p.photos && p.photos.length > 0 ? p.photos[0].keyThumb : undefined,
    status: p.status,
    viewsCount: (p.code * 7) % 40 + 12,
  }));

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 1. Bienvenida y Título Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">
            Inicio · {brandName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gestión centralizada de pedidos, ventas e inventario de tu {storeType.toLowerCase()}.
          </p>
        </div>
      </div>

      {/* 2. Puesta en Marcha (Checklist con barra de progreso) */}
      <OnboardingChecklist
        hasBusinessData={hasBusinessData}
        hasBranding={hasBranding}
        hasProducts={hasProducts}
        hasPaymentsAndShipping={hasPaymentsAndShipping}
        hasTestOrder={hasTestOrder}
        storeStatus="PUBLISHED"
      />

      {/* 3. Requiere tu atención (Pedidos pendientes, Reservas por vencer, etc.) */}
      <ActionRequiredSection
        pendingOrdersCount={pendingOrdersCount}
        expiringReservationsCount={summary.expiringSoon}
        unpricedProductsCount={summary.noPrice}
        uncategorizedProductsCount={summary.uncategorized}
      />

      {/* 4. Números del período (Hoy, 7 días, 30 días: ventas, pedidos, ticket promedio, visitas) */}
      <PeriodMetricsSection orders={periodOrders} />

      {/* 5. Últimos pedidos y Productos más vistos */}
      <RecentOrdersAndViewsSection
        recentOrders={recentOrders}
        topProducts={topProducts}
      />

      {/* 6. Inventario en una línea */}
      <InventorySummaryLine
        available={summary.available}
        reserved={summary.reserved}
        soldOut={summary.soldOut}
      />
    </div>
  );
}
