import { isAccountLocked } from "../domain/auth/rules";
import { LoginResult } from "../domain/auth/types";
import { ILoginAttemptRepository } from "../domain/ports/repositories.port";
import { createSessionToken, timingSafeEqualStrings, verifySessionToken } from "../infra/auth/session";
import { getEnv } from "../lib/env";

export interface AuthDeps {
  loginAttemptRepo: ILoginAttemptRepository;
  adminPassword?: string;
  sessionSecret?: string;
}

export interface LoginAdminInput {
  password: string;
  clientKey: string;
  now?: number;
}

/**
 * BR-10, BR-11, BR-37: Autenticación de la administradora.
 * Validación server-side con timing-safe comparison, protección contra fuerza bruta
 * (5 intentos -> 60s de bloqueo en base de datos), y token de sesión firmado.
 */
export async function loginAdmin(
  input: LoginAdminInput,
  deps: AuthDeps
): Promise<LoginResult> {
  const { loginAttemptRepo } = deps;
  const env = getEnv();
  const adminPassword = deps.adminPassword ?? env.ADMIN_PASSWORD;
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

  // 2. Verificación de contraseña en tiempo constante (BR-10)
  const isPasswordValid = timingSafeEqualStrings(input.password, adminPassword);

  if (!isPasswordValid) {
    // Incrementar intentos fallidos en DB
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
      error: `Contraseña incorrecta. Le quedan ${remainingAttempts} intento${remainingAttempts === 1 ? "" : "s"}.`,
    };
  }

  // 3. Login exitoso: resetear contador de fallos (BR-11)
  await loginAttemptRepo.reset(input.clientKey);

  // 4. Generar token de sesión firmado criptográficamente (BR-37)
  const sessionToken = await createSessionToken(sessionSecret, undefined, now);

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
