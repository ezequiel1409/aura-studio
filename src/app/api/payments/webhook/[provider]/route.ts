import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { processPaymentWebhook } from "../../../../../services/payment.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await context.params;
    const deps = getProductServiceDeps();

    let payload: unknown = {};
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      const obj: Record<string, unknown> = {};
      formData.forEach((val, key) => {
        obj[key] = val;
      });
      payload = obj;
    }

    // Convertir cabeceras a objeto simple
    const headers: Record<string, string> = {};
    request.headers.forEach((val, key) => {
      headers[key] = val;
    });

    // También leer query params (algunos webhooks de MP envían ?topic=payment&id=123)
    const url = new URL(request.url);
    const queryId = url.searchParams.get("id") || url.searchParams.get("data.id");
    const queryTopic = url.searchParams.get("topic") || url.searchParams.get("type");

    if (queryId && typeof payload === "object" && payload !== null) {
      (payload as Record<string, unknown>).id = queryId;
      (payload as Record<string, unknown>).topic = queryTopic;
    }

    const result = await processPaymentWebhook(provider, payload, headers, deps);

    return NextResponse.json({
      received: true,
      provider,
      status: result?.status || "UNKNOWN",
      orderCode: result?.orderCode,
    });
  } catch (error) {
    console.error("Error al procesar webhook de pagos:", error);
    // Retornamos 200 a las pasarelas para que no reintenten indefinidamente ante errores de parseo
    return NextResponse.json({ received: false, error: (error as Error).message }, { status: 200 });
  }
}
