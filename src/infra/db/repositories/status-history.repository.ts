import { desc, eq } from "drizzle-orm";
import { IStatusHistoryRepository } from "../../../domain/ports/repositories.port";
import { ProductStatus, StatusHistoryEntry, StatusSource } from "../../../domain/product/types";
import { DbClient } from "../client";
import { statusHistory } from "../schema";

export class DrizzleStatusHistoryRepository implements IStatusHistoryRepository {
  constructor(private readonly db: DbClient) {}

  async record(entry: Omit<StatusHistoryEntry, "id">): Promise<StatusHistoryEntry> {
    const [inserted] = await this.db
      .insert(statusHistory)
      .values({
        productId: entry.productId,
        productCode: entry.productCode,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        at: entry.at,
        source: entry.source,
      })
      .returning();

    return {
      id: inserted.id,
      productId: inserted.productId,
      productCode: inserted.productCode,
      fromStatus: inserted.fromStatus as ProductStatus | null,
      toStatus: inserted.toStatus as ProductStatus,
      at: inserted.at,
      source: inserted.source as StatusSource,
    };
  }

  async listByProductId(productId: number): Promise<StatusHistoryEntry[]> {
    const rows = await this.db
      .select()
      .from(statusHistory)
      .where(eq(statusHistory.productId, productId))
      .orderBy(desc(statusHistory.at), desc(statusHistory.id));

    return rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      productCode: r.productCode,
      fromStatus: r.fromStatus as ProductStatus | null,
      toStatus: r.toStatus as ProductStatus,
      at: r.at,
      source: r.source as StatusSource,
    }));
  }
}

