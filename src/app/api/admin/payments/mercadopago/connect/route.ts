import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../../infra/auth/guard";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const clientId = process.env.MP_CLIENT_ID;
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/admin/payments/mercadopago/callback`;
  const state = Math.random().toString(36).substring(2, 15);

  if (!clientId) {
    // Si la app aún no configuró MP_CLIENT_ID en variables de entorno,
    // proveemos una URL de simulación / testing rápido para que el comercio pueda
    // verificar el flujo OAuth de inmediato sin trabas.
    const devUrl = `${redirectUri}?code=dev_code_${Date.now()}&state=${state}`;
    return NextResponse.json({
      ok: true,
      authUrl: devUrl,
      mode: "development",
      message: "Modo simulación OAuth activo (para producción configure MP_CLIENT_ID y MP_CLIENT_SECRET).",
    });
  }

  // URL oficial de Mercado Pago Connect / OAuth 2.0
  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${encodeURIComponent(
    clientId
  )}&response_type=code&platform_id=mp&state=${state}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;

  return NextResponse.json({ ok: true, authUrl, mode: "production" });
}

