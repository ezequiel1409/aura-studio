import { OrderEmailData } from "../../domain/ports/email.port";
import { formatPrice } from "../format/currency";

const BASE_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBFBF9; margin: 0; padding: 32px 16px; color: #1C1917; }
  .card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #E7E5E4; padding: 36px 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
  .brand { font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #1C1917; text-align: center; margin-bottom: 24px; }
  h1 { font-size: 20px; font-weight: 600; margin: 0 0 12px 0; color: #1C1917; }
  p { font-size: 14px; line-height: 1.6; color: #44403C; margin: 0 0 16px 0; }
  .order-badge { display: inline-block; background-color: #F5F5F4; border: 1px solid #E7E5E4; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 13px; font-weight: 700; color: #1C1917; }
  .items-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  .items-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #78716C; padding-bottom: 8px; border-bottom: 1px solid #E7E5E4; }
  .items-table td { padding: 12px 0; border-bottom: 1px solid #F5F5F4; font-size: 13px; vertical-align: top; }
  .item-img { width: 44px; height: 54px; object-fit: cover; border-radius: 6px; border: 1px solid #E7E5E4; margin-right: 12px; float: left; }
  .totals-box { margin-top: 16px; padding-top: 16px; border-top: 1px solid #E7E5E4; }
  .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #57534E; margin-bottom: 6px; }
  .total-row.final { font-size: 16px; font-weight: 700; color: #1C1917; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E7E5E4; }
  .info-box { background-color: #FAF8F5; border: 1px solid #E7E2DA; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; line-height: 1.6; }
  .btn-container { text-align: center; margin: 28px 0; }
  .btn { display: inline-block; background-color: #1C1917; color: #ffffff !important; text-decoration: none; padding: 13px 26px; border-radius: 10px; font-weight: 600; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #F5F5F4; font-size: 12px; color: #78716C; text-align: center; line-height: 1.5; }
`;

function renderItemsHtml(items: OrderEmailData["items"], currency: string): string {
  return items
    .map(
      (item) => `
    <tr>
      <td>
        ${item.photoUrl ? `<img src="${item.photoUrl}" alt="${item.productTitle}" class="item-img" />` : ""}
        <div>
          <strong style="color: #1C1917;">${item.productTitle}</strong>
          <div style="font-size: 11px; color: #78716C; margin-top: 2px;">
            ${item.colorName !== "Único" ? `Color: ${item.colorName} · ` : ""}Talle: ${item.size} · Cantidad: ${item.quantity}
          </div>
        </div>
      </td>
      <td style="text-align: right; white-space: nowrap; font-weight: 600; color: #1C1917;">
        ${formatPrice(item.unitPriceCents * item.quantity, currency)}
      </td>
    </tr>`
    )
    .join("");
}

export function generateOrderCreatedTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const subject = `Confirmación de pedido #${data.formattedCode} - ${brand}`;

  const isTransfer = data.paymentMethod === "TRANSFER";
  const isPickup = data.deliveryMethod === "PICKUP";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="brand">${brand}</div>
    <h1>¡Gracias por tu compra, ${data.customerName}!</h1>
    <p>Hemos registrado tu pedido <span class="order-badge">#${data.formattedCode}</span> con éxito.</p>

    ${
      isTransfer
        ? `
      <div class="info-box" style="border-left: 4px solid #B45309; background-color: #FEF3C7; color: #78350F;">
        <strong style="display: block; font-size: 14px; margin-bottom: 4px;">Datos para realizar tu transferencia</strong>
        Tus prendas quedan <strong>reservadas por 24 horas</strong>. Por favor transferí el importe exacto para confirmar tu compra:
        <div style="margin-top: 10px; font-family: monospace; font-size: 12px; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #FDE68A;">
          ${data.bankDetails?.bankName ? `<div><strong>Banco:</strong> ${data.bankDetails.bankName}</div>` : ""}
          ${data.bankDetails?.accountHolder ? `<div><strong>Titular:</strong> ${data.bankDetails.accountHolder}</div>` : ""}
          ${data.bankDetails?.cbu ? `<div><strong>CBU:</strong> ${data.bankDetails.cbu}</div>` : ""}
          ${data.bankDetails?.alias ? `<div><strong>Alias:</strong> ${data.bankDetails.alias}</div>` : ""}
          ${data.bankDetails?.cuit ? `<div><strong>CUIT:</strong> ${data.bankDetails.cuit}</div>` : ""}
          <div style="margin-top: 4px;"><strong>Total a transferir:</strong> ${formatPrice(data.totalCents, data.currency)}</div>
        </div>
        <p style="font-size: 11px; margin: 8px 0 0 0; color: #92400E;">Podés adjuntar tu comprobante ingresando al enlace de tu pedido.</p>
      </div>`
        : ""
    }

    <table class="items-table">
      <thead>
        <tr>
          <th>Prenda</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${renderItemsHtml(data.items, data.currency)}
      </tbody>
    </table>

    <div class="totals-box">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; color: #57534E;">
        <span>Subtotal:</span>
        <span>${formatPrice(data.subtotalCents, data.currency)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; color: #57534E;">
        <span>Envío:</span>
        <span>${data.shippingCents > 0 ? formatPrice(data.shippingCents, data.currency) : "Gratis"}</span>
      </div>
      ${
        data.discountCents > 0
          ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; color: #047857;">
        <span>Descuento aplicado:</span>
        <span>-${formatPrice(data.discountCents, data.currency)}</span>
      </div>`
          : ""
      }
      <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #E7E5E4; font-size: 16px; font-weight: 700; color: #1C1917;">
        <span>Total:</span>
        <span>${formatPrice(data.totalCents, data.currency)}</span>
      </div>
    </div>

    <div class="info-box">
      <strong>Entrega:</strong> ${
        isPickup
          ? `Retiro en Showroom (${data.showroomAddress || "Showroom Oficial"})`
          : `Envío a Domicilio (${data.deliveryAddress || "Dirección ingresada"})`
      }
    </div>

    ${
      data.receiptUrl
        ? `
    <div class="btn-container">
      <a href="${data.receiptUrl}" class="btn" target="_blank">Ver estado de mi pedido</a>
    </div>`
        : ""
    }

    <div class="footer">
      <p>Si tenés alguna consulta, escribinos directamente por WhatsApp al ${data.supportWhatsapp || "soporte"}.</p>
      <p>© ${new Date().getFullYear()} ${brand}. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
${brand} - Confirmación de pedido #${data.formattedCode}

Hola ${data.customerName},
Hemos registrado tu pedido #${data.formattedCode} con éxito.

Total: ${formatPrice(data.totalCents, data.currency)}
Entrega: ${isPickup ? "Retiro en Showroom" : "Envío a Domicilio"}

${
  isTransfer
    ? `DATOS DE TRANSFERENCIA (Reserva por 24 horas):
CBU: ${data.bankDetails?.cbu || "-"}
Alias: ${data.bankDetails?.alias || "-"}
Titular: ${data.bankDetails?.accountHolder || "-"}
Total: ${formatPrice(data.totalCents, data.currency)}`
    : ""
}

Ver tu pedido en línea: ${data.receiptUrl || ""}
`;

  return { subject, html, text };
}

export function generateOrderPaidTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const subject = `¡Pago acreditado! Tu pedido #${data.formattedCode} está confirmado - ${brand}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="brand">${brand}</div>
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #D1FAE5; color: #065F46; border-radius: 50%; width: 44px; height: 44px; line-height: 44px; font-size: 22px;">✓</span>
    </div>
    <h1 style="text-align: center;">¡Pago Acreditado!</h1>
    <p style="text-align: center;">Hola <strong>${data.customerName}</strong>, hemos recibido y verificado tu pago para el pedido <span class="order-badge">#${data.formattedCode}</span>.</p>

    <div class="info-box" style="border-left: 4px solid #059669; background-color: #ECFDF5; color: #064E3B;">
      Tus prendas ya están aseguradas y nuestro equipo del showroom comenzó con la preparación y empaquetado de tus piezas. Te notificaremos en cuanto estén listas.
    </div>

    <table class="items-table">
      <tbody>
        ${renderItemsHtml(data.items, data.currency)}
      </tbody>
    </table>

    ${
      data.receiptUrl
        ? `
    <div class="btn-container">
      <a href="${data.receiptUrl}" class="btn" target="_blank">Ver detalle del pedido</a>
    </div>`
        : ""
    }

    <div class="footer">
      <p>Aura Studio · Showroom Exclusivo</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
${brand} - ¡Pago Acreditado! Pedido #${data.formattedCode}

Hola ${data.customerName},
Verificamos tu pago con éxito. Tus prendas ya están aseguradas y comenzamos con la preparación de tu pedido.

Ver estado: ${data.receiptUrl || ""}
`;

  return { subject, html, text };
}

export function generateOrderShippedTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const isPickup = data.deliveryMethod === "PICKUP";
  const subject = isPickup
    ? `¡Tu pedido #${data.formattedCode} está listo para retirar! - ${brand}`
    : `¡Tu pedido #${data.formattedCode} está en camino! - ${brand}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="brand">${brand}</div>
    <h1>${isPickup ? "¡Tu pedido está listo para retirar!" : "¡Tu pedido está en camino!"}</h1>
    <p>Hola <strong>${data.customerName}</strong>,</p>

    ${
      isPickup
        ? `
      <div class="info-box" style="border-left: 4px solid #0284C7; background-color: #F0F9FF; color: #0C4A6E;">
        <strong style="display: block; font-size: 14px; margin-bottom: 4px;">Punto de retiro:</strong>
        ${data.showroomAddress || "Showroom Oficial de Aura Studio"}<br />
        <span style="font-size: 12px; color: #0369A1; margin-top: 6px; display: block;">Recordá presentar tu número de pedido <strong>#${data.formattedCode}</strong> o DNI al retirar.</span>
      </div>`
        : `
      <div class="info-box" style="border-left: 4px solid #0284C7; background-color: #F0F9FF; color: #0C4A6E;">
        Tu paquete ya fue despachado y se encuentra en viaje hacia tu domicilio:<br />
        <strong>${data.deliveryAddress || "Dirección de entrega"}</strong>
      </div>`
    }

    <table class="items-table">
      <tbody>
        ${renderItemsHtml(data.items, data.currency)}
      </tbody>
    </table>

    ${
      data.receiptUrl
        ? `
    <div class="btn-container">
      <a href="${data.receiptUrl}" class="btn" target="_blank">Ver recibo del pedido</a>
    </div>`
        : ""
    }

    <div class="footer">
      <p>Aura Studio · Showroom Exclusivo</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
${brand} - ${isPickup ? "Listo para retirar" : "En camino"} (Pedido #${data.formattedCode})

Hola ${data.customerName},
${isPickup ? `Tu pedido ya está listo para retirar en ${data.showroomAddress || "el showroom"}.` : `Tu pedido ya fue despachado a ${data.deliveryAddress || "tu domicilio"}.`}

Ver recibo: ${data.receiptUrl || ""}
`;

  return { subject, html, text };
}

export function generateOrderCancelledTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const subject = `Aviso sobre tu pedido #${data.formattedCode} - ${brand}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="brand">${brand}</div>
    <h1>Pedido Cancelado</h1>
    <p>Hola <strong>${data.customerName}</strong>,</p>
    <p>Te informamos que el pedido <span class="order-badge">#${data.formattedCode}</span> ha sido cancelado y las prendas han vuelto al stock disponible.</p>

    <div class="info-box" style="background-color: #F5F5F4; color: #57534E;">
      Si realizaste una transferencia en las últimas horas o considerás que esto fue un error, por favor contactanos de inmediato por WhatsApp para asistirte.
    </div>

    <div class="footer">
      <p>Aura Studio · Showroom Exclusivo</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
${brand} - Pedido #${data.formattedCode} cancelado

Hola ${data.customerName},
Tu pedido #${data.formattedCode} fue cancelado y las prendas volvieron al stock disponible.
`;

  return { subject, html, text };
}

export function generateAdminNewOrderAlertTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const subject = `🎉 Nueva Venta: Pedido #${data.formattedCode} (${data.customerName}) - ${formatPrice(data.totalCents, data.currency)}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="brand">${brand} · Panel de Control</div>
    <h1>🎉 ¡Nueva venta registrada!</h1>
    <p>Se acaba de registrar el pedido <span class="order-badge">#${data.formattedCode}</span> por un total de <strong>${formatPrice(data.totalCents, data.currency)}</strong>.</p>

    <div class="info-box">
      <strong>Cliente:</strong> ${data.customerName}<br />
      <strong>Email:</strong> ${data.customerEmail}<br />
      <strong>Teléfono:</strong> ${data.customerPhone || "No especificado"}<br />
      <strong>Método de pago:</strong> ${data.paymentMethod}<br />
      <strong>Entrega:</strong> ${data.deliveryMethod === "PICKUP" ? "Retiro en Showroom" : `Envío a: ${data.deliveryAddress || "Domicilio"}`}
    </div>

    <table class="items-table">
      <tbody>
        ${renderItemsHtml(data.items, data.currency)}
      </tbody>
    </table>

    <div class="btn-container">
      <a href="${data.receiptUrl ? data.receiptUrl.replace("/carrito", "/admin/ordenes") : "/admin/ordenes"}" class="btn" target="_blank">Gestionar orden en Backoffice</a>
    </div>

    <div class="footer">
      <p>Notificación interna automática de ventas · Aura Studio</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Nueva venta registrada en ${brand}
Pedido #${data.formattedCode}
Cliente: ${data.customerName} (${data.customerEmail})
Total: ${formatPrice(data.totalCents, data.currency)}
`;

  return { subject, html, text };
}

