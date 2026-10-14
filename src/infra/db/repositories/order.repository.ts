import { desc, eq } from "drizzle-orm";
import {
  CreateOrderRepoData,
  IOrderRepository,
} from "../../../domain/ports/repositories.port";
import { Order, OrderItem, OrderStatus } from "../../../domain/order/types";
import { DbClient } from "../client";
import { orderItems, orders } from "../schema";

export class DrizzleOrderRepository implements IOrderRepository {
  constructor(private readonly db: DbClient) {}

  async create(data: CreateOrderRepoData): Promise<Order> {
    const [inserted] = await this.db
      .insert(orders)
      .values({
        code: data.code,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        deliveryMethod: data.deliveryMethod,
        deliveryAddress: data.deliveryAddress,
        deliveryNotes: data.deliveryNotes,
        subtotalCents: data.subtotalCents,
        discountCents: data.discountCents,
        shippingCents: data.shippingCents,
        totalCents: data.totalCents,
        currency: data.currency,
        couponCode: data.couponCode,
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .returning();

    const createdItems: OrderItem[] = [];
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const subtotalCents = item.quantity * item.unitPriceCents;
        const [insertedItem] = await this.db
          .insert(orderItems)
          .values({
            orderId: inserted.id,
            productId: item.productId ?? null,
            productCode: item.productCode,
            productTitle: item.productTitle,
            colorName: item.colorName,
            size: item.size,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            subtotalCents,
            photoUrl: item.photoUrl ?? null,
          })
          .returning();
        createdItems.push(insertedItem as OrderItem);
      }
    }

    return {
      ...(inserted as Order),
      items: createdItems,
    };
  }

  async findById(id: number): Promise<Order | null> {
    const [row] = await this.db.select().from(orders).where(eq(orders.id, id));
    if (!row) return null;
    const items = await this.db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return {
      ...(row as Order),
      items: items as OrderItem[],
    };
  }

  async findByCode(code: number): Promise<Order | null> {
    const [row] = await this.db.select().from(orders).where(eq(orders.code, code));
    if (!row) return null;
    const items = await this.db.select().from(orderItems).where(eq(orderItems.orderId, row.id));
    return {
      ...(row as Order),
      items: items as OrderItem[],
    };
  }

  async list(options?: { status?: OrderStatus; limit?: number; offset?: number }): Promise<Order[]> {
    let query = this.db.select().from(orders).$dynamic();
    if (options?.status) {
      query = query.where(eq(orders.status, options.status));
    }
    query = query.orderBy(desc(orders.createdAt));
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    const rows = await query;
    return rows as Order[];
  }

  async updateStatus(id: number, status: OrderStatus, updatedAt: number): Promise<Order> {
    await this.db
      .update(orders)
      .set({ status, updatedAt })
      .where(eq(orders.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Order ${id} not found`);
    }
    return updated;
  }
}
