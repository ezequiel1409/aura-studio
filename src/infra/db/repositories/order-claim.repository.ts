import { eq, desc } from "drizzle-orm";
import { DbClient } from "../client";
import { orderClaims } from "../schema";
import { OrderClaim, ClaimStatus, ClaimType } from "../../../domain/claim/types";

export class DrizzleOrderClaimRepository {
  constructor(private readonly db: DbClient) {}

  async create(data: {
    id: string;
    orderId: number;
    orderCode: number;
    type: ClaimType;
    claimCode: string;
    customerName: string;
    customerDni: string;
    customerEmail: string;
    customerPhone: string;
    reason?: string | null;
    conditionAccepted: boolean;
    status?: ClaimStatus;
    createdAt: number;
  }): Promise<OrderClaim> {
    const [inserted] = await this.db
      .insert(orderClaims)
      .values({
        id: data.id,
        orderId: data.orderId,
        orderCode: data.orderCode,
        type: data.type,
        claimCode: data.claimCode,
        customerName: data.customerName,
        customerDni: data.customerDni,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        reason: data.reason || null,
        conditionAccepted: data.conditionAccepted ? 1 : 0,
        status: data.status || "PENDING",
        createdAt: data.createdAt,
      })
      .returning();

    return this.mapToDomain(inserted);
  }

  async findById(id: string): Promise<OrderClaim | null> {
    const [row] = await this.db.select().from(orderClaims).where(eq(orderClaims.id, id));
    return row ? this.mapToDomain(row) : null;
  }

  async findByOrderId(orderId: number): Promise<OrderClaim | null> {
    const [row] = await this.db
      .select()
      .from(orderClaims)
      .where(eq(orderClaims.orderId, orderId))
      .orderBy(desc(orderClaims.createdAt))
      .limit(1);
    return row ? this.mapToDomain(row) : null;
  }

  async findByClaimCode(claimCode: string): Promise<OrderClaim | null> {
    const [row] = await this.db
      .select()
      .from(orderClaims)
      .where(eq(orderClaims.claimCode, claimCode.trim().toUpperCase()));
    return row ? this.mapToDomain(row) : null;
  }

  async findByOrderCode(orderCode: number): Promise<OrderClaim | null> {
    const [row] = await this.db
      .select()
      .from(orderClaims)
      .where(eq(orderClaims.orderCode, orderCode))
      .orderBy(desc(orderClaims.createdAt))
      .limit(1);
    return row ? this.mapToDomain(row) : null;
  }

  async updateStatus(
    id: string,
    status: ClaimStatus,
    options: {
      rejectionReason?: string;
      adminNotes?: string;
      resolvedAt?: number;
    } = {}
  ): Promise<OrderClaim> {
    const updateValues: Partial<typeof orderClaims.$inferInsert> = {
      status,
    };

    if (options.resolvedAt !== undefined) {
      updateValues.resolvedAt = options.resolvedAt;
    } else {
      updateValues.resolvedAt = Math.floor(Date.now() / 1000);
    }

    if (options.rejectionReason !== undefined) {
      updateValues.rejectionReason = options.rejectionReason;
    }
    if (options.adminNotes !== undefined) {
      updateValues.adminNotes = options.adminNotes;
    }

    const [updated] = await this.db
      .update(orderClaims)
      .set(updateValues)
      .where(eq(orderClaims.id, id))
      .returning();

    if (!updated) {
      throw new Error(`OrderClaim with id ${id} not found for status update.`);
    }

    return this.mapToDomain(updated);
  }

  async listAll(options: { status?: ClaimStatus } = {}): Promise<OrderClaim[]> {
    let query = this.db.select().from(orderClaims);
    if (options.status) {
      query = query.where(eq(orderClaims.status, options.status)) as typeof query;
    }
    const rows = await query.orderBy(desc(orderClaims.createdAt));
    return rows.map((r) => this.mapToDomain(r));
  }

  private mapToDomain(row: typeof orderClaims.$inferSelect): OrderClaim {
    return {
      id: row.id,
      orderId: row.orderId,
      orderCode: row.orderCode,
      type: row.type as ClaimType,
      claimCode: row.claimCode,
      customerName: row.customerName,
      customerDni: row.customerDni,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      reason: row.reason,
      conditionAccepted: Boolean(row.conditionAccepted),
      status: row.status as ClaimStatus,
      rejectionReason: row.rejectionReason,
      adminNotes: row.adminNotes,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
    };
  }
}

