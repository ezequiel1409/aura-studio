import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { createOrder } from "../../../services/order.service";
import { DomainError, ProductNotFoundError, OrderNotFoundError } from "../../../domain/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deps = getProductServiceDeps();
    const result = await createOrder(body, deps);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProductNotFoundError || error instanceof OrderNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Error al procesar la orden";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
