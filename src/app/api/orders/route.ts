import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../infra/db/connection";
import { createOrder } from "../../../services/order.service";
import { DomainError, ProductNotFoundError, OrderNotFoundError } from "../../../domain/errors";
import { getAuthenticatedCustomer } from "../../../infra/auth/customer-session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deps = getProductServiceDeps();

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

    body.baseUrl = req.nextUrl.origin;
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
