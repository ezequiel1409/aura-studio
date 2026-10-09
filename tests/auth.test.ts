import { describe, expect, it } from "vitest";
import {
  calculateNextFailedAttempt,
  isAccountLocked,
  LOCKOUT_DURATION_MS,
  MAX_LOGIN_ATTEMPTS,
} from "../src/domain/auth/rules";
import {
  createSessionToken,
  timingSafeEqualStrings,
  verifySessionToken,
} from "../src/infra/auth/session";
import { loginAdmin, verifyAdminSession } from "../src/services/auth.service";
import { createTestEnvironment } from "./setup-db";

describe("Dominio y Reglas de Autenticación (BR-10, BR-11, BR-37)", () => {
  it("BR-11: tras 5 intentos fallidos consecutivos bloquea por 60 segundos", () => {
    const now = 1_000_000;

    // Intentos 1 a 4: no bloquea
    for (let i = 0; i < 4; i++) {
      const res = calculateNextFailedAttempt(i, now);
      expect(res.isLocked).toBe(false);
      expect(res.nextFailedCount).toBe(i + 1);
      expect(res.lockedUntil).toBeNull();
    }

    // Intento 5: se bloquea
    const res5 = calculateNextFailedAttempt(4, now);
    expect(res5.isLocked).toBe(true);
    expect(res5.nextFailedCount).toBe(5);
    expect(res5.lockedUntil).toBe(now + LOCKOUT_DURATION_MS);
  });

  it("BR-11: isAccountLocked detecta bloqueo y calcula segundos restantes", () => {
    const now = 100_000;
    const lockedUntil = now + 45_000;

    const locked = isAccountLocked({ key: "ip1", failedCount: 5, lockedUntil }, now);
    expect(locked.locked).toBe(true);
    expect(locked.remainingSeconds).toBe(45);

    // Cuando el tiempo actual supera lockedUntil
    const unlocked = isAccountLocked({ key: "ip1", failedCount: 5, lockedUntil }, lockedUntil + 1000);
    expect(unlocked.locked).toBe(false);
    expect(unlocked.remainingSeconds).toBe(0);
  });

  it("BR-10: timingSafeEqualStrings compara strings de forma segura", () => {
    expect(timingSafeEqualStrings("secreto123", "secreto123")).toBe(true);
    expect(timingSafeEqualStrings("secreto123", "secreto124")).toBe(false);
    expect(timingSafeEqualStrings("secreto123", "corto")).toBe(false);
  });

  it("BR-37: tokens de sesión HMAC SHA-256 se crean y verifican correctamente", async () => {
    const secret = "clave-super-secreta-para-tests-32-caracteres";
    const now = 1_000_000;

    const token = await createSessionToken(secret, 3600_000, now);
    expect(token).toContain(".");

    // Verificación válida
    const validResult = await verifySessionToken(token, secret, now + 1000);
    expect(validResult.valid).toBe(true);
    expect(validResult.payload?.iat).toBe(now);

    // Token expirado
    const expiredResult = await verifySessionToken(token, secret, now + 3600_001);
    expect(expiredResult.valid).toBe(false);

    // Firma adulterada
    const tampered = token.replace(/a/g, "b");
    const tamperedResult = await verifySessionToken(tampered, secret, now);
    expect(tamperedResult.valid).toBe(false);
  });
});

describe("Servicio de Autenticación y Fuerza Bruta (BR-10, BR-11, BR-37)", () => {
  it("login exitoso emite sessionToken y limpia intentos previos", async () => {
    const { deps } = createTestEnvironment();
    const adminPassword = "password-showroom-2026";
    const sessionSecret = "secret-jwt-key-for-test-purpose-32-chars";

    const result = await loginAdmin(
      {
        password: adminPassword,
        clientKey: "client-1",
      },
      {
        loginAttemptRepo: deps.loginAttemptRepo,
        adminPassword,
        sessionSecret,
      }
    );

    expect(result.success).toBe(true);
    expect(result.sessionToken).toBeDefined();

    // Validar token emitido
    const isValid = await verifyAdminSession(result.sessionToken, {
      loginAttemptRepo: deps.loginAttemptRepo,
      sessionSecret,
    });
    expect(isValid).toBe(true);
  });

  it("BR-11: contraseña incorrecta incrementa contador y bloquea al 5to fallo", async () => {
    const { deps } = createTestEnvironment();
    const adminPassword = "correct-password";
    const sessionSecret = "secret-jwt-key-for-test-purpose-32-chars";
    const clientKey = "test-client-brute-force";

    // Intentos 1 a 4 fallidos
    for (let i = 1; i <= 4; i++) {
      const res = await loginAdmin(
        { password: "wrong-password", clientKey },
        { loginAttemptRepo: deps.loginAttemptRepo, adminPassword, sessionSecret }
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain(`Le quedan ${5 - i} intento`);
    }

    // 5to intento fallido: activa bloqueo de 60 segundos
    const res5 = await loginAdmin(
      { password: "wrong-password", clientKey },
      { loginAttemptRepo: deps.loginAttemptRepo, adminPassword, sessionSecret }
    );
    expect(res5.success).toBe(false);
    expect(res5.remainingLockSeconds).toBe(60);
    expect(res5.error).toContain("bloqueado por 60 segundos");

    // Intento subsiguiente durante el bloqueo es rechazado directamente
    const resBlocked = await loginAdmin(
      { password: adminPassword, clientKey }, // incluso con contraseña correcta
      { loginAttemptRepo: deps.loginAttemptRepo, adminPassword, sessionSecret }
    );
    expect(resBlocked.success).toBe(false);
    expect(resBlocked.error).toContain("temporalmente bloqueado");
  });
});
