import { OrderEmailData } from "../../domain/ports/email.port";
import { formatPrice } from "../format/currency";
import {
  EmailCustomizationConfig,
  EmailEventTemplateConfig,
  EmailEventTrigger,
  EmailLayoutConfig,
  interpolateVariables,
} from "../../domain/email/customization";

function getBaseStyles(brandColor = "#1C1917"): string {
  return `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBFBF9; margin: 0; padding: 32px 16px; color: #1C1917; }
  .card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #E7E5E4; padding: 36px 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
  .brand { font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #1C1917; text-align: center; margin-bottom: 24px; }
  .header-greeting { text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #78716C; margin-top: -16px; margin-bottom: 24px; }
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
  .btn { display: inline-block; background-color: ${brandColor}; color: #ffffff !important; text-decoration: none; padding: 13px 26px; border-radius: 10px; font-weight: 600; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #F5F5F4; font-size: 12px; color: #78716C; text-align: center; line-height: 1.5; }
`;
}

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

/**
 * Busca si el comerciante configuró una plantilla específica para este trigger de evento
 */
function getEventConfig(
  customization: EmailCustomizationConfig | undefined,
  trigger: EmailEventTrigger
): EmailEventTemplateConfig | undefined {
  if (!customization?.events) return undefined;
  return customization.events.find((e) => e.trigger === trigger && e.enabled);
}

/**
 * Genera el diccionario de variables disponibles para interpolar
 */
function getVariables(data: OrderEmailData, brand: string): Record<string, string> {
  const code = data.formattedCode.startsWith("#") ? data.formattedCode : `#${data.formattedCode}`;
  return {
    nombre: data.customerName || "Cliente",
    codigo_pedido: code,
    nombre_tienda: brand,
    total: formatPrice(data.totalCents, data.currency),
    link_pedido: data.receiptUrl || "",
    catalogo_url: "/",
    carrito_url: "/carrito",
    producto_url: "/",
    whatsapp: data.supportWhatsapp || "",
  };
}

/**
 * Renderiza el encabezado corporativo (logo o nombre de marca + saludo superior si existe)
 */
function renderHeader(brand: string, layout?: EmailLayoutConfig): string {
  const logoHtml = layout?.logoUrl
    ? `<div style="text-align: center; margin-bottom: 20px;">
        <img src="${layout.logoUrl}" alt="${brand}" style="max-height: 52px; max-width: 220px; object-fit: contain; margin: 0 auto; display: block;" />
      </div>`
    : `<div class="brand">${brand}</div>`;

  const greetingHtml = layout?.headerGreeting
    ? `<div class="header-greeting">${layout.headerGreeting}</div>`
    : "";

  return `${logoHtml}${greetingHtml}`;
}

/**
 * Renderiza el pie de página unificado respetando las configuraciones de marca
 */
function renderFooter(brand: string, data: OrderEmailData, layout?: EmailLayoutConfig): string {
  const customFooter = layout?.footerText
    ? `<p>${layout.footerText}</p>`
    : `<p>Si tenés alguna consulta, escribinos directamente por WhatsApp al ${data.supportWhatsapp || "soporte"}.</p>`;

  const address =
    (layout?.showAddress ?? true) && (data.showroomAddress || data.deliveryAddress)
      ? `<p style="font-size: 11px; color: #A8A29E; margin-top: 6px;">${data.showroomAddress || data.deliveryAddress}</p>`
      : "";

  const whatsapp =
    data.supportWhatsapp && !layout?.footerText?.includes(data.supportWhatsapp)
      ? `<p style="font-size: 11px; color: #A8A29E; margin-top: 4px;">WhatsApp de atención: ${data.supportWhatsapp}</p>`
      : "";

  return `
    <div class="footer">
      ${customFooter}
      ${address}
      ${whatsapp}
      <p style="margin-top: 10px; font-size: 11px; color: #A8A29E;">© ${new Date().getFullYear()} ${brand}. Todos los derechos reservados.</p>
    </div>
  `;
}

