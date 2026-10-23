import {
  IEmailService,
  OrderEmailData,
  SendEmailOptions,
  SendEmailResult,
} from "../../domain/ports/email.port";
import {
  generateAdminNewOrderAlertTemplate,
  generateOrderCancelledTemplate,
  generateOrderCreatedTemplate,
  generateOrderPaidTemplate,
  generateOrderShippedTemplate,
} from "../../lib/email/order-templates";

/**
 * Extrae la dirección pura de email (ej: "Aura Studio <onboarding@resend.dev>" -> "onboarding@resend.dev")
 */
export function extractEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return raw.trim();
}

/**
 * Formatea el remitente combinando el nombre dinámico de la tienda con la casilla de correo configurada.
 */
export function formatSender(brandName: string | undefined, rawFrom: string): string {
  const email = extractEmailAddress(rawFrom);
  const cleanName = brandName?.trim();
  if (!cleanName) {
    return rawFrom.includes("<") ? rawFrom : `Aura Studio <${email}>`;
  }
  return `${cleanName} <${email}>`;
}

/**
 * Obtiene variables de entorno tanto en Node.js local como en Cloudflare Workers (OpenNext)
 */
export function getEnvVar(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const cf = getCloudflareContext();
    if (cf?.env?.[key]) {
      return String(cf.env[key]);
    }
  } catch {
    // Entorno local o fuera de Cloudflare
  }
  return undefined;
}

export class ResendEmailAdapter implements IEmailService {
  private explicitApiKey: string | undefined;
  private explicitFromEmail: string | undefined;

  constructor(
    apiKeyOrConfig?: string | { apiKey?: string; fromEmail?: string },
    fromEmail?: string
  ) {
    if (typeof apiKeyOrConfig === "object" && apiKeyOrConfig !== null) {
      this.explicitApiKey = apiKeyOrConfig.apiKey;
      this.explicitFromEmail = apiKeyOrConfig.fromEmail;
    } else {
      this.explicitApiKey = apiKeyOrConfig;
      this.explicitFromEmail = fromEmail;
    }
  }

  public getApiKey(): string | undefined {
    return this.explicitApiKey || getEnvVar("RESEND_API_KEY");
  }

  public getFromEmail(brandName?: string): string {
    const configured =
      this.explicitFromEmail ||
      getEnvVar("EMAIL_FROM") ||
      "onboarding@resend.dev";
    return formatSender(brandName, configured);
  }

