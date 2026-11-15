import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import {
  getTransferReceiptFile,
  resolveOrderByIdOrCode,
  uploadTransferReceipt,
} from "../../../../../services/order.service";
import { DomainError, OrderNotFoundError, ValidationError } from "../../../../../domain/errors";
import { logger } from "../../../../../lib/logger";
import {
  authorizeReceiptAccess,
  authorizeReceiptUpload,
} from "../../../../../infra/auth/receipt-guard";
import { createReceiptSignedUrl } from "../../../../../infra/auth/receipt-signature";

/**
 * Extrae y valida la presencia del archivo PDF desde multipart/form-data o JSON (SRP).
 */
async function extractReceiptInputFromRequest(req: NextRequest): Promise<Uint8Array | string> {
  const contentType = req.headers.get("content-type") || "";
  let receiptInput: Uint8Array | string = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      throw new ValidationError("No se proporcionó ningún archivo.");
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      throw new ValidationError("Solo se admiten comprobantes en formato PDF.");
    }
    const arrayBuffer = await file.arrayBuffer();
    receiptInput = new Uint8Array(arrayBuffer);
  } else {
    const body = await req.json();
    receiptInput = body.receiptBase64 || body.transferReceiptUrl || "";
  }

  if (
    !receiptInput ||
    (typeof receiptInput === "string" && !receiptInput.trim()) ||
    (receiptInput instanceof Uint8Array && receiptInput.byteLength === 0)
  ) {
    throw new ValidationError("Debe adjuntar el archivo PDF del comprobante.");
  }

  return receiptInput;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = performance.now();
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    const deps = getProductServiceDeps();

    const { order, stream, data, size, contentType } = await getTransferReceiptFile(rawId, deps);

    // BR-08, BR-10, BR-41: Control de autorización de comprobantes
    // Requiere: sesión de administradora, sesión de clienta dueña de la orden, o enlace firmado válido.
    const authResult = await authorizeReceiptAccess(req, order);
    if (!authResult.authorized) {
      logger.warn("RECEIPT:UNAUTHORIZED_ACCESS", authResult.error || "Acceso denegado", {
        orderId: order.id,
        orderCode: order.code,
        status: authResult.status,
      });
      return NextResponse.json(
        { ok: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const durationMs = Math.round(performance.now() - startTime);

    logger.info("RECEIPT:DOWNLOAD", `Comprobante de orden #${order.code} descargado`, {
      orderId: order.id,
      orderCode: order.code,
      bytes: size ?? data?.byteLength ?? 0,
      durationMs,
    });

    const headers: Record<string, string> = {
      "Content-Type": contentType || "application/pdf",
      "Content-Disposition": `inline; filename="comprobante-orden-${order.code}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    };
    if (size) {
      headers["Content-Length"] = size.toString();
    }

    if (stream) {
      return new NextResponse(stream, { status: 200, headers });
    }

    return new NextResponse(data as unknown as BodyInit, { status: 200, headers });
  } catch (error: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : "Error al obtener el comprobante";
    const status = error instanceof OrderNotFoundError ? 404 : error instanceof ValidationError ? 400 : 500;
    logger.error("RECEIPT:DOWNLOAD_ERROR", message, error, { durationMs });
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = performance.now();
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    const deps = getProductServiceDeps();

    const existingOrder = await resolveOrderByIdOrCode(rawId, deps);

    // BR-08, BR-10, BR-41: La carga posterior de comprobante requiere sesión de dueña de la orden o admin
    const authResult = await authorizeReceiptUpload(req, existingOrder);
    if (!authResult.authorized) {
      logger.warn("RECEIPT:UNAUTHORIZED_UPLOAD", authResult.error || "Carga denegada", {
        orderId: existingOrder.id,
        orderCode: existingOrder.code,
        status: authResult.status,
      });
      return NextResponse.json(
        { ok: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const receiptInput = await extractReceiptInputFromRequest(req);
    const updatedOrder = await uploadTransferReceipt(existingOrder.id, receiptInput, deps);
    const durationMs = Math.round(performance.now() - startTime);

    logger.info("RECEIPT:UPLOADED", `Comprobante de orden #${updatedOrder.code} cargado exitosamente`, {
      orderId: updatedOrder.id,
      orderCode: updatedOrder.code,
      durationMs,
      status: 200,
    });

    const signedReceiptUrl = await createReceiptSignedUrl(updatedOrder.id);

    return NextResponse.json({
      ok: true,
      message: "Comprobante cargado exitosamente.",
      receiptUrl: signedReceiptUrl,
      uploadedAt: updatedOrder.transferReceiptUploadedAt,
    });
  } catch (error: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    if (error instanceof OrderNotFoundError) {
      logger.warn("RECEIPT:ORDER_NOT_FOUND", error.message, { durationMs, status: 404 });
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError || error instanceof DomainError) {
      logger.warn("RECEIPT:VALIDATION_ERROR", error.message, { durationMs, status: 400 });
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    const rawMessage = error instanceof Error ? error.message : "Error al procesar el comprobante";
    const cleanMessage =
      rawMessage.toLowerCase().includes("query") || rawMessage.toLowerCase().includes("sql") || rawMessage.length > 200
        ? "Error al procesar el comprobante."
        : rawMessage;
    logger.error("RECEIPT:UPLOAD_EXCEPTION", cleanMessage, error, { durationMs, status: 500 });
    return NextResponse.json({ ok: false, error: cleanMessage }, { status: 500 });
  }
}
