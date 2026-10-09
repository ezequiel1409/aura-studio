import { AdminRole, AdminStatus, SafeAdminUser } from "../domain/auth/types";
import { IAdminUserRepository } from "../domain/ports/repositories.port";
import { hashPassword } from "../lib/crypto/password";

export interface AdminUsersDeps {
  adminUserRepo: IAdminUserRepository;
}

export interface CreateChildAdminInput {
  email: string;
  name: string;
  password: string;
  requesterRole: AdminRole;
}

export interface ToggleAdminStatusInput {
  targetUserId: number;
  newStatus: AdminStatus;
  requesterUserId: number;
  requesterRole: AdminRole;
}

export interface AdminServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * BR-08, BR-10: Servicio de gestión de administradores (Jerarquía Super Admin / Admin).
 */
export async function createChildAdmin(
  input: CreateChildAdminInput,
  deps: AdminUsersDeps
): Promise<AdminServiceResult<SafeAdminUser>> {
  const { adminUserRepo } = deps;

  // 1. Autorización: Solo SUPER_ADMIN puede dar de alta nuevos administradores
  if (input.requesterRole !== "SUPER_ADMIN") {
    return {
      success: false,
      error: "Acceso denegado: Solo la administradora principal (SUPER_ADMIN) puede crear nuevos administradores.",
    };
  }

  // 2. Validaciones de entrada
  const email = input.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "El formato del correo electrónico es inválido.",
    };
  }

  const name = input.name.trim();
  if (name.length < 2) {
    return {
      success: false,
      error: "El nombre debe contener al menos 2 caracteres.",
    };
  }

  if (input.password.length < 8) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  // 3. Verificar si el email ya existe
  const existing = await adminUserRepo.findByEmail(email);
  if (existing) {
    return {
      success: false,
      error: "Ya existe un usuario de administración registrado con este correo.",
    };
  }

  // 4. Hashear contraseña con PBKDF2-HMAC-SHA512 + Salt criptográfico
  const { hash, salt } = await hashPassword(input.password);
  const now = Date.now();

  const user = await adminUserRepo.create({
    email,
    name,
    passwordHash: hash,
    passwordSalt: salt,
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

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
    data: safeUser,
  };
}

export async function listAdminUsers(
  requesterRole: AdminRole,
  deps: AdminUsersDeps
): Promise<AdminServiceResult<SafeAdminUser[]>> {
  const { adminUserRepo } = deps;

  if (requesterRole !== "SUPER_ADMIN") {
    return {
      success: false,
      error: "Acceso denegado: Solo la administradora principal puede listar administradores.",
    };
  }

  const users = await adminUserRepo.listAll();
  const safeUsers: SafeAdminUser[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  return {
    success: true,
    data: safeUsers,
  };
}

export async function toggleAdminStatus(
  input: ToggleAdminStatusInput,
  deps: AdminUsersDeps
): Promise<AdminServiceResult<SafeAdminUser>> {
  const { adminUserRepo } = deps;

  // 1. Autorización
  if (input.requesterRole !== "SUPER_ADMIN") {
    return {
      success: false,
      error: "Acceso denegado: Solo la administradora principal puede modificar el estado de administradores.",
    };
  }

  // 2. Prevenir auto-suspensión del Super Admin
  if (input.targetUserId === input.requesterUserId) {
    return {
      success: false,
      error: "No puedes suspender tu propia cuenta de administradora principal.",
    };
  }

  // 3. Verificar usuario destino
  const targetUser = await adminUserRepo.findById(input.targetUserId);
  if (!targetUser) {
    return {
      success: false,
      error: "El usuario especificado no existe.",
    };
  }

  if (targetUser.role === "SUPER_ADMIN") {
    return {
      success: false,
      error: "No se puede suspender a una administradora principal.",
    };
  }

  const now = Date.now();
  const updatedUser = await adminUserRepo.updateStatus(input.targetUserId, input.newStatus, now);

  const safeUser: SafeAdminUser = {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role,
    status: updatedUser.status,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };

  return {
    success: true,
    data: safeUser,
  };
}

