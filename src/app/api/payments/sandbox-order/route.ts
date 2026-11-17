import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import {
  cancelAbandonedGatewayOrder,
  getCheckoutSandboxOrderSummary,
} from "../../../../services/payment.service";
import { OrderNotFoundError, ValidationError } from "../../../../domain/errors";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawCode = url.searchParams.get("order_code") || "";
    const paymentId = url.searchParams.get("payment_id");
    const orderCode = parseInt(rawCode.replace(/\D/g, ""), 10);

    if (Number.isNaN(orderCode) || orderCode <= 0) {
      return NextResponse.json(
        { error: "Código de orden inválido." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const paymentStatusParam = url.searchParams.get("payment_status");
    const isReturnCallback = Boolean(paymentStatusParam);
    const baseUrl = `${url.protocol}//${url.host}`;
    const order = await getCheckoutSandboxOrderSummary(orderCode, paymentId, deps, {
      baseUrl,
      isReturnCallback,
      paymentStatusParam,
    });

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Error al cargar el resumen de pago." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { order_code?: string | number; action?: string };
    const rawCode = String(body.order_code || "");
    const orderCode = parseInt(rawCode.replace(/\D/g, ""), 10);

    if (Number.isNaN(orderCode) || orderCode <= 0) {
      return NextResponse.json({ error: "Código de orden inválido." }, { status: 400 });
    }

    const deps = getProductServiceDeps();
    if (body.action === "cancel_abandoned") {
      await cancelAbandonedGatewayOrder(orderCode, deps);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
