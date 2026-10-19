import { NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../infra/db/connection";
import { getAvailablePaymentMethods } from "../../../../services/payment.service";
import { getShowroomSettings } from "../../../../services/settings.service";

export async function GET() {
  try {
    const deps = getProductServiceDeps();
    const [methods, settings] = await Promise.all([
      getAvailablePaymentMethods(deps),
      getShowroomSettings(deps),
    ]);

    return NextResponse.json({
      methods,
      bankDetails: settings.transferEnabled
        ? {
            bankName: settings.transferBankName,
            accountHolder: settings.transferAccountHolder,
            cbu: settings.transferCbu,
            alias: settings.transferAlias,
            cuit: settings.transferCuit,
            discountPercent: settings.transferDiscountPercent,
          }
        : null,
      cashNotes: settings.cashEnabled ? settings.cashNotes : null,
    });
  } catch (error) {
    console.error("Error al obtener métodos de pago:", error);
    return NextResponse.json(
      { error: "Error al consultar métodos de pago disponibles" },
      { status: 500 }
    );
  }
}
