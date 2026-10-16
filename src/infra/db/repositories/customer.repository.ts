import { count, eq } from "drizzle-orm";
import { ICustomerRepository } from "../../../domain/ports/repositories.port";
import { Customer, CustomerStatus } from "../../../domain/customer/types";
import { DbClient } from "../client";
import { customers } from "../schema";

export class DrizzleCustomerRepository implements ICustomerRepository {
  constructor(private readonly db: DbClient) {}

  async create(data: Omit<Customer, "id"> | (Omit<Customer, "id" | "createdAt" | "updatedAt"> & { createdAt?: number; updatedAt?: number })): Promise<Customer> {
    const now = Date.now();
    const q = this.db
      .insert(customers)
      .values({
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        phone: data.phone?.trim() ?? null,
        passwordHash: data.passwordHash,
        passwordSalt: data.passwordSalt,
        status: data.status,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      })
      .returning();
    const [inserted] = await q;

    return inserted as Customer;
  }

  async findById(id: number): Promise<Customer | null> {
    const [row] = await this.db.select().from(customers).where(eq(customers.id, id));
    return (row as Customer) || null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const [row] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase().trim()));
    return (row as Customer) || null;
  }

  async updateProfile(
    id: number,
    data: { name?: string; phone?: string | null; updatedAt: number }
  ): Promise<Customer> {
    const updates: Partial<typeof customers.$inferInsert> = {
      updatedAt: data.updatedAt,
    };
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.phone !== undefined) updates.phone = data.phone?.trim() ?? null;

    const [updated] = await this.db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();

    return updated as Customer;
  }

  async updatePassword(
    id: number,
    passwordHash: string,
    passwordSalt: string,
    updatedAt: number
  ): Promise<void> {
    await this.db
      .update(customers)
      .set({ passwordHash, passwordSalt, updatedAt })
      .where(eq(customers.id, id));
  }

  async updateStatus(
    id: number,
    status: CustomerStatus,
    updatedAt: number
  ): Promise<Customer> {
    const [updated] = await this.db
      .update(customers)
      .set({ status, updatedAt })
      .where(eq(customers.id, id))
      .returning();

    return updated as Customer;
  }

  async count(): Promise<number> {
    const [row] = await this.db.select({ value: count() }).from(customers);
    return row?.value || 0;
  }
}
