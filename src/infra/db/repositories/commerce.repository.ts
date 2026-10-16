import { eq } from "drizzle-orm";
import { ICommerceRepository } from "../../../domain/ports/repositories.port";
import { Commerce } from "../../../domain/commerce/types";
import { DbClient } from "../client";
import { commerces } from "../schema";

export class DrizzleCommerceRepository implements ICommerceRepository {
  constructor(private readonly db: DbClient) {}

  async create(data: Omit<Commerce, "id"> | (Omit<Commerce, "id" | "createdAt" | "updatedAt"> & { createdAt?: number; updatedAt?: number })): Promise<Commerce> {
    const now = Date.now();
    const [inserted] = await this.db
      .insert(commerces)
      .values({
        slug: data.slug.toLowerCase().trim(),
        name: data.name.trim(),
        whatsappNumber: data.whatsappNumber?.trim() ?? null,
        address: data.address?.trim() ?? null,
        adminUserId: data.adminUserId ?? null,
        isActive: data.isActive ? 1 : 0,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      })
      .returning();

    return {
      ...(inserted as unknown as Commerce),
      isActive: Boolean(inserted.isActive),
    };
  }

  async findById(id: number): Promise<Commerce | null> {
    const [row] = await this.db.select().from(commerces).where(eq(commerces.id, id));
    if (!row) return null;
    return {
      ...(row as unknown as Commerce),
      isActive: Boolean(row.isActive),
    };
  }

  async findBySlug(slug: string): Promise<Commerce | null> {
    const [row] = await this.db
      .select()
      .from(commerces)
      .where(eq(commerces.slug, slug.toLowerCase().trim()));
    if (!row) return null;
    return {
      ...(row as unknown as Commerce),
      isActive: Boolean(row.isActive),
    };
  }

  async getDefault(): Promise<Commerce | null> {
    const [row] = await this.db
      .select()
      .from(commerces)
      .where(eq(commerces.isActive, 1))
      .limit(1);

    if (!row) return null;
    return {
      ...(row as unknown as Commerce),
      isActive: Boolean(row.isActive),
    };
  }

  async findDefault(): Promise<Commerce | null> {
    return this.getDefault();
  }

  async list(): Promise<Commerce[]> {
    const rows = await this.db.select().from(commerces);
    return rows.map((r) => ({
      ...(r as unknown as Commerce),
      isActive: Boolean(r.isActive),
    }));
  }
}
