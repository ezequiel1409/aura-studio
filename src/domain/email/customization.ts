export type EmailEventTrigger =
  | "order_created"
  | "order_paid"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "cart_abandoned"
  | "product_abandoned"
  | "new_arrivals"
  | "custom";

export interface EmailLayoutConfig {
  logoUrl?: string | null;
  brandColor?: string;
  headerGreeting?: string;
  footerText?: string;
  showSocialLinks?: boolean;
  showAddress?: boolean;
}

export interface EmailEventTemplateConfig {
  id: string;
  trigger: EmailEventTrigger;
  name: string;
  description: string;
  enabled: boolean;
  subject: string;
  headline: string;
  bodyText: string;
  buttonText?: string;
  buttonUrl?: string;
  triggerCondition: string;
  availableVariables: string[];
}

export interface EmailCustomizationConfig {
  layout: EmailLayoutConfig;
  events: EmailEventTemplateConfig[];
}

export const DEFAULT_EMAIL_CUSTOMIZATION: EmailCustomizationConfig = {
  layout: {
    logoUrl: null,
    brandColor: "#1C1917",
    headerGreeting: "Espacio de Moda & Selección Exclusiva",
    footerText:
      "Si tenés alguna duda sobre tu compra o querés asesoramiento personalizado, podés responder directamente a este correo o escribirnos por WhatsApp.",
    showSocialLinks: true,
    showAddress: true,
  },
  events: [
    {
      id: "order_created",
      trigger: "order_created",
      name: "Compra Realizada",
      description: "Se envía inmediatamente a la clienta al confirmar su pedido.",
      enabled: true,
      subject: "¡Recibimos tu pedido {{codigo_pedido}} en {{nombre_tienda}}!",
      headline: "¡Gracias por tu compra, {{nombre}}!",
      bodyText:
        "Estamos preparando los detalles de tu pedido. Si elegiste abonar mediante transferencia bancaria, a continuación encontrarás los datos para realizarla y adjuntar tu comprobante.",
      buttonText: "Ver Estado de mi Pedido",
      buttonUrl: "{{link_pedido}}",
      triggerCondition: "Inmediatamente cuando el cliente confirma la compra en la tienda.",
      availableVariables: [
        "{{nombre}}",
        "{{codigo_pedido}}",
        "{{nombre_tienda}}",
        "{{total}}",
        "{{link_pedido}}",
      ],
    },
    {
      id: "order_paid",
      trigger: "order_paid",
      name: "Compra Confirmada (Pago Acreditado)",
      description: "Notificación de pago acreditado por pasarela o transferencia aprobada.",
      enabled: true,
      subject: "¡Pago acreditado para tu pedido {{codigo_pedido}}! - {{nombre_tienda}}",
      headline: "¡Tu pago fue acreditado con éxito!",
      bodyText:
        "Tu pago ya está confirmado y asentado. Iniciamos el proceso de preparación y empaque cuidadoso de tus prendas.",
      buttonText: "Ver Detalle de Compra",
      buttonUrl: "{{link_pedido}}",
      triggerCondition: "Al confirmarse el pago por Mercado Pago o validarse la transferencia bancaria.",
      availableVariables: [
        "{{nombre}}",
        "{{codigo_pedido}}",
        "{{nombre_tienda}}",
        "{{total}}",
        "{{link_pedido}}",
      ],
    },
    {
      id: "order_shipped",
      trigger: "order_shipped",
      name: "Compra Despachada / Lista para Retirar",
      description: "Aviso de que las prendas ya están en camino o listas en el showroom.",
      enabled: true,
      subject: "¡Tu pedido {{codigo_pedido}} está listo o en camino! - {{nombre_tienda}}",
      headline: "¡Tus prendas ya están listas!",
      bodyText:
        "Si seleccionaste retiro en local, ya podés pasar por nuestro espacio en los horarios de atención. Si elegiste envío a domicilio, tu paquete ya fue despachado.",
      buttonText: "Ver Datos de Retiro y Envío",
      buttonUrl: "{{link_pedido}}",
      triggerCondition: "Cuando la administradora marca el pedido como 'Confirmado / Despachado'.",
      availableVariables: [
        "{{nombre}}",
        "{{codigo_pedido}}",
        "{{nombre_tienda}}",
        "{{link_pedido}}",
      ],
    },
    {
      id: "order_delivered",
      trigger: "order_delivered",
      name: "Compra Entregada",
      description: "Agradecimiento y confirmación de que la clienta ya tiene sus prendas.",
      enabled: true,
      subject: "¡Esperamos que disfrutes tu compra! - {{nombre_tienda}}",
      headline: "¡Pedido entregado con éxito!",
      bodyText:
        "Tu pedido {{codigo_pedido}} figura como entregado. Deseamos de corazón que disfrutes mucho tus nuevas piezas. ¡Nos encantaría que nos compartas una foto etiquetándonos en Instagram!",
      buttonText: "Ver Resumen de Pedido",
      buttonUrl: "{{link_pedido}}",
      triggerCondition: "Cuando la orden se actualiza al estado de 'Entregada'.",
      availableVariables: [
        "{{nombre}}",
        "{{codigo_pedido}}",
        "{{nombre_tienda}}",
        "{{link_pedido}}",
      ],
    },
    {
      id: "order_cancelled",
      trigger: "order_cancelled",
      name: "Compra Cancelada",
      description: "Aviso si la orden caducó por falta de pago o por anulación.",
      enabled: true,
      subject: "Aviso sobre tu pedido {{codigo_pedido}} - {{nombre_tienda}}",
      headline: "Tu pedido ha sido cancelado",
      bodyText:
        "Te informamos que tu pedido {{codigo_pedido}} fue cancelado por vencimiento del plazo de reserva o por solicitud tuya. Las piezas han vuelto a estar disponibles en el catálogo general.",
      buttonText: "Volver a Explorar el Catálogo",
      buttonUrl: "{{catalogo_url}}",
      triggerCondition: "Al vencer el plazo de reserva automática o al cancelarse manualmente.",
      availableVariables: [
        "{{nombre}}",
        "{{codigo_pedido}}",
        "{{nombre_tienda}}",
        "{{catalogo_url}}",
      ],
    },
    {
      id: "cart_abandoned",
      trigger: "cart_abandoned",
      name: "Carrito Abandonado",
      description: "Recuperación de compras iniciadas que no completaron el pago.",
      enabled: true,
      subject: "{{nombre}}, ¡dejaste prendas guardadas en tu bolsa!",
      headline: "¿Todavía estás pensando en tus prendas?",
      bodyText:
        "Notamos que dejaste prendas seleccionadas en tu bolsa de compras. Debido a que nuestro inventario es exclusivo y las unidades son limitadas, te reservamos tus elegidos por tiempo limitado para que no te quedes sin ellos.",
      buttonText: "Recuperar Mi Carrito Ahora",
      buttonUrl: "{{carrito_url}}",
      triggerCondition: "A las 2 horas de haber dejado artículos en el carrito sin finalizar el checkout.",
      availableVariables: [
        "{{nombre}}",
        "{{nombre_tienda}}",
        "{{carrito_url}}",
        "{{whatsapp}}",
      ],
    },
    {
      id: "product_abandoned",
      trigger: "product_abandoned",
      name: "Vio un Producto y Abandonó",
      description: "Interés detectado en una prenda específica del catálogo.",
      enabled: false,
      subject: "¿Te gustó esta pieza en {{nombre_tienda}}?",
      headline: "Vimos que te interesó una de nuestras piezas exclusivas",
      bodyText:
        "Varias clientas están consultando por esta misma prenda. Si tenés dudas sobre el calce, talle o combinación, escribinos por WhatsApp para ayudarte en lo que necesites.",
      buttonText: "Volver a Ver la Prenda",
      buttonUrl: "{{producto_url}}",
      triggerCondition: "A las 24 horas de haber navegado una prenda específica sin añadirla a la bolsa.",
      availableVariables: [
        "{{nombre}}",
        "{{nombre_tienda}}",
        "{{producto_url}}",
        "{{whatsapp}}",
      ],
    },
    {
      id: "new_arrivals",
      trigger: "new_arrivals",
      name: "Nuevos Ingresos y Drops",
      description: "Novedades y colecciones recién publicadas.",
      enabled: false,
      subject: "✨ ¡Nuevos ingresos exclusivos en {{nombre_tienda}}!",
      headline: "Descubrí lo nuevo que acaba de entrar",
      bodyText:
        "Acabamos de sumar nuevas piezas exclusivas a nuestro catálogo online. Sé la primera en conocerlas antes de que se agoten.",
      buttonText: "Ver Nuevos Ingresos",
      buttonUrl: "{{catalogo_url}}",
      triggerCondition: "Al publicar un nuevo lote de prendas o drop en la tienda.",
      availableVariables: [
        "{{nombre}}",
        "{{nombre_tienda}}",
        "{{catalogo_url}}",
      ],
    },
  ],
};

/**
 * Reemplaza variables tipo {{variable}} por sus valores reales.
 */
export function interpolateVariables(text: string, variables: Record<string, string>): string {
  if (!text) return "";
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}`;
  });
}

