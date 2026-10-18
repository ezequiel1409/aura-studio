import { beforeEach, describe, expect, it } from "vitest";
import { createTestEnvironment } from "./setup-db";
import {
  createCoupon,
  validateCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  listCoupons,
} from "../src/services/coupon.service";

describe("Gestión de Cupones y Descuentos con Tope por Usuario / Email (BR-41)", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  it("crea un cupón de porcentaje con código normalizado a mayúsculas", async () => {
    const { deps } = env;

    const coupon = await createCoupon(
      {
        code: "verano15",
        description: "15% OFF Temporada de Verano",
        type: "PERCENTAGE",
        value: 15,
        minOrderCents: 2000000, // $20.000 ARS
        maxDiscountCents: 1000000, // Tope $10.000 ARS
        maxUsesPerEmail: 1,
      },
      deps
    );

    expect(coupon.id).toBeDefined();
    expect(coupon.code).toBe("VERANO15");
    expect(coupon.type).toBe("PERCENTAGE");
    expect(coupon.value).toBe(15);
    expect(coupon.maxUsesPerEmail).toBe(1);
    expect(coupon.isActive).toBe(true);
  });

  it("rechaza crear dos cupones con el mismo código", async () => {
    const { deps } = env;

    await createCoupon(
      {
        code: "DUPLICADO",
        type: "PERCENTAGE",
        value: 10,
      },
      deps
    );

    await expect(
      createCoupon(
        {
          code: "duplicado",
          type: "PERCENTAGE",
          value: 20,
        },
        deps
      )
    ).rejects.toThrow(/Ya existe un cupón con el código DUPLICADO/);
  });

  it("valida y calcula descuento porcentual respetando el tope máximo", async () => {
    const { deps } = env;

    await createCoupon(
      {
        code: "PROMO20",
        type: "PERCENTAGE",
        value: 20,
        maxDiscountCents: 500000, // $5.000 max
      },
      deps
    );

    // Compra de $100.000 (el 20% es $20.000, pero el tope es $5.000)
    const result = await validateCoupon(
      {
        code: "PROMO20",
        subtotalCents: 10000000,
        email: "cliente@gmail.com",
      },
      deps
    );

    expect(result.valid).toBe(true);
    expect(result.discountCents).toBe(500000); // Tope $5.000
  });

  it("valida descuento por monto fijo", async () => {
    const { deps } = env;

    await createCoupon(
      {
        code: "FIJO3000",
        type: "FIXED_AMOUNT",
        value: 300000, // $3.000 ARS
        minOrderCents: 1000000, // Mínimo $10.000 ARS
      },
      deps
    );

    const validResult = await validateCoupon(
      {
        code: "FIJO3000",
        subtotalCents: 1500000, // $15.000
      },
      deps
    );
    expect(validResult.valid).toBe(true);
    expect(validResult.discountCents).toBe(300000);

    const invalidResult = await validateCoupon(
      {
        code: "FIJO3000",
        subtotalCents: 800000, // $8.000 (menor al mínimo)
      },
      deps
    );
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.message).toContain("Válido en compras a partir de");
  });

  it("aplica tope estricto por email / usuario (1 uso por email)", async () => {
    const { deps } = env;

    const coupon = await createCoupon(
      {
        code: "BIENVENIDA10",
        type: "PERCENTAGE",
        value: 10,
        maxUsesPerEmail: 1, // Tope: 1 por email
      },
      deps
    );

    const userEmail = "ezequiel@test.com";

    // 1. Primer intento: es válido
    const firstTry = await validateCoupon(
      {
        code: "BIENVENIDA10",
        email: userEmail,
        subtotalCents: 5000000,
      },
      deps
    );
    expect(firstTry.valid).toBe(true);

    // Simulamos que el usuario concreta la compra y se registra el canje
    await deps.couponRepo.recordRedemption({
      couponId: coupon.id,
      customerEmail: userEmail,
      discountCents: firstTry.discountCents,
    });
    await deps.couponRepo.incrementUsage(coupon.id);

    // 2. Segundo intento con el MISMO email: debe ser rechazado
    const secondTry = await validateCoupon(
      {
        code: "BIENVENIDA10",
        email: userEmail,
        subtotalCents: 5000000,
      },
      deps
    );
    expect(secondTry.valid).toBe(false);
    expect(secondTry.message).toContain("Este cupón es de un solo uso por cliente");

    // 3. Intento con OTRO email diferente: debe ser aceptado
    const anotherUserTry = await validateCoupon(
      {
        code: "BIENVENIDA10",
        email: "otrocliente@gmail.com",
        subtotalCents: 5000000,
      },
      deps
    );
    expect(anotherUserTry.valid).toBe(true);
  });

  it("bloquea elusión con alias de Gmail (puntos y sufijos +)", async () => {
    const { deps } = env;

    const coupon = await createCoupon(
      {
        code: "ANTIFRAUDE10",
        type: "PERCENTAGE",
        value: 10,
        maxUsesPerEmail: 1,
      },
      deps
    );

    // Registramos que ezequiel@gmail.com ya usó el cupón
    await deps.couponRepo.recordRedemption({
      couponId: coupon.id,
      customerEmail: "ezequiel@gmail.com",
      discountCents: 100000,
    });

    // Intento con eze.quiel+descuento@gmail.com
    const aliasTry = await validateCoupon(
      {
        code: "ANTIFRAUDE10",
        email: "eze.quiel+descuento@gmail.com",
        subtotalCents: 5000000,
      },
      deps
    );
    expect(aliasTry.valid).toBe(false);
    expect(aliasTry.message).toContain("Este cupón es de un solo uso por cliente");
  });

  it("triangula antifraude con teléfono/WhatsApp: bloquea si cambia el email pero mantiene el WhatsApp", async () => {
    const { deps } = env;

    const coupon = await createCoupon(
      {
        code: "WHATSAPP10",
        type: "PERCENTAGE",
        value: 10,
        maxUsesPerEmail: 1,
      },
      deps
    );

    // 1. Compra original con email A y teléfono 11 4444-5555
    await deps.couponRepo.recordRedemption({
      couponId: coupon.id,
      customerEmail: "comprador1@hotmail.com",
      customerPhone: "1144445555",
      discountCents: 50000,
    });

    // 2. Nuevo intento con OTRO email completamente distinto pero el MISMO teléfono WhatsApp
    const fraudTry = await validateCoupon(
      {
        code: "WHATSAPP10",
        email: "comprador_falso_99@yahoo.com",
        phone: "+54 9 11 4444-5555", // Con prefijos y espacios de Argentina
        subtotalCents: 5000000,
      },
      deps
    );

    expect(fraudTry.valid).toBe(false);
    expect(fraudTry.message).toContain("Este cupón es de un solo uso por cliente y ya fue utilizado con tu cuenta o datos de contacto.");
  });

  it("permite pausar y reactivar cupones", async () => {
    const { deps } = env;

    const coupon = await createCoupon(
      {
        code: "PAUSABLE",
        type: "PERCENTAGE",
        value: 10,
      },
      deps
    );

    // Pausar
    const paused = await toggleCouponStatus(coupon.id, deps);
    expect(paused.isActive).toBe(false);

    // Al validar debe indicar que está inactivo
    const checkPaused = await validateCoupon(
      { code: "PAUSABLE", subtotalCents: 5000000 },
      deps
    );
    expect(checkPaused.valid).toBe(false);
    expect(checkPaused.message).toContain("no está activo");

    // Reactivar
    const reactivated = await toggleCouponStatus(coupon.id, deps);
    expect(reactivated.isActive).toBe(true);

    const checkActive = await validateCoupon(
      { code: "PAUSABLE", subtotalCents: 5000000 },
      deps
    );
    expect(checkActive.valid).toBe(true);
  });
});
