import { IAdminUserRepository, IEmailService, IPasswordResetTokenRepository } from "../domain/ports/repositories.port";
import { generateSecureToken, hashPassword, hashToken } from "../lib/crypto/password";

export interface PasswordResetDeps {
  adminUserRepo: IAdminUserRepository;
  passwordResetTokenRepo: IPasswordResetTokenRepository;
  emailService?: IEmailService;
}

export interface RequestPasswordResetInput {
  email: string;
  baseUrl: string;
  now?: number;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  now?: number;
}

export interface PasswordResetResult {
  success: boolean;
  message?: string;
  error?: string;
}

const TOKEN_EXPIRATION_MS = 3600_000; // 1 hora de validez (BR-10, BR-37)

/**
 * Solicita el restablecimiento de contraseña mediante envío de email seguro.
 * Protege contra enumeración de usuarios respondiendo con mensaje genérico idéntico.
 */
export async function requestPasswordReset(
  input: RequestPasswordResetInput,
  deps: PasswordResetDeps
): Promise<PasswordResetResult> {
  const { adminUserRepo, passwordResetTokenRepo, emailService } = deps;
  const now = input.now ?? Date.now();
  const genericMessage =
    "Si la dirección de correo se encuentra registrada y activa, recibirás un enlace de restablecimiento a la brevedad.";

  const email = input.email.trim().toLowerCase();
  const user = await adminUserRepo.findByEmail(email);

  // Si el usuario no existe o está suspendido, no enviamos email pero devolvemos mensaje genérico seguro
  if (!user || user.status === "SUSPENDED") {
    return {
      success: true,
      message: genericMessage,
    };
  }

  // Generar token aleatorio criptográfico de 32 bytes y su hash SHA-256 para la base de datos
  const rawToken = generateSecureToken();
  const tokenHash = await hashToken(rawToken);
  const expiresAt = now + TOKEN_EXPIRATION_MS;

  await passwordResetTokenRepo.createToken(user.id, tokenHash, expiresAt, now);

  const resetLink = `${input.baseUrl.replace(/\/$/, "")}/admin/restablecer?token=${rawToken}`;

  if (emailService) {
    await emailService.sendPasswordResetEmail(user.email, resetLink, user.name);
  } else {
    console.log(`[PasswordReset] Enlace para ${user.email}: ${resetLink}`);
  }

  return {
    success: true,
    message: genericMessage,
  };
}

/**
 * Restablece la contraseña utilizando el token provisto.
 * Aplica hash PBKDF2-HMAC-SHA512 e invalida el token para uso único.
 */
export async function resetPassword(
  input: ResetPasswordInput,
  deps: PasswordResetDeps
): Promise<PasswordResetResult> {
  const { adminUserRepo, passwordResetTokenRepo } = deps;
  const now = input.now ?? Date.now();

  if (!input.token || typeof input.token !== "string") {
    return {
      success: false,
      error: "Token de restablecimiento inválido.",
    };
  }

  if (!input.newPassword || input.newPassword.length < 8) {
    return {
      success: false,
      error: "La nueva contraseña debe tener al menos 8 caracteres.",
    };
  }

  const tokenHash = await hashToken(input.token.trim());
  const tokenRecord = await passwordResetTokenRepo.findByTokenHash(tokenHash);

  if (!tokenRecord) {
    return {
      success: false,
      error: "El enlace de restablecimiento es inválido o no existe.",
    };
  }

  if (tokenRecord.usedAt !== null) {
    return {
      success: false,
      error: "Este enlace de restablecimiento ya ha sido utilizado previamente.",
    };
  }

  if (tokenRecord.expiresAt <= now) {
    return {
      success: false,
      error: "El enlace de restablecimiento ha expirado. Por favor solicita uno nuevo.",
    };
  }

  const user = await adminUserRepo.findById(tokenRecord.userId);
  if (!user || user.status === "SUSPENDED") {
    return {
      success: false,
      error: "La cuenta asociada no está disponible o ha sido suspendida.",
    };
  }

  // Hashear la nueva contraseña con PBKDF2-HMAC-SHA512
  const { hash, salt } = await hashPassword(input.newPassword);

  // Actualizar credenciales del usuario
  await adminUserRepo.updatePassword(user.id, hash, salt, now);

  // Marcar token como consumido para evitar reuso
  await passwordResetTokenRepo.markAsUsed(tokenRecord.id, now);

  return {
    success: true,
    message: "Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.",
  };
}

