import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "../../../../../infra/auth/guard";
import { getProductServiceDeps } from "../../../../../infra/db/connection";
import { createProduct } from "../../../../../services/product.service";
import { CategoryNotFoundError, DomainError } from "../../../../../domain/errors";
import { Product } from "../../../../../domain/product/types";

// Cache en memoria para deduplicación e idempotencia ante doble clic o reintentos (TTL: 5 min)
interface CachedSubmission {
  product: Product;
  createdAt: number;
  rawTextNormalized: string;
}

const recentSubmissions = new Map<string, CachedSubmission>();

function cleanupOldSubmissions() {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [key, val] of recentSubmissions.entries()) {
    if (val.createdAt < cutoff) {
      recentSubmissions.delete(key);
    }
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin(req);
  if (!isAuth) {
    return NextResponse.json(
      {
        ok: false,
        errorType: "BUSINESS",
        errorCode: "ERR_BUSINESS_UNAUTHORIZED",
        error: "Sesión expirada o no autorizada.",
        missingFields: ["Sesión activa de administración"],
        details: "Por favor vuelve a iniciar sesión en el panel de administración.",
      },
      { status: 401 }
    );
  }

  cleanupOldSubmissions();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errorType: "TECHNICAL",
        errorCode: "ERR_TECH_MALFORMED_JSON",
        error: "Cuerpo de solicitud inválido.",
        details: "El formato de los datos enviados no es un JSON válido.",
      },
      { status: 400 }
    );
  }

  // 1. Verificación de Idempotencia por clientSubmissionId
  const clientSubmissionId =
    typeof body?.clientSubmissionId === "string" ? body.clientSubmissionId.trim() : null;
  if (clientSubmissionId && recentSubmissions.has(clientSubmissionId)) {
    const cached = recentSubmissions.get(clientSubmissionId)!;
    return NextResponse.json({
      ok: true,
      product: cached.product,
      duplicatePrevented: true,
      notice: "Se evitó una creación duplicada. La prenda ya había sido registrada exitosamente.",
    });
  }

  // 2. Validación de Negocio: Texto crudo obligatorio
  if (!body || typeof body.rawText !== "string" || !body.rawText.trim()) {
    return NextResponse.json(
      {
        ok: false,
        errorType: "BUSINESS",
        errorCode: "ERR_BUSINESS_MISSING_RAW_TEXT",
        error: "El texto descriptivo de la prenda es obligatorio.",
        missingFields: ["Texto o descripción de la prenda"],
        details:
          "Debes ingresar al menos una descripción breve (ej: 'Vestido lino $45.000 talles S M').",
      },
      { status: 400 }
    );
  }

  const rawTextNormalized = body.rawText.trim().toLowerCase();

  // 3. Verificación de Anti-duplicación por texto idéntico reciente (< 20 segundos)
  const twentySecondsAgo = Date.now() - 20 * 1000;
  for (const entry of recentSubmissions.values()) {
    if (entry.rawTextNormalized === rawTextNormalized && entry.createdAt > twentySecondsAgo) {
      return NextResponse.json({
        ok: true,
        product: entry.product,
        duplicatePrevented: true,
        notice: "Se evitó crear un producto duplicado. Ya se registró una prenda idéntica hace instantes.",
      });
    }
  }

  // 4. Validación de Negocio: Precio numérico
  if (body.priceCents !== null && body.priceCents !== undefined) {
    if (
      typeof body.priceCents !== "number" ||
      Number.isNaN(body.priceCents) ||
      body.priceCents < 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          errorType: "BUSINESS",
          errorCode: "ERR_BUSINESS_INVALID_PRICE",
          error: "El precio ingresado no es válido.",
          missingFields: ["Precio numérico en pesos"],
          details:
            "El precio debe ser un número positivo (en pesos / centavos), o dejarlo vacío si es 'Precio a consultar'.",
        },
        { status: 400 }
      );
    }
  }

  // 5. Validación de Negocio: Variantes de Color y Talle
  if (Array.isArray(body.colors)) {
    const missingFields: string[] = [];
    let hasEmptySizes = false;
    let hasInvalidStock = false;

    for (let i = 0; i < body.colors.length; i++) {
      const col = body.colors[i];
      if (!col.name || !String(col.name).trim()) {
        missingFields.push(`Nombre para el Color #${i + 1}`);
      }
      if (!Array.isArray(col.sizes) || col.sizes.length === 0) {
        hasEmptySizes = true;
        missingFields.push(`Al menos un talle para el color "${col.name || `Color #${i + 1}`}"`);
      } else {
        for (const sz of col.sizes) {
          if (!sz.size || !String(sz.size).trim()) {
            missingFields.push(`Nombre de talle en "${col.name || `Color #${i + 1}`}"`);
          }
          if (typeof sz.stock !== "number" || Number.isNaN(sz.stock) || sz.stock < 0) {
            hasInvalidStock = true;
            missingFields.push(
              `Stock numérico válido (>= 0) para talle "${sz.size || "desconocido"}" en "${col.name}"`
            );
          }
        }
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          errorType: "BUSINESS",
          errorCode: hasEmptySizes
            ? "ERR_BUSINESS_EMPTY_SIZES"
            : hasInvalidStock
            ? "ERR_BUSINESS_INVALID_STOCK"
            : "ERR_BUSINESS_INVALID_VARIANTS",
          error: "Hay datos incompletos o inválidos en las variantes de la prenda.",
          missingFields: Array.from(new Set(missingFields)),
          details:
            "Asegúrate de que cada color tenga nombre y que sus talles tengan stock numérico mayor o igual a 0.",
        },
        { status: 400 }
      );
    }
  }

  // 6. Creación mediante el servicio de dominio
  try {
    const deps = getProductServiceDeps();
    const product = await createProduct(
      {
        rawText: body.rawText,
        title: body.title,
        priceCents: body.priceCents,
        currency: body.currency || "ARS",
        size: body.size,
        categoryId: body.categoryId,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : false,
        colors: body.colors,
        photos: body.photos,
        source: "web",
      },
      deps
    );

    // Guardar en cache de idempotencia
    if (clientSubmissionId) {
      recentSubmissions.set(clientSubmissionId, {
        product,
        createdAt: Date.now(),
        rawTextNormalized,
      });
    }

    return NextResponse.json({ ok: true, product });
  } catch (error: unknown) {
    if (error instanceof CategoryNotFoundError) {
      return NextResponse.json(
        {
          ok: false,
          errorType: "BUSINESS",
          errorCode: "ERR_BUSINESS_CATEGORY_NOT_FOUND",
          error: error.message,
          missingFields: ["Categoría válida"],
          details:
            "La categoría seleccionada no existe o fue eliminada. Por favor selecciona otra categoría o 'Sin clasificar'.",
        },
        { status: 400 }
      );
    }

    if (error instanceof DomainError) {
      return NextResponse.json(
        {
          ok: false,
          errorType: "BUSINESS",
          errorCode: "ERR_BUSINESS_DOMAIN_VALIDATION",
          error: error.message,
          missingFields: [error.message],
          details: "Los datos de la prenda no cumplen con las reglas de negocio del catálogo.",
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Error técnico no determinado";
    return NextResponse.json(
      {
        ok: false,
        errorType: "TECHNICAL",
        errorCode: "ERR_TECH_SERVER_500",
        error: "Ocurrió una falla técnica en el servidor al intentar crear el producto.",
        details: message,
      },
      { status: 500 }
    );
  }
}

