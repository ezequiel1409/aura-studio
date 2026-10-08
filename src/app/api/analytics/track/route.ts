import { NextRequest, NextResponse } from "next/server";
import { trackAnalyticsEvent, TrackEventInput } from "../../../../services/analytics.service";

export async function POST(req: NextRequest) {
  try {
    const body: TrackEventInput = await req.json();

    // Obtener cookie o header de sesión para debounce
    const sessionCookie = req.cookies.get("aura_session_id")?.value;
    const sessionId = sessionCookie || req.headers.get("x-session-id") || undefined;

    // Verificar si es sesión de admin autenticado (BR-39 exclusión)
    const isAdmin = Boolean(req.cookies.get("aura_admin_token")?.value);

    // Ejecuta de forma asíncrona sin bloquear la respuesta
    trackAnalyticsEvent({
      ...body,
      sessionId,
      isAdmin,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

