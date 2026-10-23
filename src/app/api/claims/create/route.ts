import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { createOrderClaim } from "../../../../services/claim.service";
import { logger } from "../../../../lib/logger";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  let body: any;
  try {
    body = await req.json();
    const deps = getProductServiceDeps();

    const claim = await createOrderClaim(
      {
        orderCode: Number(body.orderCode),
        customerDni: String(body.customerDni || ""),
        customerEmail: body.customerEmail !== undefined ? String(body.customerEmail) : undefined,
        customerPhone: body.customerPhone !== undefined ? String(body.customerPhone) : undefined,
        contactValue: body.contactValue ? String(body.contactValue) : undefined,
        customerName: body.customerName ? String(body.customerName) : undefined,
        reason: body.reason ? String(body.reason) : undefined,
        type: body.type === "EXCHANGE" ? "EXCHANGE" : "REVOCATION",
        conditionAccepted: Boolean(body.conditionAccepted),
      },
      deps
    );

    const durationMs = Math.round(performance.now() - startTime);
    logger.info("CLAIM:CREATED", `Solicitud postventa generada: ${claim.claimCode}`, {
      claimCode: claim.claimCode,
      orderCode: claim.orderCode,
      type: claim.type,
      dni: body.customerDni,
      email: body.customerEmail,
      durationMs,
      status: 200,
    });

    return NextResponse.json({ ok: true, claim });
  } catch (error: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : "Error al procesar la solicitud.";
    logger.warn("CLAIM:CREATE_FAILED", message, {
      orderCode: body?.orderCode,
      durationMs,
      status: 400,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
