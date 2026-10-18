import { ICouponRepository, CreateCouponRepoData } from "../domain/ports/repositories.port";
import { Coupon, ValidateCouponInput, ValidateCouponResult } from "../domain/coupon/types";
import { formatPriceARS } from "../lib/format/currency";

export interface CouponServiceDeps {
  couponRepo: ICouponRepository;
}

/**
 * Normaliza un email para prevenir evasión con alias tipo Gmail/Outlook (ej: usuario+1@gmail.com).
 */
export function normalizeEmail(email: string): string {
  const trimmed = email.toLowerCase().trim();
  const parts = trimmed.split("@");
  if (parts.length !== 2) return trimmed;
  let [local, domain] = parts;

  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
    const plusIdx = local.indexOf("+");
    if (plusIdx !== -1) {
      local = local.substring(0, plusIdx);
    }
  } else if (domain === "outlook.com" || domain === "hotmail.com") {
    const plusIdx = local.indexOf("+");
    if (plusIdx !== -1) {
      local = local.substring(0, plusIdx);
    }
  }

  return `${local}@${domain}`;
}

/**
 * Normaliza un teléfono extrayendo sus dígitos para evitar duplicados por formato.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("549") && digits.length >= 12) {
    return digits.slice(3);
  }
  if (digits.startsWith("54") && digits.length >= 11) {
    return digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length >= 11) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Normaliza un DNI limpiando caracteres no numéricos.
 */
export function normalizeDni(dni: string): string {
  return dni.replace(/\D/g, "");
}

/**
 * Valida un cupón de descuento considerando vigencia, stock de usos, compra mínima
 * y el tope estricto de uso por usuario / email.
 */
export async function validateCoupon(
  input: ValidateCouponInput,
  deps: CouponServiceDeps
): Promise<ValidateCouponResult> {
  const cleanCode = input.code.trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      code: "",
      discountCents: 0,
      message: "Ingresá un código de cupón válido.",
    };
  }

  const coupon = await deps.couponRepo.findByCode(cleanCode);
  if (!coupon || !coupon.isActive) {
    return {
      valid: false,
      code: cleanCode,
      discountCents: 0,
      message: "El cupón ingresado no existe o no está activo.",
    };
  }

  const now = Date.now();

  // 1. Vigencia temporal
  if (coupon.startsAt && now < coupon.startsAt) {
    return {
      valid: false,
      code: cleanCode,
      discountCents: 0,
      message: "Este cupón aún no se encuentra vigente.",
    };
  }

  if (coupon.expiresAt && now > coupon.expiresAt) {
    return {
      valid: false,
      code: cleanCode,
      discountCents: 0,
      message: "Este cupón ya expiró.",
    };
  }

  // 2. Límite global de usos
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      code: cleanCode,
      discountCents: 0,
      message: "Este cupón ha agotado todos sus cupos disponibles.",
    };
  }

  // 3. Monto mínimo de compra en subtotal
  if (coupon.minOrderCents && input.subtotalCents < coupon.minOrderCents) {
    const minFormatted = formatPriceARS(coupon.minOrderCents);
    return {
      valid: false,
      code: cleanCode,
      discountCents: 0,
      message: `Válido en compras a partir de ${minFormatted}.`,
    };
  }

  // 4. Tope por usuario (Triangulación antifraude: Email, Teléfono/WhatsApp y DNI)
  const maxUsesPerEmail = coupon.maxUsesPerEmail ?? 1;
  const hasUserIdentifiers =
    (input.email && input.email.trim()) ||
    (input.phone && input.phone.trim()) ||
    (input.dni && input.dni.trim());

  if (maxUsesPerEmail > 0 && hasUserIdentifiers) {
    const cleanEmail = input.email ? normalizeEmail(input.email) : undefined;
    const cleanPhone = input.phone ? normalizePhone(input.phone) : undefined;
    const cleanDni = input.dni ? normalizeDni(input.dni) : undefined;

    const usedByUser = await deps.couponRepo.countRedemptions(coupon.id, {
      email: cleanEmail,
      phone: cleanPhone,
      dni: cleanDni,
    });

    if (usedByUser >= maxUsesPerEmail) {
      return {
        valid: false,
        code: cleanCode,
        discountCents: 0,
        message: maxUsesPerEmail === 1
          ? "Este cupón es de un solo uso por cliente y ya fue utilizado con tu cuenta o datos de contacto."
          : `Ya alcanzaste el límite máximo de ${maxUsesPerEmail} usos para este cupón con tus datos.`,
      };
    }
  }

  // 5. Cálculo del descuento
  let discountCents = 0;
  let isFreeShipping = false;

  if (coupon.type === "PERCENTAGE") {
    const rawDiscount = Math.round((input.subtotalCents * coupon.value) / 100);
    if (coupon.maxDiscountCents && rawDiscount > coupon.maxDiscountCents) {
      discountCents = coupon.maxDiscountCents;
    } else {
      discountCents = Math.min(rawDiscount, input.subtotalCents);
    }
  } else if (coupon.type === "FIXED_AMOUNT") {
    discountCents = Math.min(coupon.value, input.subtotalCents);
  } else if (coupon.type === "FREE_SHIPPING") {
    isFreeShipping = true;
    discountCents = input.shippingCents || 0;
  }

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discountCents,
    freeShipping: isFreeShipping,
    couponId: coupon.id,
    message: coupon.description || (coupon.type === "PERCENTAGE" ? `${coupon.value}% OFF aplicado` : "Descuento aplicado"),
  };
}