export function generateOrderCreatedTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const layout = data.emailCustomization?.layout;
  const brandColor = layout?.brandColor || "#1C1917";
  const event = getEventConfig(data.emailCustomization, "order_created");
  const vars = getVariables(data, brand);

  const subject = event?.subject
    ? interpolateVariables(event.subject, vars)
    : `Confirmación de pedido #${data.formattedCode} - ${brand}`;

  const headline = event?.headline
    ? interpolateVariables(event.headline, vars)
    : `¡Gracias por tu compra, ${data.customerName}!`;

  const bodyText = event?.bodyText
    ? interpolateVariables(event.bodyText, vars)
    : `Hemos registrado tu pedido <span class="order-badge">#${data.formattedCode}</span> con éxito.`;

  const btnText = event?.buttonText
    ? interpolateVariables(event.buttonText, vars)
    : "Ver estado de mi pedido";

  const btnUrl = event?.buttonUrl
    ? interpolateVariables(event.buttonUrl, vars)
    : data.receiptUrl;

  const isTransfer = data.paymentMethod === "TRANSFER";
  const isPickup = data.deliveryMethod === "PICKUP";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${getBaseStyles(brandColor)}</style>
</head>
<body>
  <div class="card">
    ${renderHeader(brand, layout)}
    <h1>${headline}</h1>
    <p>${bodyText}</p>

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
      btnUrl
        ? `
    <div class="btn-container">
      <a href="${btnUrl}" class="btn" target="_blank">${btnText}</a>
    </div>`
        : ""
    }

    ${renderFooter(brand, data, layout)}
  </div>
</body>
</html>
`;

  const text = `
${brand} - Confirmación de pedido #${data.formattedCode}

Hola ${data.customerName},
${bodyText.replace(/<[^>]+>/g, "")}

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

Ver tu pedido en línea: ${btnUrl || ""}
`;

  return { subject, html, text };
}

export function generateOrderPaidTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const layout = data.emailCustomization?.layout;
  const brandColor = layout?.brandColor || "#1C1917";
  const event = getEventConfig(data.emailCustomization, "order_paid");
  const vars = getVariables(data, brand);

  const subject = event?.subject
    ? interpolateVariables(event.subject, vars)
    : `¡Pago acreditado! Tu pedido #${data.formattedCode} está confirmado - ${brand}`;

  const headline = event?.headline
    ? interpolateVariables(event.headline, vars)
    : "¡Pago Acreditado!";

  const bodyText = event?.bodyText
    ? interpolateVariables(event.bodyText, vars)
    : `Hola <strong>${data.customerName}</strong>, hemos recibido y verificado tu pago para el pedido <span class="order-badge">#${data.formattedCode}</span>.`;

  const btnText = event?.buttonText
    ? interpolateVariables(event.buttonText, vars)
    : "Ver detalle del pedido";

  const btnUrl = event?.buttonUrl
    ? interpolateVariables(event.buttonUrl, vars)
    : data.receiptUrl;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${getBaseStyles(brandColor)}</style>
</head>
<body>
  <div class="card">
    ${renderHeader(brand, layout)}
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #D1FAE5; color: #065F46; border-radius: 50%; width: 44px; height: 44px; line-height: 44px; font-size: 22px;">✓</span>
    </div>
    <h1 style="text-align: center;">${headline}</h1>
    <p style="text-align: center;">${bodyText}</p>

    <div class="info-box" style="border-left: 4px solid #059669; background-color: #ECFDF5; color: #064E3B;">
      Tus prendas ya están aseguradas y nuestro equipo comenzó con la preparación y empaquetado de tus piezas. Te notificaremos en cuanto estén listas.
    </div>

    <table class="items-table">
      <tbody>
        ${renderItemsHtml(data.items, data.currency)}
      </tbody>
    </table>

    ${
      btnUrl
        ? `
    <div class="btn-container">
      <a href="${btnUrl}" class="btn" target="_blank">${btnText}</a>
    </div>`
        : ""
    }

    ${renderFooter(brand, data, layout)}
  </div>
