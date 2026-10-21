import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getEnv } from "../../../../../lib/env";

export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const env = getEnv();
  const mpToken = env.MP_ACCESS_TOKEN;
  const tokenMasked = mpToken
    ? `${mpToken.slice(0, 8)}••••••••${mpToken.slice(-4)}`
    : null;

  return NextResponse.json({
    ok: true,
    mercadopago: {
      configured: Boolean(mpToken),
      tokenMasked,
      publicKeyConfigured: Boolean(env.MP_PUBLIC_KEY),
      publicKey: env.MP_PUBLIC_KEY || null,
      webhookSecretConfigured: Boolean(env.MP_WEBHOOK_SECRET),
      environment: env.NODE_ENV,
    },
  });
}

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const env = getEnv();
  const mpToken = env.MP_ACCESS_TOKEN;

  if (!mpToken) {
    if (env.NODE_ENV !== "production") {
      return NextResponse.json({
        ok: true,
        status: "SIMULATED",
        message: "Modo desarrollo / simulación activo en servidor (sin MP_ACCESS_TOKEN configurado).",
      });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "Variable de entorno MP_ACCESS_TOKEN no configurada en el servidor.",
      },
      { status: 400 }
    );
  }

  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: {
        Authorization: `Bearer ${mpToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        {
          ok: false,
          error: `Error al verificar credenciales con Mercado Pago (${res.status}): ${errText}`,
        },
        { status: 400 }
      );
    }

    const data = (await res.json()) as {
      id?: number;
      nickname?: string;
      email?: string;
      site_id?: string;
    };

    return NextResponse.json({
      ok: true,
      status: "CONNECTED",
      collectorId: data.id,
      nickname: data.nickname,
      email: data.email,
      siteId: data.site_id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de red al consultar Mercado Pago";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
