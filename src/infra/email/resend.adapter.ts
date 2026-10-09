import { IEmailService, SendEmailOptions, SendEmailResult } from "../../domain/ports/email.port";

export class ResendEmailAdapter implements IEmailService {
  private apiKey: string | undefined;
  private fromEmail: string;

  constructor(apiKey?: string, fromEmail?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY;
    this.fromEmail = fromEmail || process.env.EMAIL_FROM || "Aura Studio <onboarding@resend.dev>";
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.apiKey) {
      console.log(`\n======================================================`);
      console.log(`[Email Service - Dev Mode] Destinatario: ${options.to}`);
      console.log(`Asunto: ${options.subject}`);
      console.log(`Contenido:\n${options.text || options.html}`);
      console.log(`======================================================\n`);
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as { message?: string }).message || response.statusText;
        console.error("[ResendEmailAdapter] Error al enviar email:", errorMsg);
        return { success: false, error: errorMsg };
      }

      const data = (await response.json()) as { id?: string };
      return { success: true, messageId: data.id };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      console.error("[ResendEmailAdapter] Excepción en envío:", errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    userName?: string
  ): Promise<SendEmailResult> {
    const greeting = userName ? `Hola ${userName},` : "Hola,";
    const subject = "Recuperación de contraseña - Aura Studio";

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
    <div class="brand">AURA STUDIO</div>
    <h1>Recuperación de contraseña</h1>
    <p>${greeting}</p>
    <p>Hemos recibido una solicitud para restablecer la contraseña de acceso a tu panel de administración en Aura Studio.</p>
    <div class="btn-container">
      <a href="${resetLink}" class="btn" target="_blank">Restablecer mi contraseña</a>
    </div>
    <p style="font-size: 14px; color: #78716C;">Este enlace tiene una validez de <strong>1 hora</strong> y solo puede ser utilizado una única vez.</p>
    <div class="footer">
      <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
      <p class="link-alt">${resetLink}</p>
      <p style="margin-top: 20px; font-size: 12px;">Si no solicitaste este cambio, desestima este mensaje de forma segura. Tu contraseña actual no se modificará.</p>
    </div>
  </div>
</body>
</html>
`;

    const text = `
AURA STUDIO - Recuperación de contraseña

${greeting}

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de administración en Aura Studio.

Para ingresar una nueva contraseña, ingresa al siguiente enlace (válido por 1 hora):
${resetLink}

Si no solicitaste este cambio, puedes ignorar este mensaje.
`;

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }
}

let globalEmailService: IEmailService | null = null;

export function getEmailService(): IEmailService {
  if (!globalEmailService) {
    globalEmailService = new ResendEmailAdapter();
  }
  return globalEmailService;
}