</body>
</html>`;

  const text = `
${brand} - ¡Pago Acreditado! Pedido #${data.formattedCode}

Hola ${data.customerName},
${bodyText.replace(/<[^>]+>/g, "")}

Ver estado: ${btnUrl || ""}
`;

  return { subject, html, text };
}

export function generateOrderShippedTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const layout = data.emailCustomization?.layout;
  const brandColor = layout?.brandColor || "#1C1917";
  const event = getEventConfig(data.emailCustomization, "order_shipped");
  const vars = getVariables(data, brand);
  const isPickup = data.deliveryMethod === "PICKUP";

  const defaultSubject = isPickup
    ? `¡Tu pedido #${data.formattedCode} está listo para retirar! - ${brand}`
    : `¡Tu pedido #${data.formattedCode} está en camino! - ${brand}`;

  const defaultHeadline = isPickup
    ? "¡Tu pedido está listo para retirar!"
    : "¡Tu pedido está en camino!";

  const subject = event?.subject
    ? interpolateVariables(event.subject, vars)
    : defaultSubject;

  const headline = event?.headline
    ? interpolateVariables(event.headline, vars)
    : defaultHeadline;

  const bodyText = event?.bodyText
    ? interpolateVariables(event.bodyText, vars)
    : `Hola <strong>${data.customerName}</strong>, tu pedido <span class="order-badge">#${data.formattedCode}</span> ya está listo para ti.`;

  const btnText = event?.buttonText
    ? interpolateVariables(event.buttonText, vars)
    : isPickup ? "Ver datos de retiro" : "Ver recibo del pedido";

  const btnUrl = event?.buttonUrl
    ? interpolateVariables(event.buttonUrl, vars)
    : data.receiptUrl;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${getBaseStyles(brandColor)}</style>
</head>
<body>
  <div class="card">
    ${renderHeader(brand, layout)}
    <h1>${headline}</h1>
    <p>${bodyText}</p>

    ${
      isPickup
        ? `
      <div class="info-box" style="border-left: 4px solid #0284C7; background-color: #F0F9FF; color: #0C4A6E;">
        <strong style="display: block; font-size: 14px; margin-bottom: 4px;">Punto de retiro:</strong>
        ${data.showroomAddress || "Showroom Oficial"}<br />
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
      btnUrl
        ? `
    <div class="btn-container">
      <a href="${btnUrl}" class="btn" target="_blank">${btnText}</a>
    </div>`
        : ""
    }

    ${renderFooter(brand, data, layout)}
  </div>
</body>
</html>`;

  const text = `
${brand} - ${headline} (Pedido #${data.formattedCode})

Hola ${data.customerName},
${bodyText.replace(/<[^>]+>/g, "")}
${isPickup ? `Punto de retiro: ${data.showroomAddress || "Showroom Oficial"}` : `Dirección de entrega: ${data.deliveryAddress || "Tu domicilio"}`}

Ver recibo: ${btnUrl || ""}
`;

  return { subject, html, text };
}

export function generateOrderDeliveredTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const layout = data.emailCustomization?.layout;
  const brandColor = layout?.brandColor || "#1C1917";
  const event = getEventConfig(data.emailCustomization, "order_delivered");
  const vars = getVariables(data, brand);

  const subject = event?.subject
    ? interpolateVariables(event.subject, vars)
    : `¡Esperamos que disfrutes tu compra! - ${brand}`;

  const headline = event?.headline
    ? interpolateVariables(event.headline, vars)
    : "¡Pedido entregado con éxito!";

  const bodyText = event?.bodyText
    ? interpolateVariables(event.bodyText, vars)
    : `Hola <strong>${data.customerName}</strong>, tu pedido <span class="order-badge">#${data.formattedCode}</span> figura como entregado. Deseamos de corazón que disfrutes tus nuevas piezas exclusivas.`;

  const btnText = event?.buttonText
    ? interpolateVariables(event.buttonText, vars)
    : "Ver resumen de compra";

  const btnUrl = event?.buttonUrl
    ? interpolateVariables(event.buttonUrl, vars)
    : data.receiptUrl;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${getBaseStyles(brandColor)}</style>
