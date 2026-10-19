import { desc, eq, inArray, sql } from "drizzle-orm";
import {
  CreateOrderRepoData,
  IOrderRepository,
  OrderSummaryCounts,
} from "../../../domain/ports/repositories.port";
import { Order, OrderItem, OrderStatus } from "../../../domain/order/types";
import { PaymentStatus } from "../../../domain/payment/types";
import { DbClient } from "../client";
import { orderItems, orders } from "../schema";

export class DrizzleOrderRepository implements IOrderRepository {
  constructor(private readonly db: DbClient) {}

  async getSummaryCounts(): Promise<OrderSummaryCounts> {
    const [row] = await this.db
      .select({
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} = 'PENDING' THEN 1 ELSE 0 END), 0)`,
      })
      .from(orders);

    return {
      total: Number(row?.total ?? 0),
      pending: Number(row?.pending ?? 0),
    };
  }

  async create(data: CreateOrderRepoData): Promise<Order> {
    const [inserted] = await this.db
      .insert(orders)
      .values({
        code: data.code,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        customerDni: data.customerDni,
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
        paymentMethod: data.paymentMethod ?? "WHATSAPP",
        paymentStatus: data.paymentStatus ?? "PENDING",
        paymentExternalId: data.paymentExternalId ?? null,
        paymentDiscountCents: data.paymentDiscountCents ?? 0,
        customerId: data.customerId ?? null,
        commerceId: data.commerceId ?? null,
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
    if (rows.length === 0) return [];

    const orderIds = rows.map((r) => r.id);
    const allItems = await this.db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrderId = new Map<number, OrderItem[]>();
    for (const item of allItems) {
      const list = itemsByOrderId.get(item.orderId) || [];
      list.push(item as OrderItem);
      itemsByOrderId.set(item.orderId, list);
    }

    return rows.map((r) => ({
      ...(r as Order),
      items: itemsByOrderId.get(r.id) || [],
    }));
  }

  async listByCustomer(customerId: number): Promise<Order[]> {
    const rows = await this.db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));

    if (rows.length === 0) return [];

    const orderIds = rows.map((r) => r.id);
    const allItems = await this.db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrderId = new Map<number, OrderItem[]>();
    for (const item of allItems) {
      const list = itemsByOrderId.get(item.orderId) || [];
      list.push(item as OrderItem);
      itemsByOrderId.set(item.orderId, list);
    }

    return rows.map((r) => ({
      ...(r as Order),
      items: itemsByOrderId.get(r.id) || [],
    }));
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

  async updatePayment(
    id: number,
    data: { paymentStatus: PaymentStatus; paymentExternalId?: string | null; updatedAt: number }
  ): Promise<Order> {
    const updatePayload: Record<string, unknown> = {
      paymentStatus: data.paymentStatus,
      updatedAt: data.updatedAt,
    };
    if (data.paymentExternalId !== undefined) {
      updatePayload.paymentExternalId = data.paymentExternalId;
    }
    await this.db
      .update(orders)
      .set(updatePayload)
      .where(eq(orders.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Order ${id} not found`);
    }
    return updated;
  }
}