/**
 * Listado de todos los cupones para el backoffice.
 */
export async function listCoupons(
  deps: CouponServiceDeps,
  options?: { activeOnly?: boolean }
): Promise<Coupon[]> {
  return deps.couponRepo.list(options);
}

/**
 * Crea un nuevo cupón con validación de código único y parámetros.
 */
export async function createCoupon(
  input: CreateCouponRepoData,
  deps: CouponServiceDeps
): Promise<Coupon> {
  const cleanCode = input.code.trim().toUpperCase();
  if (!cleanCode) {
    throw new Error("El código de cupón es obligatorio.");
  }

  const existing = await deps.couponRepo.findByCode(cleanCode);
  if (existing) {
    throw new Error(`Ya existe un cupón con el código ${cleanCode}.`);
  }

  if (input.value <= 0) {
    throw new Error("El valor del descuento debe ser mayor a 0.");
  }

  if (input.type === "PERCENTAGE" && input.value > 100) {
    throw new Error("El porcentaje de descuento no puede ser mayor al 100%.");
  }

  return deps.couponRepo.create({
    ...input,
    code: cleanCode,
    maxUsesPerEmail: input.maxUsesPerEmail !== undefined ? input.maxUsesPerEmail : 1,
  });
}

/**
 * Actualiza un cupón existente.
 */
export async function updateCoupon(
  id: number,
  input: Partial<CreateCouponRepoData>,
  deps: CouponServiceDeps
): Promise<Coupon> {
  const existing = await deps.couponRepo.findById(id);
  if (!existing) {
    throw new Error("El cupón no fue encontrado.");
  }

  if (input.code) {
    const cleanCode = input.code.trim().toUpperCase();
    const withSameCode = await deps.couponRepo.findByCode(cleanCode);
    if (withSameCode && withSameCode.id !== id) {
      throw new Error(`Ya existe otro cupón con el código ${cleanCode}.`);
    }
  }

  return deps.couponRepo.update(id, input);
}

/**
 * Activa o desactiva un cupón.
 */
export async function toggleCouponStatus(
  id: number,
  deps: CouponServiceDeps
): Promise<Coupon> {
  const existing = await deps.couponRepo.findById(id);
  if (!existing) {
    throw new Error("El cupón no fue encontrado.");
  }
  return deps.couponRepo.update(id, { isActive: !existing.isActive });
}

/**
 * Elimina un cupón de la base de datos.
 */
export async function deleteCoupon(
  id: number,
  deps: CouponServiceDeps
): Promise<void> {
  const existing = await deps.couponRepo.findById(id);
  if (!existing) {
    throw new Error("El cupón no fue encontrado.");
  }
  await deps.couponRepo.delete(id);
}
