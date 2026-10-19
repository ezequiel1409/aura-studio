import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { createOrderClaim } from "../../../../services/claim.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deps = getProductServiceDeps();

    const claim = await createOrderClaim(
      {
        orderCode: Number(body.orderCode),
        customerDni: String(body.customerDni || ""),
        contactValue: String(body.contactValue || ""),
        customerName: body.customerName ? String(body.customerName) : undefined,
        reason: body.reason ? String(body.reason) : undefined,
        type: body.type === "EXCHANGE" ? "EXCHANGE" : "REVOCATION",
        conditionAccepted: Boolean(body.conditionAccepted),
      },
      deps
    );

    return NextResponse.json({ ok: true, claim });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al procesar la solicitud.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
