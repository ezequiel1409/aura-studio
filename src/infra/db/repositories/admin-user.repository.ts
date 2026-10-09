import { count, eq } from "drizzle-orm";
import { AdminRole, AdminStatus, AdminUser } from "../../../domain/auth/types";
import {
  CreateAdminUserData,
  IAdminUserRepository,
} from "../../../domain/ports/repositories.port";
import { DbClient } from "../client";
import { adminUsers } from "../schema";

export class DrizzleAdminUserRepository implements IAdminUserRepository {
  constructor(private readonly db: DbClient) {}

  async create(data: CreateAdminUserData): Promise<AdminUser> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const [inserted] = await this.db
      .insert(adminUsers)
      .values({
        email: normalizedEmail,
        name: data.name.trim(),
        passwordHash: data.passwordHash,
        passwordSalt: data.passwordSalt,
        role: data.role || "ADMIN",
        status: data.status || "ACTIVE",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .returning();

    return this.mapToEntity(inserted);
  }

  async findById(id: number): Promise<AdminUser | null> {
    const [row] = await this.db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, id));

    return row ? this.mapToEntity(row) : null;
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const [row] = await this.db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizedEmail));

    return row ? this.mapToEntity(row) : null;
  }

  async listAll(): Promise<AdminUser[]> {
    const rows = await this.db
      .select()
      .from(adminUsers)
      .orderBy(adminUsers.createdAt);

    return rows.map((r) => this.mapToEntity(r));
  }

  async updateStatus(
    id: number,
    status: AdminStatus,
    updatedAt: number = Date.now()
  ): Promise<AdminUser> {
    const [updated] = await this.db
      .update(adminUsers)
      .set({ status, updatedAt })
      .where(eq(adminUsers.id, id))
      .returning();

    return this.mapToEntity(updated);
  }

  async updatePassword(
    id: number,
    passwordHash: string,
    passwordSalt: string,
    updatedAt: number = Date.now()
  ): Promise<void> {
    await this.db
      .update(adminUsers)
      .set({ passwordHash, passwordSalt, updatedAt })
      .where(eq(adminUsers.id, id));
  }

  async count(): Promise<number> {
    const [res] = await this.db.select({ total: count() }).from(adminUsers);
    return Number(res?.total ?? 0);
  }

  private mapToEntity(row: typeof adminUsers.$inferSelect): AdminUser {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      passwordSalt: row.passwordSalt,
      role: row.role as AdminRole,
      status: row.status as AdminStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

