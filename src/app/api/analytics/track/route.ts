import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { trackAnalyticsEvent, TrackEventInput } from "../../../../services/analytics.service";
import { ADMIN_SESSION_COOKIE_NAME } from "../../../../infra/auth/guard";

const BOT_USER_AGENT_REGEX =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|googlebot|bingbot|yandex|duckduckbot|baiduspider|twitterbot/i;

function runBackgroundTask(task: Promise<unknown>): void {
  try {
    const { ctx } = getCloudflareContext();
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(task);
      return;
    }
  } catch {
    // Fuera de entorno Cloudflare (tests unitarios o desarrollo local)
  }
  task.catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    // Filtrar bots para evitar eventos falsos y no consumir escrituras en D1
    const userAgent = req.headers.get("user-agent") || "";
    if (BOT_USER_AGENT_REGEX.test(userAgent)) {
      return NextResponse.json({ ok: true });
    }

    const body: TrackEventInput = await req.json();

    // Obtener cookie o header de sesión para debounce
    const sessionCookie = req.cookies.get("app_session_id")?.value;
    const sessionId = sessionCookie || req.headers.get("x-session-id") || undefined;

    // Verificar si es sesión de admin autenticado (BR-39 exclusión)
    const isAdmin = Boolean(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);

    // Ejecuta en segundo plano con ctx.waitUntil para que Cloudflare Workers no corte la promesa al responder
    const trackPromise = trackAnalyticsEvent({
      ...body,
      sessionId,
      isAdmin,
    });
    runBackgroundTask(trackPromise);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

