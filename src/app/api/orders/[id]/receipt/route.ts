import { NextRequest, NextResponse } from "next/server";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { uploadTransferReceipt } from "../../../../../services/order.service";
import { DomainError, OrderNotFoundError, ValidationError } from "../../../../../domain/errors";
import { parseOrderCode } from "../../../../../domain/order";
import { logger } from "../../../../../lib/logger";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = performance.now();
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    const deps = getProductServiceDeps();

    let order = null;
    const numId = parseInt(rawId, 10);
    if (!Number.isNaN(numId) && numId > 0) {
      order = await deps.orderRepo.findById(numId);
    }
    if (!order) {
      const codeNum = parseOrderCode(rawId);
      if (codeNum) {
        order = await deps.orderRepo.findByCode(codeNum);
      }
    }

    if (!order || !order.transferReceiptUrl) {
      return NextResponse.json(
        { ok: false, error: "Comprobante no encontrado para esta orden." },
        { status: 404 }
      );
    }

    let base64Data = order.transferReceiptUrl;
    if (base64Data.startsWith("data:")) {
      base64Data = base64Data.replace(/^data:[^;]+;base64,/, "");
    }

    const pdfBuffer = Buffer.from(base64Data, "base64");
    const durationMs = Math.round(performance.now() - startTime);

    logger.info("RECEIPT:DOWNLOAD", `Comprobante de orden #${order.code} descargado`, {
      orderId: order.id,
      orderCode: order.code,
      bytes: pdfBuffer.length,
      durationMs,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="comprobante-orden-${order.code}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : "Error al obtener el comprobante";
    logger.error("RECEIPT:DOWNLOAD_ERROR", message, error, { durationMs });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
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

    let orderId: number | null = null;
    const numId = parseInt(rawId, 10);
    if (!Number.isNaN(numId) && numId > 0) {
      const existing = await deps.orderRepo.findById(numId);
      if (existing) orderId = existing.id;
    }
    if (!orderId) {
      const codeNum = parseOrderCode(rawId);
      if (codeNum) {
        const existing = await deps.orderRepo.findByCode(codeNum);
        if (existing) orderId = existing.id;
      }
    }

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Orden no encontrada." },
        { status: 404 }
      );
    }

    let receiptBase64 = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { ok: false, error: "No se proporcionó ningún archivo." },
          { status: 400 }
        );
      }
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { ok: false, error: "Solo se admiten comprobantes en formato PDF." },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      receiptBase64 = `data:application/pdf;base64,${buffer.toString("base64")}`;
    } else {
      const body = await req.json();
      receiptBase64 = body.receiptBase64 || body.transferReceiptUrl || "";
    }

    if (!receiptBase64) {
      return NextResponse.json(
        { ok: false, error: "Debe adjuntar el archivo PDF del comprobante." },
        { status: 400 }
      );
    }

    const updatedOrder = await uploadTransferReceipt(orderId, receiptBase64, deps);
    const durationMs = Math.round(performance.now() - startTime);

    logger.info("RECEIPT:UPLOADED", `Comprobante de orden #${updatedOrder.code} cargado exitosamente`, {
      orderId: updatedOrder.id,
      orderCode: updatedOrder.code,
      durationMs,
      status: 200,
    });

    return NextResponse.json({
      ok: true,
      message: "Comprobante cargado exitosamente.",
      order: updatedOrder,
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
    const message = error instanceof Error ? error.message : "Error al procesar el comprobante";
    logger.error("RECEIPT:UPLOAD_EXCEPTION", message, error, { durationMs, status: 500 });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
