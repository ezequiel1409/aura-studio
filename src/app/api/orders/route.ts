import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { createOrder } from "../../../services/order.service";
import { getShowroomSettings } from "../../../services/settings.service";
import { DomainError, ProductNotFoundError, OrderNotFoundError } from "../../../domain/errors";
import { getAuthenticatedCustomer } from "../../../infra/auth/customer-session";
import { sanitizeOrderForResponse } from "../../../domain/order";
import { logger } from "../../../lib/logger";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const deps = getProductServiceDeps();

    // Bloqueo de seguridad: Si las ventas están pausadas por el administrador, rechazar nuevas órdenes
    const storeSettings = await getShowroomSettings(deps);
    if (storeSettings.ordersPaused) {
      const durationMs = Math.round(performance.now() - startTime);
      logger.warn("CHECKOUT:ORDERS_PAUSED", "Intento de compra mientras las órdenes están pausadas", {
        durationMs,
        status: 403,
      });
      return NextResponse.json(
        {
          error:
            storeSettings.ordersPausedNotice ||
            "Las ventas online se encuentran temporalmente pausadas. Por favor, intentá nuevamente más tarde.",
        },
        { status: 403 }
      );
    }

    // Si el usuario está autenticado como cliente, vincular la orden a su cuenta
    const customerSession = await getAuthenticatedCustomer(req);
    if (customerSession) {
      if (!body.customerId) {
        body.customerId = customerSession.customerId;
      }
      if (!body.customerEmail && customerSession.email) {
        body.customerEmail = customerSession.email;
      }
      const customerRecord = await deps.customerRepo.findById(customerSession.customerId);
      if (customerRecord) {
        if (!body.customerDni && customerRecord.dni) {
          body.customerDni = customerRecord.dni;
        } else if (body.customerDni && !customerRecord.dni) {
          const cleanDni = String(body.customerDni).replace(/\D/g, "");
          if (cleanDni.length >= 6) {
            await deps.customerRepo.updateProfile(customerRecord.id, {
              dni: cleanDni,
              updatedAt: Date.now(),
            });
          }
        }
      }
    }

    // Vincular al comercio predeterminado si no viene especificado
    if (!body.commerceId && deps.commerceRepo) {
      const defaultCommerce = await deps.commerceRepo.findDefault();
      if (defaultCommerce) {
        body.commerceId = defaultCommerce.id;
      }
    }

    // Validar cupón de descuento en servidor (con tope estricto por email)
    if (body.couponCode && deps.couponRepo) {
      const { validateCoupon } = await import("../../../services/coupon.service");
      const subtotalCents = Array.isArray(body.items)
        ? body.items.reduce(
            (acc: number, item: { unitPriceCents?: number; quantity?: number }) =>
              acc + (item.unitPriceCents || 0) * (item.quantity || 1),
            0
          )
        : 0;

      const validation = await validateCoupon(
        {
          code: body.couponCode,
          email: body.customerEmail || null,
          phone: body.customerPhone || null,
          dni: body.customerDni || null,
          subtotalCents,
          shippingCents: body.shippingCents || 0,
        },
        deps
      );

      if (!validation.valid) {
        return NextResponse.json({ error: validation.message }, { status: 400 });
      }

      body.discountCents = validation.discountCents;
      body.couponCode = validation.code;
    }

    // Validar y aplicar bonificación por método de pago en servidor (BR-47)
    if (body.paymentMethod === "TRANSFER") {
      const { getShowroomSettings } = await import("../../../services/settings.service");
      const { calculatePaymentDiscount } = await import("../../../domain/payment");
      const settings = await getShowroomSettings(deps);
      if (settings.transferEnabled && settings.transferDiscountPercent > 0) {
        const subtotalCents = Array.isArray(body.items)
          ? body.items.reduce(
              (acc: number, item: { unitPriceCents?: number; quantity?: number }) =>
                acc + (item.unitPriceCents || 0) * (item.quantity || 1),
              0
            )
          : 0;
        const couponDiscount = body.discountCents || 0;
        const eligibleSubtotal = Math.max(0, subtotalCents - couponDiscount);
        body.paymentDiscountCents = calculatePaymentDiscount(eligibleSubtotal, settings.transferDiscountPercent);
      }
    }

    // Extraer llave de idempotencia desde cabeceras HTTP o cuerpo para prevenir duplicados
    const headerIdempotency =
      req.headers.get("x-idempotency-key") || req.headers.get("idempotency-key");
    if (!body.idempotencyKey && headerIdempotency) {
      body.idempotencyKey = headerIdempotency;
    }

    body.baseUrl = req.nextUrl.origin;
    const result = await createOrder(body, deps);
    const durationMs = Math.round(performance.now() - startTime);

    logger.info("ORDER:CREATED", `Orden #${result.order.code} generada exitosamente`, {
      orderId: result.order.id,
      orderCode: result.order.code,
      totalCents: result.order.totalCents,
      paymentMethod: result.order.paymentMethod || undefined,
      itemsCount: Array.isArray(body.items) ? body.items.length : 0,
      durationMs,
      status: 200,
    });

    const sanitizedOrder = sanitizeOrderForResponse(result.order);

    return NextResponse.json({
      ok: true,
      ...result,
      order: sanitizedOrder,
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);

    if (error instanceof ProductNotFoundError || error instanceof OrderNotFoundError) {
      logger.warn("ORDER:NOT_FOUND", error.message, { durationMs, status: 404 });
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof DomainError) {
      logger.warn("ORDER:DOMAIN_VALIDATION", error.message, { durationMs, status: 400 });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.error("ORDER:EXCEPTION", "Error interno al procesar orden de compra", error, {
      durationMs,
      status: 500,
    });
    const rawMessage = error instanceof Error ? error.message : "Error al procesar la orden";
    const clientMessage =
      rawMessage.toLowerCase().includes("query") || rawMessage.toLowerCase().includes("sql")
        ? "Error al procesar la orden. Por favor, intentá nuevamente."
        : rawMessage;
    return NextResponse.json({ error: clientMessage }, { status: 500 });
  }
}
