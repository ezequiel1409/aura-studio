import { GlobalAppDeps } from "../infra/db/connection";
import { OrderClaim, CreateOrderClaimInput, InspectClaimInput, ClaimType } from "../domain/claim/types";
import { ValidationError, OrderNotFoundError } from "../domain/errors";
import { formatOrderCode } from "../domain/order/rules";
import { updateOrderStatus } from "./order.service";

/**
 * Normaliza DNI removiendo puntos, espacios y guiones
 */
export function normalizeDni(dni: string): string {
  return dni.replace(/[^0-9]/g, "");
}

/**
 * Normaliza teléfono para comparación
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * Normaliza email para comparación
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Valida formato de correo electrónico
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Valida longitud mínima y máxima de teléfono numérico
 */
export function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length >= 6 && digits.length <= 16;
}

/**
 * Caso de uso: Crear Solicitud de Arrepentimiento o Cambio (Res. 424/2020)
 */
export async function createOrderClaim(
  input: CreateOrderClaimInput,
  deps: GlobalAppDeps
): Promise<OrderClaim> {
  // 1. Validaciones básicas del formulario
  if (!input.orderCode || input.orderCode <= 0) {
    throw new ValidationError("El número o código de pedido es obligatorio.");
  }

  const cleanDni = normalizeDni(input.customerDni || "");
  if (!cleanDni || cleanDni.length < 6) {
    throw new ValidationError("Ingresá un número de DNI válido (mínimo 6 dígitos).");
  }

  const hasSeparateFields =
    input.customerEmail !== undefined || input.customerPhone !== undefined;

  const rawEmail = input.customerEmail ? input.customerEmail.trim() : "";
  const rawPhone = input.customerPhone ? input.customerPhone.trim() : "";
  const cleanContact = input.contactValue ? input.contactValue.trim() : "";

  if (hasSeparateFields) {
    if (!rawEmail || !isValidEmail(rawEmail)) {
      throw new ValidationError(
        "Ingresá un correo electrónico válido utilizado en la compra."
      );
    }
    if (!rawPhone || !isValidPhone(rawPhone)) {
      throw new ValidationError(
        "Ingresá un número de teléfono válido (mínimo 6 dígitos) utilizado en la compra."
      );
    }
  } else if (!cleanContact) {
    throw new ValidationError(
      "Debes ingresar el Email y Teléfono con los que realizaste la compra."
    );
  }

  if (!input.conditionAccepted) {
    throw new ValidationError(
      "Debes confirmar que la prenda cumple con las condiciones obligatorias de recirculación (sin uso, con etiqueta y sin manchas)."
    );
  }

  // 2. Buscar la orden por código
  const order = await deps.orderRepo.findByCode(input.orderCode);
  if (!order) {
    throw new ValidationError(
      `No se encontró ningún pedido con el código #${formatOrderCode(input.orderCode)}.`
    );
  }

  // 3. Validar coincidencia de identidad (anti-trolls)
  const orderEmail = order.customerEmail ? normalizeEmail(order.customerEmail) : "";
  const orderPhone = order.customerPhone ? normalizePhone(order.customerPhone) : "";

  if (hasSeparateFields) {
    const cleanEmail = normalizeEmail(rawEmail);
    const cleanPhone = normalizePhone(rawPhone);

    const matchesEmail = !orderEmail || orderEmail === cleanEmail;
    const matchesPhone =
      !orderPhone ||
      orderPhone.includes(cleanPhone) ||
      cleanPhone.includes(orderPhone);

    if (!matchesEmail || !matchesPhone) {
      throw new ValidationError(
        "El email o teléfono ingresado no coincide con los datos registrados en este pedido."
      );
    }
  } else {
    const contactAsEmail = normalizeEmail(cleanContact);
    const contactAsPhone = normalizePhone(cleanContact);

    const matchesEmail = Boolean(orderEmail && contactAsEmail && orderEmail === contactAsEmail);
    const matchesPhone = Boolean(
      orderPhone &&
        contactAsPhone &&
        (orderPhone.includes(contactAsPhone) || contactAsPhone.includes(orderPhone))
    );

    if (!matchesEmail && !matchesPhone) {
      throw new ValidationError(
        "El email o teléfono ingresado no coincide con los datos registrados en este pedido."
      );
    }
  }

  // 4. Validar estado de la orden
  if (order.status === "CANCELLED") {
    throw new ValidationError("Este pedido ya se encuentra cancelado.");
  }

  // 5. Validar si algún producto es de Venta Final (allowReturn === false)
  for (const item of order.items || []) {
    const product = item.productId
      ? await deps.productRepo.findById(item.productId)
      : item.productCode
      ? await deps.productRepo.findByCode(item.productCode)
      : null;

    if (product && product.allowReturn === false) {
      throw new ValidationError(
        `La prenda #${item.productCode} (${item.productTitle}) fue adquirida bajo la condición de Venta Final (sin cambios ni devoluciones).`
      );
    }
  }

  // 6. Validar plazo legal de 10 días corridos (Ley 24.240 y Res. 424/2020)
  const nowSec = Math.floor(Date.now() / 1000);
  const tenDaysInSec = 10 * 24 * 60 * 60;
  if (nowSec - order.createdAt > tenDaysInSec) {
    throw new ValidationError(
      "El plazo legal de 10 días corridos para solicitar el arrepentimiento ha expirado."
    );
  }

  // 7. Verificar si ya existe una solicitud abierta para esta orden
  const existingClaim = await deps.orderClaimRepo.findByOrderId(order.id);
  if (existingClaim && (existingClaim.status === "PENDING" || existingClaim.status === "APPROVED_RESTOCKED")) {
    throw new ValidationError(
      `Ya existe una solicitud activa (${existingClaim.claimCode}) registrada para este pedido.`
    );
  }

  // 8. Generar código de trámite correlativo e identificable
  const claimType: ClaimType = input.type === "EXCHANGE" ? "EXCHANGE" : "REVOCATION";
  const prefix = claimType === "EXCHANGE" ? "CAM" : "REV";
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const claimCode = `${prefix}-${formatOrderCode(order.code)}-${randomSuffix}`;

  const claimId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return deps.orderClaimRepo.create({
    id: claimId,
    orderId: order.id,
    orderCode: order.code,
    type: claimType,
    claimCode,
    customerName: input.customerName || order.customerName,
    customerDni: cleanDni,
    customerEmail: rawEmail ? normalizeEmail(rawEmail) : order.customerEmail || cleanContact,
    customerPhone: rawPhone || order.customerPhone || cleanContact,
    reason: input.reason?.trim() || null,
    conditionAccepted: true,
    status: "PENDING",
    createdAt: nowSec,
  });
}

