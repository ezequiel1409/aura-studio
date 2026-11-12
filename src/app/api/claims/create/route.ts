import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { createOrderClaim } from "../../../../services/claim.service";
import { logger } from "../../../../lib/logger";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  let body: Record<string, unknown> | undefined;
  try {
    const parsedBody = (await req.json()) as Record<string, unknown>;
    body = parsedBody;
    const deps = getProductServiceDeps();

    const customerDni = String(parsedBody.customerDni || "");
    const customerEmail =
      parsedBody.customerEmail !== undefined ? String(parsedBody.customerEmail) : undefined;

    const claim = await createOrderClaim(
      {
        orderCode: Number(parsedBody.orderCode),
        customerDni,
        customerEmail,
        customerPhone:
          parsedBody.customerPhone !== undefined ? String(parsedBody.customerPhone) : undefined,
        contactValue: parsedBody.contactValue ? String(parsedBody.contactValue) : undefined,
        customerName: parsedBody.customerName ? String(parsedBody.customerName) : undefined,
        reason: parsedBody.reason ? String(parsedBody.reason) : undefined,
        type: parsedBody.type === "EXCHANGE" ? "EXCHANGE" : "REVOCATION",
        conditionAccepted: Boolean(parsedBody.conditionAccepted),
      },
      deps
    );

    const durationMs = Math.round(performance.now() - startTime);
    logger.info("CLAIM:CREATED", `Solicitud postventa generada: ${claim.claimCode}`, {
      claimCode: claim.claimCode,
      orderCode: claim.orderCode,
      type: claim.type,
      dni: customerDni,
      email: customerEmail,
      durationMs,
      status: 200,
    });

    return NextResponse.json({ ok: true, claim });
  } catch (error: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : "Error al procesar la solicitud.";
    const rawOrderCode = body?.orderCode;
    logger.warn("CLAIM:CREATE_FAILED", message, {
      orderCode:
        typeof rawOrderCode === "number" || typeof rawOrderCode === "string"
          ? rawOrderCode
          : undefined,
      durationMs,
      status: 400,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
