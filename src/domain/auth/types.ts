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
  error?: string;
  remainingLockSeconds?: number;
}
