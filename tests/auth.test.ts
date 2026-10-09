import { describe, expect, it } from "vitest";
import {
  calculateNextFailedAttempt,
  isAccountLocked,
  LOCKOUT_DURATION_MS,
} from "../src/domain/auth/rules";
import {
  createSessionToken,
  timingSafeEqualStrings,
  verifySessionToken,
} from "../src/infra/auth/session";
import { loginAdmin, verifyAdminSession } from "../src/services/auth.service";
import {
  generateSalt,
  generateSecureToken,
  hashPassword,
  hashToken,
  verifyPasswordHash,
} from "../src/lib/crypto/password";
import { createChildAdmin, toggleAdminStatus } from "../src/services/admin-users.service";
import { requestPasswordReset, resetPassword } from "../src/services/password-reset.service";
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

describe("Criptografía de Contraseñas PBKDF2-HMAC-SHA512 (BR-10)", () => {
  it("hashPassword genera hash de 64 bytes (128 hex) con salt único", async () => {
    const password = "mi-clave-super-segura-2026";
    const res1 = await hashPassword(password);
    const res2 = await hashPassword(password);

    // Formato de hash: 64 bytes = 128 caracteres hexadecimales
    expect(res1.hash).toHaveLength(128);
    expect(res1.salt).toHaveLength(32); // 16 bytes = 32 caracteres hex
    expect(res2.hash).toHaveLength(128);

    // Salts diferentes para la misma clave producen hashes distintos
    expect(res1.salt).not.toBe(res2.salt);
    expect(res1.hash).not.toBe(res2.hash);
  });

  it("verifyPasswordHash valida correctamente contraseñas válidas e inválidas", async () => {
    const password = "clave-correcta-showroom";
    const { hash, salt } = await hashPassword(password);

    // Contraseña correcta
    const isValid = await verifyPasswordHash(password, hash, salt);
    expect(isValid).toBe(true);

    // Contraseña incorrecta
    const isInvalid = await verifyPasswordHash("otra-clave-diferente", hash, salt);
    expect(isInvalid).toBe(false);

    // Salt adulterado
    const isCorrupted = await verifyPasswordHash(password, hash, generateSalt());
    expect(isCorrupted).toBe(false);
  });

  it("generateSecureToken y hashToken generan tokens seguros y digest SHA-256", async () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(64); // 32 bytes = 64 hex

    const hash1 = await hashToken(token);
    const hash2 = await hashToken(token);
    expect(hash1).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex
    expect(hash1).toBe(hash2); // Determinístico
  });
});

