import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { getEmailService } from "../../../../../infra/email/resend.adapter";
import { getShowroomSettings } from "../../../../../services/settings.service";

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const recipientEmail = String(body.recipientEmail || "").trim();

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Ingresá un correo electrónico de destinatario válido." },
        { status: 400 }
      );
    }

    const deps = getProductServiceDeps();
    const settings = await getShowroomSettings(deps);
    const brandName = settings.showroomName || "Aura Studio";

    const emailService = getEmailService();
    const apiKey = emailService.getApiKey();

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "RESEND_API_KEY no está configurada en las variables de entorno del servidor.",
        },
        { status: 400 }
      );
    }

    const subject = `Prueba de configuración de correo - ${brandName}`;
    const now = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: sans-serif; background-color: #faf8f5; padding: 32px 16px; color: #1c1917;">
  <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e2da; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <h1 style="font-size: 18px; margin-bottom: 8px; color: #1c1917;">${brandName.toUpperCase()}</h1>
    <h2 style="font-size: 16px; color: #047857; margin-bottom: 16px;">✓ ¡Conexión con Resend exitosa!</h2>
    <p style="font-size: 13px; line-height: 1.6; color: #57534e;">
      Este es un correo de prueba enviado desde tu panel de administración para verificar que el servicio de correos transaccionales (compras, pagos aprobados, despachos y recupero de clave) esté funcionando de forma óptima para <strong>${brandName}</strong>.
    </p>
    <div style="background: #faf8f5; border: 1px solid #e7e2da; border-radius: 8px; padding: 12px; font-size: 12px; margin-top: 20px;">
      <strong>Fecha y hora:</strong> ${now}<br />
      <strong>Remitente:</strong> ${emailService.getFromEmail(brandName)}<br />
      <strong>Destinatario:</strong> ${recipientEmail}
    </div>
  </div>
</body>
</html>`;

    const text = `${brandName} - Prueba de configuración de correo exitosa.\nFecha: ${now}\nRemitente: ${emailService.getFromEmail(brandName)}`;

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
      fromName: brandName,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Resend rechazó el envío del correo de prueba.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
      message: `¡Correo de prueba enviado con éxito a ${recipientEmail}!`,
    });
  } catch (error) {
    console.error("[EmailTest] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al procesar el envío de prueba." },
      { status: 500 }
    );
  }
}
