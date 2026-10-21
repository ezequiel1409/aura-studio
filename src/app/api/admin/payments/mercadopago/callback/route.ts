import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../../../infra/db/connection";
import { updateShowroomSettings } from "../../../../../../services/settings.service";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const returnBase = `${url.origin}/admin/tienda/pagos`;

  if (error || !code) {
    return NextResponse.redirect(
      `${returnBase}?error=${encodeURIComponent(error || "Autorización cancelada por el usuario")}`
    );
  }

  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  const redirectUri = `${url.origin}/api/admin/payments/mercadopago/callback`;
  const deps = getProductServiceDeps();

  // Modo producción con credenciales de aplicación Marketplace de Mercado Pago
  if (clientId && clientSecret && !code.startsWith("dev_code_")) {
    try {
      const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenRes.ok) {
        const errorData = await tokenRes.text();
        return NextResponse.redirect(
          `${returnBase}?error=${encodeURIComponent("Error al intercambiar token con Mercado Pago: " + errorData)}`
        );
      }

      const data = (await tokenRes.json()) as {
        access_token: string;
        public_key: string;
        user_id?: number | string;
        live_mode?: boolean;
      };

      await updateShowroomSettings(
        {
          mercadopagoEnabled: true,
          mercadopagoAccessToken: data.access_token,
          mercadopagoPublicKey: data.public_key,
          mercadopagoConnectedAccount: data.user_id ? `ID #${data.user_id}` : "Cuenta vinculada",
        },
        deps
      );

      return NextResponse.redirect(`${returnBase}?status=mp_connected`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado en OAuth";
      return NextResponse.redirect(`${returnBase}?error=${encodeURIComponent(msg)}`);
    }
  }

  // Modo desarrollo / simulación
  await updateShowroomSettings(
    {
      mercadopagoEnabled: true,
      mercadopagoAccessToken: `APP_USR_simulated_${Date.now()}`,
      mercadopagoPublicKey: `APP_USR_pub_${Date.now()}`,
      mercadopagoConnectedAccount: "comercio.aura@gmail.com (ID: 849201938)",
    },
    deps
  );

  return NextResponse.redirect(`${returnBase}?status=mp_connected`);
}

