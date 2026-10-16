import { connection } from "next/server";
import { getProductServiceDeps } from "../../infra/db/connection";
import { getBackofficeSummary } from "../../services/backoffice.service";
import { getShowroomSettings } from "../../services/settings.service";
import { getOrdersSummaryCounts } from "../../services/order.service";
import { DashboardWelcomeHeader } from "../../components/admin/dashboard/DashboardWelcomeHeader";
import { DashboardStatGrid } from "../../components/admin/dashboard/DashboardStatGrid";
import { DashboardQuickLinks } from "../../components/admin/dashboard/DashboardQuickLinks";

export default async function AdminDashboardPage() {
  await connection();
  const deps = getProductServiceDeps();
  const [summary, settings, orderCounts] = await Promise.all([
    getBackofficeSummary(deps),
    getShowroomSettings(deps),
    getOrdersSummaryCounts(deps).catch(() => ({ total: 0, pending: 0 })),
  ]);
  const storeType = settings.storeType || "Showroom";

  return (
    <div className="space-y-6 md:space-y-8">
      <DashboardWelcomeHeader storeType={storeType} />
      <DashboardStatGrid summary={summary} />
      <DashboardQuickLinks
        totalOrdersCount={orderCounts.total}
        pendingOrdersCount={orderCounts.pending}
      />
    </div>
  );
}