describe("Gestión de Administradores: Super Admin y Admins Hijos (BR-08, BR-10)", () => {
  it("Super Admin puede crear un nuevo administrador hijo con contraseña hasheada", async () => {
    const { deps } = createTestEnvironment();

    const createRes = await createChildAdmin(
      {
        name: "Valeria Gómez",
        email: "valeria@aurastudio.com",
        password: "valeria-secret-password-123",
        requesterRole: "SUPER_ADMIN",
      },
      deps
    );

    expect(createRes.success).toBe(true);
    expect(createRes.data).toBeDefined();
    expect(createRes.data?.role).toBe("ADMIN");
    expect(createRes.data?.status).toBe("ACTIVE");
    expect(createRes.data?.email).toBe("valeria@aurastudio.com");

    // Verificar en base de datos que la contraseña no se guardó en texto plano
    const savedUser = await deps.adminUserRepo.findByEmail("valeria@aurastudio.com");
    expect(savedUser).not.toBeNull();
    expect(savedUser?.passwordHash).toHaveLength(128);
    expect(savedUser?.passwordHash).not.toContain("valeria-secret-password-123");

    // Puede loguearse con la contraseña creada
    const loginRes = await loginAdmin(
      {
        email: "valeria@aurastudio.com",
        password: "valeria-secret-password-123",
        clientKey: "valeria-ip",
      },
      deps
    );
    expect(loginRes.success).toBe(true);
    expect(loginRes.user?.role).toBe("ADMIN");
  });

  it("rechaza creación de admin si el solicitante no es SUPER_ADMIN", async () => {
    const { deps } = createTestEnvironment();

    const res = await createChildAdmin(
      {
        name: "Intento No Autorizado",
        email: "hacker@test.com",
        password: "password123456",
        requesterRole: "ADMIN",
      },
      deps
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain("Solo la administradora principal");
  });

  it("rechaza emails duplicados o contraseñas cortas", async () => {
    const { deps } = createTestEnvironment();

    // Contraseña demasiado corta
    const shortPassRes = await createChildAdmin(
      {
        name: "Ana",
        email: "ana@aurastudio.com",
        password: "123",
        requesterRole: "SUPER_ADMIN",
      },
      deps
    );
    expect(shortPassRes.success).toBe(false);
    expect(shortPassRes.error).toContain("al menos 8 caracteres");

    // Crear un primer usuario
    await createChildAdmin(
      {
        name: "Ana",
        email: "ana@aurastudio.com",
        password: "password-valida-888",
        requesterRole: "SUPER_ADMIN",
      },
      deps
    );

    // Intento con el mismo correo
    const dupRes = await createChildAdmin(
      {
        name: "Ana Duplicada",
        email: "ana@aurastudio.com",
        password: "password-valida-888",
        requesterRole: "SUPER_ADMIN",
      },
      deps
    );
    expect(dupRes.success).toBe(false);
    expect(dupRes.error).toContain("Ya existe un usuario");
  });

  it("Super Admin puede suspender a un admin hijo y éste ya no puede iniciar sesión", async () => {
    const { deps, seed } = createTestEnvironment();
    await seed();

    // Crear admin hijo
    const created = await createChildAdmin(
      {
        name: "Lucas Operador",
        email: "lucas@aurastudio.com",
        password: "lucas-seguridad-2026",
        requesterRole: "SUPER_ADMIN",
      },
      deps
    );

    const childId = created.data!.id;
    expect(childId).toBeGreaterThan(1);

    // Suspender al admin hijo con requesterUserId = 1 (Super Admin)
    const suspendRes = await toggleAdminStatus(
      {
        targetUserId: childId,
        newStatus: "SUSPENDED",
        requesterUserId: 1,
        requesterRole: "SUPER_ADMIN",
      },
      deps
    );

    expect(suspendRes.success).toBe(true);
    expect(suspendRes.data?.status).toBe("SUSPENDED");

    // Intento de login del admin suspendido debe fallar
    const loginAttempt = await loginAdmin(
      {
        email: "lucas@aurastudio.com",
        password: "lucas-seguridad-2026",
        clientKey: "lucas-client",
      },
      deps
    );

    expect(loginAttempt.success).toBe(false);
    expect(loginAttempt.error).toContain("ha sido suspendida");

    // Reactivar admin hijo
    const reactivateRes = await toggleAdminStatus(
      {
        targetUserId: childId,
        newStatus: "ACTIVE",
        requesterUserId: 1,
        requesterRole: "SUPER_ADMIN",
      },
      deps
    );
    expect(reactivateRes.success).toBe(true);

    // Ahora el login debe ser exitoso
    const loginSuccess = await loginAdmin(
      {
        email: "lucas@aurastudio.com",
        password: "lucas-seguridad-2026",
        clientKey: "lucas-client",
      },
      deps
    );
    expect(loginSuccess.success).toBe(true);
  });

  it("Super Admin no puede suspender su propia cuenta", async () => {
    const { deps, seed } = createTestEnvironment();
    await seed();

    const res = await toggleAdminStatus(
      {
        targetUserId: 1,
        newStatus: "SUSPENDED",
        requesterUserId: 1,
        requesterRole: "SUPER_ADMIN",
      },
      deps
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain("No puedes suspender tu propia cuenta");
  });
});

describe("Recuperación de Contraseña por Correo (BR-10, BR-37)", () => {
  it("flujo completo de restablecimiento de contraseña exitoso", async () => {
    const { deps } = createTestEnvironment();
    const now = 10_000_000;

    // Mock de servicio de email
    let sentEmail: { to: string; link: string } | null = null;
    const mockEmailService = {
      sendEmail: async () => ({ success: true }),
      sendPasswordResetEmail: async (to: string, resetLink: string) => {
        sentEmail = { to, link: resetLink };
        return { success: true };
      },
    };

    // Crear usuario admin
    await createChildAdmin(
      {
        name: "Marina Showroom",
        email: "marina@aurastudio.com",
        password: "clave-vieja-inicial-2026",
        requesterRole: "SUPER_ADMIN",
      },
      deps
    );

    // 1. Solicitar recuperación
    const reqRes = await requestPasswordReset(
      {
        email: "marina@aurastudio.com",
        baseUrl: "https://aurastudio.com",
        now,
      },
      {
        adminUserRepo: deps.adminUserRepo,
        passwordResetTokenRepo: deps.passwordResetTokenRepo,
        emailService: mockEmailService,
      }
    );

    expect(reqRes.success).toBe(true);
    expect(sentEmail).not.toBeNull();
    expect(sentEmail!.to).toBe("marina@aurastudio.com");
    expect(sentEmail!.link).toContain("https://aurastudio.com/admin/restablecer?token=");

    // Extraer token de la url
    const url = new URL(sentEmail!.link);
    const token = url.searchParams.get("token")!;
    expect(token).toBeDefined();

    // 2. Restablecer con nueva contraseña
    const resetRes = await resetPassword(
      {
        token,
        newPassword: "nueva-clave-segura-2026",
        now: now + 5000,
      },
      deps
    );

    expect(resetRes.success).toBe(true);

    // 3. Login con clave anterior debe fallar
    const oldLogin = await loginAdmin(
      {
        email: "marina@aurastudio.com",
        password: "clave-vieja-inicial-2026",
        clientKey: "client-marina",
      },
      deps
    );
    expect(oldLogin.success).toBe(false);

    // 4. Login con nueva clave debe ser exitoso
    const newLogin = await loginAdmin(
      {
        email: "marina@aurastudio.com",
        password: "nueva-clave-segura-2026",
        clientKey: "client-marina",
      },
      deps
    );
    expect(newLogin.success).toBe(true);

    // 5. Reutilizar el mismo token debe ser rechazado
    const reuseRes = await resetPassword(
      {
        token,
        newPassword: "otra-clave-mas-12345",
        now: now + 10000,
      },
      deps
    );
    expect(reuseRes.success).toBe(false);
    expect(reuseRes.error).toContain("ya ha sido utilizado");
  });

  it("rechaza token expirado tras 1 hora", async () => {
    const { deps } = createTestEnvironment();
    const now = 10_000_000;

    let sentToken = "";
    const mockEmail = {
      sendEmail: async () => ({ success: true }),
      sendPasswordResetEmail: async (_to: string, link: string) => {
        const u = new URL(link);
        sentToken = u.searchParams.get("token")!;
        return { success: true };
      },
    };

    await createChildAdmin(
      {
        name: "Test Expiry",
        email: "expiry@aurastudio.com",
        password: "clave-inicial-123",
        requesterRole: "SUPER_ADMIN",
      },
      deps
    );

    await requestPasswordReset(
      {
        email: "expiry@aurastudio.com",
        baseUrl: "https://aurastudio.com",
        now,
      },
      {
        adminUserRepo: deps.adminUserRepo,
        passwordResetTokenRepo: deps.passwordResetTokenRepo,
        emailService: mockEmail,
      }
    );

    // Intentar canjear pasadas 1 hora y 1 segundo (3600_001 ms)
    const expiredRes = await resetPassword(
      {
        token: sentToken,
        newPassword: "nueva-clave-88888",
        now: now + 3600_001,
      },
      deps
    );

    expect(expiredRes.success).toBe(false);
    expect(expiredRes.error).toContain("ha expirado");
  });

  it("correo inexistente no arroja error ni filtra existencia de usuarios", async () => {
    const { deps } = createTestEnvironment();

    const res = await requestPasswordReset(
      {
        email: "fantasma@inexistente.com",
        baseUrl: "https://aurastudio.com",
      },
      {
        adminUserRepo: deps.adminUserRepo,
        passwordResetTokenRepo: deps.passwordResetTokenRepo,
      }
    );

    // Retorna éxito genérico para evitar enumeración de usuarios
    expect(res.success).toBe(true);
    expect(res.message).toContain("Si la dirección de correo se encuentra registrada");
  });
});

