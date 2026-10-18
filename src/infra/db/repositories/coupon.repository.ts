import { and, desc, eq, or, sql } from "drizzle-orm";
import { ICouponRepository, CreateCouponRepoData } from "../../../domain/ports/repositories.port";
import { Coupon, CouponRedemption } from "../../../domain/coupon/types";
import { DbClient } from "../client";
import { coupons, couponRedemptions } from "../schema";

export class DrizzleCouponRepository implements ICouponRepository {
  constructor(private readonly db: DbClient) {}

  async create(data: CreateCouponRepoData): Promise<Coupon> {
    const now = Date.now();
    const [inserted] = await this.db
      .insert(coupons)
      .values({
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || null,
        type: data.type,
        value: data.value,
        minOrderCents: data.minOrderCents ?? 0,
        maxDiscountCents: data.maxDiscountCents ?? null,
        usageLimit: data.usageLimit ?? null,
        usedCount: 0,
        maxUsesPerEmail: data.maxUsesPerEmail ?? 1,
        isActive: data.isActive !== false ? 1 : 0,
        startsAt: data.startsAt ?? null,
        expiresAt: data.expiresAt ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return this.mapRow(inserted);
  }

  async findById(id: number): Promise<Coupon | null> {
    const [row] = await this.db.select().from(coupons).where(eq(coupons.id, id));
    if (!row) return null;
    return this.mapRow(row);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const [row] = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.trim().toUpperCase()));
    if (!row) return null;
    return this.mapRow(row);
  }

  async list(options?: { activeOnly?: boolean }): Promise<Coupon[]> {
    const query = this.db.select().from(coupons);
    if (options?.activeOnly) {
      const rows = await query.where(eq(coupons.isActive, 1)).orderBy(desc(coupons.createdAt));
      return rows.map((r) => this.mapRow(r));
    }
    const rows = await query.orderBy(desc(coupons.createdAt));
    return rows.map((r) => this.mapRow(r));
  }

  async update(id: number, data: Partial<CreateCouponRepoData>): Promise<Coupon> {
    const now = Date.now();
    const updateValues: Record<string, unknown> = { updatedAt: now };

    if (data.code !== undefined) updateValues.code = data.code.trim().toUpperCase();
    if (data.description !== undefined) updateValues.description = data.description?.trim() || null;
    if (data.type !== undefined) updateValues.type = data.type;
    if (data.value !== undefined) updateValues.value = data.value;
    if (data.minOrderCents !== undefined) updateValues.minOrderCents = data.minOrderCents;
    if (data.maxDiscountCents !== undefined) updateValues.maxDiscountCents = data.maxDiscountCents;
    if (data.usageLimit !== undefined) updateValues.usageLimit = data.usageLimit;
    if (data.maxUsesPerEmail !== undefined) updateValues.maxUsesPerEmail = data.maxUsesPerEmail;
    if (data.isActive !== undefined) updateValues.isActive = data.isActive ? 1 : 0;
    if (data.startsAt !== undefined) updateValues.startsAt = data.startsAt;
    if (data.expiresAt !== undefined) updateValues.expiresAt = data.expiresAt;

    const [updated] = await this.db
      .update(coupons)
      .set(updateValues)
      .where(eq(coupons.id, id))
      .returning();

    return this.mapRow(updated);
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(coupons).where(eq(coupons.id, id));
  }

  async incrementUsage(id: number): Promise<void> {
    await this.db
      .update(coupons)
      .set({
        usedCount: sql`${coupons.usedCount} + 1`,
        updatedAt: Date.now(),
      })
      .where(eq(coupons.id, id));
  }

  async countRedemptions(
    couponId: number,
    identifiers: { email?: string | null; phone?: string | null; dni?: string | null }
  ): Promise<number> {
    const conditions = [];

    if (identifiers.email && identifiers.email.trim()) {
      conditions.push(eq(couponRedemptions.customerEmail, identifiers.email.toLowerCase().trim()));
    }
    if (identifiers.phone && identifiers.phone.trim()) {
      conditions.push(eq(couponRedemptions.customerPhone, identifiers.phone.trim()));
    }
    if (identifiers.dni && identifiers.dni.trim()) {
      conditions.push(eq(couponRedemptions.customerDni, identifiers.dni.trim()));
    }

    if (conditions.length === 0) return 0;

    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(couponRedemptions)
      .where(
        and(
          eq(couponRedemptions.couponId, couponId),
          or(...conditions)
        )
      );

    return Number(rows[0]?.count || 0);
  }

  async countRedemptionsByEmail(couponId: number, email: string): Promise<number> {
    return this.countRedemptions(couponId, { email });
  }

  async recordRedemption(data: {
    couponId: number;
    orderId?: number | null;
    customerEmail: string;
    customerPhone?: string | null;
    customerDni?: string | null;
    customerId?: number | null;
    discountCents: number;
  }): Promise<CouponRedemption> {
    const now = Date.now();
    const [inserted] = await this.db
      .insert(couponRedemptions)
      .values({
        couponId: data.couponId,
        orderId: data.orderId ?? null,
        customerEmail: data.customerEmail.toLowerCase().trim(),
        customerPhone: data.customerPhone?.trim() || null,
        customerDni: data.customerDni?.trim() || null,
        customerId: data.customerId ?? null,
        discountCents: data.discountCents,
        createdAt: now,
      })
      .returning();

    return {
      id: inserted.id,
      couponId: inserted.couponId,
      orderId: inserted.orderId,
      customerEmail: inserted.customerEmail,
      customerPhone: inserted.customerPhone,
      customerDni: inserted.customerDni,
      customerId: inserted.customerId,
      discountCents: inserted.discountCents,
      createdAt: inserted.createdAt,
    };
  }

  private mapRow(row: typeof coupons.$inferSelect): Coupon {
    return {
      id: row.id,
      code: row.code,
      description: row.description,
      type: row.type as Coupon["type"],
      value: row.value,
      minOrderCents: row.minOrderCents,
      maxDiscountCents: row.maxDiscountCents,
      usageLimit: row.usageLimit,
      usedCount: row.usedCount,
      maxUsesPerEmail: row.maxUsesPerEmail,
      isActive: Boolean(row.isActive),
      startsAt: row.startsAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
