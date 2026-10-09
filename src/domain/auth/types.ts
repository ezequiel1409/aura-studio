export type AdminRole = "SUPER_ADMIN" | "ADMIN";
export type AdminStatus = "ACTIVE" | "SUSPENDED";

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  role: AdminRole;
  status: AdminStatus;
  createdAt: number;
  updatedAt: number;
}

export type SafeAdminUser = Omit<AdminUser, "passwordHash" | "passwordSalt">;

export interface LoginAttempt {
  key: string;
  failedCount: number;
  lockedUntil: number | null;
}

export interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}

export interface LoginResult {
  success: boolean;
  sessionToken?: string;
  user?: SafeAdminUser;
  error?: string;
  remainingLockSeconds?: number;
}

export interface PasswordResetToken {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: number;
  usedAt: number | null;
  createdAt: number;
}
