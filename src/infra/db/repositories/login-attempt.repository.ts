import { eq } from "drizzle-orm";
import { calculateNextFailedAttempt } from "../../../domain/auth/rules";
import { ILoginAttemptRepository, LoginAttemptRecord } from "../../../domain/ports/repositories.port";
import { DbClient } from "../client";
import { loginAttempts } from "../schema";

/**
 * BR-11: Control de fuerza bruta persistido en base de datos.
 */
export class DrizzleLoginAttemptRepository implements ILoginAttemptRepository {
  constructor(private readonly db: DbClient) {}

  async get(key: string): Promise<LoginAttemptRecord | null> {
    const [row] = await this.db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.key, key));

    if (!row) return null;

    return {
      key: row.key,
      failedCount: row.failedCount,
      lockedUntil: row.lockedUntil,
    };
  }

  async incrementFailed(
    key: string,
    now: number = Date.now()
  ): Promise<{ failedCount: number; lockedUntil: number | null; isLocked: boolean }> {
    const existing = await this.get(key);
    const currentFailed = existing ? existing.failedCount : 0;
    const { nextFailedCount, lockedUntil, isLocked } = calculateNextFailedAttempt(currentFailed, now);

    await this.db
      .insert(loginAttempts)
      .values({
        key,
        failedCount: nextFailedCount,
        lockedUntil,
      })
      .onConflictDoUpdate({
        target: loginAttempts.key,
        set: {
          failedCount: nextFailedCount,
          lockedUntil,
        },
      });

    return {
      failedCount: nextFailedCount,
      lockedUntil,
      isLocked,
    };
  }

  async reset(key: string): Promise<void> {
    await this.db
      .delete(loginAttempts)
      .where(eq(loginAttempts.key, key));
  }
}
