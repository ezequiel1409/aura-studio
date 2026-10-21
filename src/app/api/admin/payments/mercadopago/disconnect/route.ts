import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../../infra/db/connection";
import { updateShowroomSettings } from "../../../../../../services/settings.service";

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const deps = getProductServiceDeps();
    await updateShowroomSettings(
      {
        mercadopagoAccessToken: "",
        mercadopagoPublicKey: "",
        mercadopagoConnectedAccount: "",
        mercadopagoEnabled: false,
      },
      deps
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al desvincular cuenta";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

