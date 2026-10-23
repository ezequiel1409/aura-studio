import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getEmailService, getEnvVar } from "../../../../../infra/email/resend.adapter";
import { getShowroomSettings } from "../../../../../services/settings.service";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const deps = getProductServiceDeps();
  const settings = await getShowroomSettings(deps);
  const brandName = settings.showroomName || "Aura Studio";

  const emailService = getEmailService();
  const status = emailService.getStatus(brandName);
  const recoveryKey = getEnvVar("ADMIN_RECOVERY_KEY");

  return NextResponse.json({
    ok: true,
    email: {
      provider: "Resend",
      configured: status.configured,
      keyMasked: status.keyMasked,
      fromEmail: status.fromEmail,
      orderNotificationsEmail: status.orderNotificationsEmail,
      brandName,
    },
    security: {
      recoveryKeyConfigured: Boolean(recoveryKey && recoveryKey.trim().length > 0),
    },
  });
}