</head>
<body>
  <div class="card">
    ${renderHeader(brand, layout)}
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background-color: #FDF2F8; color: #BE185D; border-radius: 50%; width: 44px; height: 44px; line-height: 44px; font-size: 22px;">♥</span>
    </div>
    <h1 style="text-align: center;">${headline}</h1>
    <p style="text-align: center;">${bodyText}</p>

    <div class="info-box" style="background-color: #FAF5FF; border-left: 4px solid #9333EA; color: #581C87;">
      ¡Nos encantaría ver cómo te quedan tus prendas! Si te animás, subí una foto etiquetándonos en Instagram para ser parte de nuestra comunidad.
    </div>

    <table class="items-table">
      <tbody>
        ${renderItemsHtml(data.items, data.currency)}
      </tbody>
    </table>

    ${
      btnUrl
        ? `
    <div class="btn-container">
      <a href="${btnUrl}" class="btn" target="_blank">${btnText}</a>
    </div>`
        : ""
    }

    ${renderFooter(brand, data, layout)}
  </div>
</body>
</html>`;

  const text = `
${brand} - ¡Pedido Entregado! (#${data.formattedCode})

Hola ${data.customerName},
${bodyText.replace(/<[^>]+>/g, "")}

Ver compra: ${btnUrl || ""}
`;

  return { subject, html, text };
}

export function generateOrderCancelledTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const layout = data.emailCustomization?.layout;
  const brandColor = layout?.brandColor || "#1C1917";
  const event = getEventConfig(data.emailCustomization, "order_cancelled");
  const vars = getVariables(data, brand);

  const subject = event?.subject
    ? interpolateVariables(event.subject, vars)
    : `Aviso sobre tu pedido #${data.formattedCode} - ${brand}`;

  const headline = event?.headline
    ? interpolateVariables(event.headline, vars)
    : "Pedido Cancelado";

  const bodyText = event?.bodyText
    ? interpolateVariables(event.bodyText, vars)
    : `Hola <strong>${data.customerName}</strong>, te informamos que el pedido <span class="order-badge">#${data.formattedCode}</span> ha sido cancelado y las prendas han vuelto al stock disponible.`;

  const btnText = event?.buttonText
    ? interpolateVariables(event.buttonText, vars)
    : "Volver a la tienda";

  const btnUrl = event?.buttonUrl
    ? interpolateVariables(event.buttonUrl, vars)
    : "/";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${getBaseStyles(brandColor)}</style>
</head>
<body>
  <div class="card">
    ${renderHeader(brand, layout)}
    <h1>${headline}</h1>
    <p>${bodyText}</p>

    <div class="info-box" style="background-color: #F5F5F4; color: #57534E;">
      Si realizaste una transferencia en las últimas horas o considerás que esto fue un error, por favor contactanos de inmediato por WhatsApp para asistirte.
    </div>

    ${
      btnUrl
        ? `
    <div class="btn-container">
      <a href="${btnUrl}" class="btn" target="_blank">${btnText}</a>
    </div>`
        : ""
    }

    ${renderFooter(brand, data, layout)}
  </div>
</body>
</html>`;

  const text = `
${brand} - Pedido #${data.formattedCode} cancelado

Hola ${data.customerName},
${bodyText.replace(/<[^>]+>/g, "")}
`;

  return { subject, html, text };
}

export function generateAdminNewOrderAlertTemplate(data: OrderEmailData): { subject: string; html: string; text: string } {
  const brand = data.brandName || "Aura Studio";
  const layout = data.emailCustomization?.layout;
  const brandColor = layout?.brandColor || "#1C1917";
  const subject = `🎉 Nueva Venta: Pedido #${data.formattedCode} (${data.customerName}) - ${formatPrice(data.totalCents, data.currency)}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>${getBaseStyles(brandColor)}</style>
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
      <p>Notificación interna automática de ventas · ${brand}</p>
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