  public getStatus(brandName?: string): {
    configured: boolean;
    keyMasked: string | null;
    fromEmail: string;
    orderNotificationsEmail: string | null;
  } {
    const rawKey = this.getApiKey();
    const key = typeof rawKey === "string" ? rawKey.trim() : "";
    const isConfigured = key.length > 0;
    return {
      configured: isConfigured,
      keyMasked: isConfigured ? `${key.slice(0, 5)}••••••••${key.slice(-4)}` : null,
      fromEmail: this.getFromEmail(brandName),
      orderNotificationsEmail: getEnvVar("ORDER_NOTIFICATIONS_EMAIL") || null,
    };
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const apiKey = this.getApiKey();
    const fromEmail = options.from || this.getFromEmail(options.fromName);

    if (!apiKey) {
      console.warn(
        `\n[ResendEmailAdapter] AVISO: RESEND_API_KEY no está configurada.\n` +
          `Para enviar correos reales vía Resend, definí RESEND_API_KEY en tu .env.local o como secret en Cloudflare.\n` +
          `Remitente: ${fromEmail}\n` +
          `Destinatario: ${options.to}\n` +
          `Asunto: ${options.subject}\n` +
          (options.resetLink ? `Enlace de restablecimiento generado: ${options.resetLink}\n` : "")
      );
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        devLink: options.resetLink,
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMsg =
          (errorData as { message?: string }).message ||
          `HTTP ${response.status}: ${response.statusText}`;

        // Diagnóstico asistido para límites de cuenta de prueba en Resend
        if (response.status === 403 && errorMsg.includes("testing emails")) {
          errorMsg = `Resend en modo prueba solo permite enviar a tu propio email registrado. Para enviar a clientes (${options.to}), agrega y verifica tu dominio en resend.com/domains`;
        }

        console.error("[ResendEmailAdapter] Error al enviar email:", errorMsg);
        return {
          success: false,
          error: errorMsg,
          devLink: options.resetLink,
        };
      }

      const data = (await response.json()) as { id?: string };
      return { success: true, messageId: data.id };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido de red";
      console.error("[ResendEmailAdapter] Excepción en envío:", errorMsg);
      return {
        success: false,
        error: errorMsg,
        devLink: options.resetLink,
      };
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    userName?: string,
    brandName?: string
  ): Promise<SendEmailResult> {
    const brand = brandName?.trim() || "Aura Studio";
    const greeting = userName ? `Hola ${userName},` : "Hola,";
    const subject = `Recuperación de contraseña - ${brand}`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBFBF9; margin: 0; padding: 40px 20px; color: #292524; }
    .card { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #E7E5E4; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .brand { font-size: 22px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #1C1917; text-align: center; margin-bottom: 28px; }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1C1917; }
    p { font-size: 15px; line-height: 1.6; color: #57534E; margin: 0 0 20px 0; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #1C1917; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 500; font-size: 15px; letter-spacing: 0.02em; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #F5F5F4; font-size: 13px; color: #78716C; line-height: 1.5; }
    .link-alt { word-break: break-all; color: #0A5C36; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">${brand.toUpperCase()}</div>
    <h1>Recuperación de contraseña</h1>
    <p>${greeting}</p>
    <p>Hemos recibido una solicitud para restablecer la contraseña de acceso a tu panel de administración en ${brand}.</p>
    <div class="btn-container">
      <a href="${resetLink}" class="btn" target="_blank">Restablecer mi contraseña</a>
    </div>
    <p style="font-size: 14px; color: #78716C;">Este enlace tiene una validez de <strong>1 hora</strong> y solo puede ser utilizado una única vez.</p>
    <div class="footer">
      <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
      <p class="link-alt">${resetLink}</p>
      <p style="margin-top: 20px; font-size: 12px;">Si no solicitaste este cambio, desestima este mensaje de forma segura. Tu contraseña actual no se modificará.</p>
      <p style="margin-top: 8px; font-size: 11px; color: #A8A29E;">© ${new Date().getFullYear()} ${brand}. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;

    const text = `
${brand.toUpperCase()} - Recuperación de contraseña

${greeting}

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de administración en ${brand}.

Para ingresar una nueva contraseña, ingresa al siguiente enlace (válido por 1 hora):
${resetLink}

Si no solicitaste este cambio, puedes ignorar este mensaje.
`;

    return this.sendEmail({
      to,
      subject,
      html,
      text,
      resetLink,
      fromName: brand,
    });
  }

  async sendOrderCreatedEmail(
    toOrData: string | OrderEmailData,
    maybeData?: OrderEmailData
  ): Promise<SendEmailResult> {
    const to = typeof toOrData === "string" ? toOrData : toOrData.customerEmail;
    const data = typeof toOrData === "string" ? maybeData! : toOrData;
    const { subject, html, text } = generateOrderCreatedTemplate(data);
    return this.sendEmail({ to, subject, html, text, fromName: data.brandName });
  }

  async sendOrderPaidEmail(
    toOrData: string | OrderEmailData,
    maybeData?: OrderEmailData
  ): Promise<SendEmailResult> {
    const to = typeof toOrData === "string" ? toOrData : toOrData.customerEmail;
    const data = typeof toOrData === "string" ? maybeData! : toOrData;
    const { subject, html, text } = generateOrderPaidTemplate(data);
    return this.sendEmail({ to, subject, html, text, fromName: data.brandName });
  }

  async sendOrderShippedEmail(
    toOrData: string | OrderEmailData,
    maybeData?: OrderEmailData
  ): Promise<SendEmailResult> {
    const to = typeof toOrData === "string" ? toOrData : toOrData.customerEmail;
    const data = typeof toOrData === "string" ? maybeData! : toOrData;
    const { subject, html, text } = generateOrderShippedTemplate(data);
    return this.sendEmail({ to, subject, html, text, fromName: data.brandName });
  }

  async sendOrderCancelledEmail(
    toOrData: string | OrderEmailData,
    maybeData?: OrderEmailData
  ): Promise<SendEmailResult> {
    const to = typeof toOrData === "string" ? toOrData : toOrData.customerEmail;
    const data = typeof toOrData === "string" ? maybeData! : toOrData;
    const { subject, html, text } = generateOrderCancelledTemplate(data);
    return this.sendEmail({ to, subject, html, text, fromName: data.brandName });
  }

  async sendAdminNewOrderAlertEmail(
    toOrData: string | OrderEmailData,
    maybeData?: OrderEmailData
  ): Promise<SendEmailResult> {
    const to = typeof toOrData === "string" ? toOrData : toOrData.customerEmail;
    const data = typeof toOrData === "string" ? maybeData! : toOrData;
    const { subject, html, text } = generateAdminNewOrderAlertTemplate(data);
    return this.sendEmail({ to, subject, html, text, fromName: data.brandName });
  }
}

let globalEmailService: ResendEmailAdapter | null = null;

export function getEmailService(): ResendEmailAdapter {
  if (!globalEmailService) {
    globalEmailService = new ResendEmailAdapter();
  }
  return globalEmailService;
}