/**
 * Caso de uso: Inspección y Control de Calidad en el Backoffice
 */
export async function inspectOrderClaim(
  claimId: string,
  input: InspectClaimInput,
  deps: GlobalAppDeps
): Promise<{ claim: OrderClaim }> {
  const claim = await deps.orderClaimRepo.findById(claimId);
  if (!claim) {
    throw new ValidationError(`No se encontró la solicitud de trámite con ID ${claimId}.`);
  }

  const nowSec = Math.floor(Date.now() / 1000);

  if (input.decision === "APPROVE_RESTOCK") {
    // 1. La prenda está impecable -> Cancela la orden y RESTAURA el stock automáticamente
    await updateOrderStatus(claim.orderId, "CANCELLED", deps);

    // 2. Actualizar estado del reclamo a APROBADO CON RESTOCK
    const updatedClaim = await deps.orderClaimRepo.updateStatus(claim.id, "APPROVED_RESTOCKED", {
      resolvedAt: nowSec,
      adminNotes: input.adminNotes || "Prenda recibida en condiciones óptimas. Stock recirculado automáticamente.",
    });

    return { claim: updatedClaim };
  } else {
    // La prenda NO cumple condiciones (manchas, uso, sin etiqueta)
    // No se cancela la orden ni se toca el stock
    const updatedClaim = await deps.orderClaimRepo.updateStatus(claim.id, "REJECTED_CONDITION", {
      rejectionReason:
        input.rejectionReason || "Prenda no apta para recirculación (presenta manchas, uso o falta de etiqueta original).",
      resolvedAt: nowSec,
      adminNotes: input.adminNotes,
    });

    return { claim: updatedClaim };
  }
}
