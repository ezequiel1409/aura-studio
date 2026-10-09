import { LoginAttempt } from "./types";

/**
 * BR-11: Tras 5 intentos fallidos consecutivos, bloqueo de 60 segundos.
 */
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 60 * 1000; // 60 segundos

/**
 * BR-37: Expiración de sesión por inactividad.
 */
export const SESSION_INACTIVITY_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Evalúa si una clave/cuenta se encuentra actualmente bloqueada por fuerza bruta (BR-11).
 */
export function isAccountLocked(
  attempt: LoginAttempt | null | undefined,
  now: number = Date.now()
): { locked: boolean; remainingSeconds: number } {
  if (!attempt || !attempt.lockedUntil) {
    return { locked: false, remainingSeconds: 0 };
  }

  if (attempt.lockedUntil > now) {
    const remainingSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
    return { locked: true, remainingSeconds };
  }

  return { locked: false, remainingSeconds: 0 };
}

/**
 * Calcula el siguiente contador de fallos y el tiempo de bloqueo si alcanza el umbral (BR-11).
 */
export function calculateNextFailedAttempt(
  currentFailedCount: number,
  now: number = Date.now()
): { nextFailedCount: number; lockedUntil: number | null; isLocked: boolean } {
  const nextFailedCount = currentFailedCount + 1;
  if (nextFailedCount >= MAX_LOGIN_ATTEMPTS) {
    return {
      nextFailedCount,
      lockedUntil: now + LOCKOUT_DURATION_MS,
      isLocked: true,
    };
  }

  return {
    nextFailedCount,
    lockedUntil: null,
    isLocked: false,
  };
}
