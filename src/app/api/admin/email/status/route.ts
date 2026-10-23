import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getEmailService, getEnvVar } from "../../../../../infra/email/resend.adapter";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const emailService = getEmailService();
  const status = emailService.getStatus();
  const recoveryKey = getEnvVar("ADMIN_RECOVERY_KEY");

  return NextResponse.json({
    ok: true,
    email: {
      provider: "Resend",
      configured: status.configured,
      keyMasked: status.keyMasked,
      fromEmail: status.fromEmail,
      orderNotificationsEmail: status.orderNotificationsEmail,
    },
    security: {
      recoveryKeyConfigured: Boolean(recoveryKey && recoveryKey.trim().length > 0),
    },
  });
}

