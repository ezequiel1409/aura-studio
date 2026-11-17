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
  const mpPubKey = process.env.MP_PUBLIC_KEY || env.MP_PUBLIC_KEY;
  const isSandbox = env.MP_SANDBOX !== "false";
  const tokenConfigured = Boolean(
    mpToken && !mpToken.startsWith("TEST-00000000") && !mpToken.startsWith("test_mock_")
  );
  const publicKeyConfigured = Boolean(
    mpPubKey && !mpPubKey.startsWith("TEST-00000000") && !mpPubKey.startsWith("test_mock_")
  );
  const tokenMasked = mpToken
    ? `${mpToken.slice(0, 8)}••••••••${mpToken.slice(-4)}`
    : null;

  return NextResponse.json({
    ok: true,
    mercadopago: {
      configured: Boolean(mpToken),
      liveTokenConfigured: tokenConfigured,
      sandbox: isSandbox,
      tokenMasked,
      publicKeyConfigured,
      publicKey: publicKeyConfigured ? mpPubKey : null,
      webhookSecretConfigured: Boolean(process.env.MP_WEBHOOK_SECRET || env.MP_WEBHOOK_SECRET),
      environment: isSandbox ? "sandbox" : env.NODE_ENV,
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
  const isDevelopmentPlaceholder =
    !mpToken ||
    mpToken.startsWith("TEST-00000000") ||
    mpToken.startsWith("test_mock_");

  if (isDevelopmentPlaceholder) {
    if (env.NODE_ENV !== "production" || env.MP_SANDBOX !== "false") {
      return NextResponse.json({
        ok: true,
        status: "SIMULATED",
        sandbox: env.MP_SANDBOX !== "false",
        message: "Modo desarrollo / sandbox activo en servidor.",
      });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "Variable de entorno MP_ACCESS_TOKEN productiva no configurada en el servidor.",
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
