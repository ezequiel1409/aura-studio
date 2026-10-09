import { isAccountLocked } from "../domain/auth/rules";
import { LoginResult, SafeAdminUser } from "../domain/auth/types";
import { IAdminUserRepository, ILoginAttemptRepository } from "../domain/ports/repositories.port";
import { createSessionToken, timingSafeEqualStrings, verifySessionToken, SessionPayload } from "../infra/auth/session";
import { verifyPasswordHash } from "../lib/crypto/password";
import { getEnv } from "../lib/env";

export interface AuthDeps {
  loginAttemptRepo: ILoginAttemptRepository;
  adminUserRepo?: IAdminUserRepository;
  adminPassword?: string;
  sessionSecret?: string;
}

export interface LoginAdminInput {
  email?: string;
  password: string;
  clientKey: string;
  now?: number;
}

/**
 * BR-10, BR-11, BR-37: Autenticación de la administradora.
 * Validación server-side con contraseñas hasheadas en PBKDF2-HMAC-SHA512 (o fallback por entorno),
 * protección contra fuerza bruta (5 intentos -> 60s de bloqueo en base de datos),
 * y token de sesión firmado criptográficamente con HMAC-SHA256.
 */
export async function loginAdmin(
  input: LoginAdminInput,
  deps: AuthDeps
): Promise<LoginResult> {
  const { loginAttemptRepo, adminUserRepo } = deps;
  const env = getEnv();
  const sessionSecret = deps.sessionSecret ?? env.SESSION_SECRET;
  const now = input.now ?? Date.now();

  // 1. Verificar si la clave o IP está bloqueada por fuerza bruta (BR-11)
  const existingAttempt = await loginAttemptRepo.get(input.clientKey);
  const lockStatus = isAccountLocked(existingAttempt, now);

  if (lockStatus.locked) {
    return {
      success: false,
      error: `Acceso temporalmente bloqueado tras reiterados intentos fallidos. Intente nuevamente en ${lockStatus.remainingSeconds} segundos.`,
      remainingLockSeconds: lockStatus.remainingSeconds,
    };
  }

  // Helper para manejar fallos de autenticación
  const handleAuthFailure = async (customMessage?: string): Promise<LoginResult> => {
    const incrementResult = await loginAttemptRepo.incrementFailed(input.clientKey, now);

    if (incrementResult.isLocked) {
      return {
        success: false,
        error: "Ha superado el límite de 5 intentos fallidos. El acceso ha sido bloqueado por 60 segundos.",
        remainingLockSeconds: 60,
      };
    }

    const remainingAttempts = 5 - incrementResult.failedCount;
    return {
      success: false,
      error: customMessage || `Credenciales incorrectas. Le quedan ${remainingAttempts} intento${remainingAttempts === 1 ? "" : "s"}.`,
    };
  };

  // 2. Si contamos con adminUserRepo, autenticamos contra la tabla de usuarios
  if (adminUserRepo) {
    const emailToLookup = input.email ? input.email.trim().toLowerCase() : "admin@aurastudio.com";
    const user = await adminUserRepo.findByEmail(emailToLookup);

    if (user) {
      // Verificar si la cuenta se encuentra suspendida por el Super Admin
      if (user.status === "SUSPENDED") {
        return {
          success: false,
          error: "Esta cuenta de administración ha sido suspendida. Contacta a la administración principal.",
        };
      }

      // Verificación PBKDF2-HMAC-SHA512
      const isValid = await verifyPasswordHash(input.password, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        return handleAuthFailure();
      }

      // Login exitoso: resetear contador de fallos (BR-11)
      await loginAttemptRepo.reset(input.clientKey);

      // Generar token de sesión firmado criptográficamente con rol y datos de usuario (BR-37)
      const sessionToken = await createSessionToken(
        sessionSecret,
        { userId: user.id, email: user.email, role: user.role },
        undefined,
        now
      );

      const safeUser: SafeAdminUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        success: true,
        sessionToken,
        user: safeUser,
      };
    } else if (input.email) {
      // Si el email fue provisto explícitamente y no existe
      return handleAuthFailure();
    }
  }

  // 3. Fallback para tests unitarios o arranque sin tabla poblada: adminPassword en memoria/env
  const fallbackPassword = deps.adminPassword ?? env.ADMIN_PASSWORD;
  const isFallbackValid = timingSafeEqualStrings(input.password, fallbackPassword);

  if (!isFallbackValid) {
    return handleAuthFailure();
  }

  // Resetear contador de fallos
  await loginAttemptRepo.reset(input.clientKey);

  // Generar token con rol SUPER_ADMIN por defecto
  const sessionToken = await createSessionToken(
    sessionSecret,
    { email: "admin@aurastudio.com", role: "SUPER_ADMIN" },
    undefined,
    now
  );

  return {
    success: true,
    sessionToken,
  };
}

/**
 * BR-37: Valida si un token de sesión de administradora es válido y no ha expirado por inactividad.
 */
export async function verifyAdminSession(
  token: string | undefined | null,
  deps: AuthDeps,
  now: number = Date.now()
): Promise<boolean> {
  if (!token) return false;

  const env = getEnv();
  const sessionSecret = deps.sessionSecret ?? env.SESSION_SECRET;

  const result = await verifySessionToken(token, sessionSecret, now);
  return result.valid;
}
