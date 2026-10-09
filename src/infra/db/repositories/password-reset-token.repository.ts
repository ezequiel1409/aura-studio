import { eq } from "drizzle-orm";
import { PasswordResetToken } from "../../../domain/auth/types";
import { IPasswordResetTokenRepository } from "../../../domain/ports/repositories.port";
import { DbClient } from "../client";
import { passwordResetTokens } from "../schema";

export class DrizzlePasswordResetTokenRepository
  implements IPasswordResetTokenRepository
{
  constructor(private readonly db: DbClient) {}

  async createToken(
    userId: number,
    tokenHash: string,
    expiresAt: number,
    createdAt: number = Date.now()
  ): Promise<PasswordResetToken> {
    const [inserted] = await this.db
      .insert(passwordResetTokens)
      .values({
        userId,
        tokenHash,
        expiresAt,
        usedAt: null,
        createdAt,
      })
      .returning();

    return {
      id: inserted.id,
      userId: inserted.userId,
      tokenHash: inserted.tokenHash,
      expiresAt: inserted.expiresAt,
      usedAt: inserted.usedAt,
      createdAt: inserted.createdAt,
    };
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const [row] = await this.db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash));

    if (!row) return null;

    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }

  async markAsUsed(id: number, usedAt: number = Date.now()): Promise<void> {
    await this.db
      .update(passwordResetTokens)
      .set({ usedAt })
      .where(eq(passwordResetTokens.id, id));
  }
}

