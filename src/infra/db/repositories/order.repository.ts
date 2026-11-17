import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  CreateOrderRepoData,
  IOrderRepository,
  OrderSummaryCounts,
} from "../../../domain/ports/repositories.port";
import { Order, OrderItem, OrderStatus, OrderTimelineEvent } from "../../../domain/order/types";
import { GatewayPaymentDetails, PaymentStatus } from "../../../domain/payment/types";
import { DbClient } from "../client";
import { orderItems, orders } from "../schema";

const orderColumns = {
  id: orders.id,
  code: orders.code,
  customerName: orders.customerName,
  customerFirstName: orders.customerFirstName,
  customerLastName: orders.customerLastName,
  customerPhone: orders.customerPhone,
  customerEmail: orders.customerEmail,
  customerDni: orders.customerDni,
  deliveryMethod: orders.deliveryMethod,
  deliveryAddress: orders.deliveryAddress,
  postalCode: orders.postalCode,
  deliveryNotes: orders.deliveryNotes,
  subtotalCents: orders.subtotalCents,
  discountCents: orders.discountCents,
  shippingCents: orders.shippingCents,
  totalCents: orders.totalCents,
  currency: orders.currency,
  couponCode: orders.couponCode,
  status: orders.status,
  paymentMethod: orders.paymentMethod,
  paymentStatus: orders.paymentStatus,
  paymentExternalId: orders.paymentExternalId,
  paymentDetailsJson: orders.paymentDetailsJson,
  paymentDiscountCents: orders.paymentDiscountCents,
  timelineJson: orders.timelineJson,
  customerId: orders.customerId,
  commerceId: orders.commerceId,
  transferReceiptUrl: orders.transferReceiptUrl,
  transferReceiptUploadedAt: orders.transferReceiptUploadedAt,
  notes: orders.notes,
  createdAt: orders.createdAt,
  updatedAt: orders.updatedAt,
};

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function hydrateOrderRow(
  row: {
    paymentDetailsJson?: string | null;
    timelineJson?: string | null;
    [key: string]: unknown;
  },
  items: OrderItem[]
): Order {
  const { paymentDetailsJson, timelineJson, ...rest } = row;
  return {
    ...(rest as unknown as Omit<Order, "items" | "paymentDetails" | "timeline">),
    paymentDetails: safeParseJson<GatewayPaymentDetails | null>(paymentDetailsJson, null),
    timeline: safeParseJson<OrderTimelineEvent[]>(timelineJson, []),
    items,
  };
}

const orderItemColumns = {
  id: orderItems.id,
  orderId: orderItems.orderId,
  productId: orderItems.productId,
  productCode: orderItems.productCode,
  productTitle: orderItems.productTitle,
  colorName: orderItems.colorName,
  size: orderItems.size,
  quantity: orderItems.quantity,
  unitPriceCents: orderItems.unitPriceCents,
  subtotalCents: orderItems.subtotalCents,
  photoUrl: orderItems.photoUrl,
};

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
        customerFirstName: data.customerFirstName ?? null,
        customerLastName: data.customerLastName ?? null,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        customerDni: data.customerDni,
        deliveryMethod: data.deliveryMethod,
        deliveryAddress: data.deliveryAddress,
        postalCode: data.postalCode ?? null,
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
        paymentDetailsJson: data.paymentDetails ? JSON.stringify(data.paymentDetails) : null,
        paymentDiscountCents: data.paymentDiscountCents ?? 0,
        timelineJson: JSON.stringify(data.timeline ?? []),
        customerId: data.customerId ?? null,
        commerceId: data.commerceId ?? null,
        transferReceiptUrl: data.transferReceiptUrl ?? null,
        transferReceiptUploadedAt: data.transferReceiptUploadedAt ?? null,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .returning(orderColumns);

    let createdItems: OrderItem[] = [];
    if (data.items && data.items.length > 0) {
      const payload = data.items.map((item) => ({
        orderId: inserted.id,
        productId: item.productId ?? null,
        productCode: item.productCode,
        productTitle: item.productTitle,
        colorName: item.colorName,
        size: item.size,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        subtotalCents: item.quantity * item.unitPriceCents,
        photoUrl: item.photoUrl ?? null,
      }));
      const rows = await this.db.insert(orderItems).values(payload).returning(orderItemColumns);
      createdItems = rows as OrderItem[];
    }

    return hydrateOrderRow(inserted as Record<string, unknown>, createdItems);
  }

  private async attachItemsToOrder(row: Record<string, unknown>): Promise<Order> {
    const orderId = Number(row.id);
    const items = await this.db
      .select(orderItemColumns)
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    return hydrateOrderRow(row, items as OrderItem[]);
  }

  private async attachItemsToOrders(rows: Array<Record<string, unknown>>): Promise<Order[]> {
    if (rows.length === 0) return [];

    const orderIds = rows.map((r) => Number(r.id));
    const allItems = await this.db
      .select(orderItemColumns)
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrderId = new Map<number, OrderItem[]>();
    for (const item of allItems) {
      const list = itemsByOrderId.get(item.orderId) || [];
      list.push(item as OrderItem);
      itemsByOrderId.set(item.orderId, list);
    }

    return rows.map((r) => hydrateOrderRow(r, itemsByOrderId.get(Number(r.id)) || []));
  }

  async findById(id: number): Promise<Order | null> {
    const [row] = await this.db.select(orderColumns).from(orders).where(eq(orders.id, id));
    if (!row) return null;
    return this.attachItemsToOrder(row as Record<string, unknown>);
  }

  async findByCode(code: number): Promise<Order | null> {
    const [row] = await this.db.select(orderColumns).from(orders).where(eq(orders.code, code));
    if (!row) return null;
    return this.attachItemsToOrder(row as Record<string, unknown>);
  }

  async list(options?: { status?: OrderStatus; limit?: number; offset?: number }): Promise<Order[]> {
    let query = this.db.select(orderColumns).from(orders).$dynamic();
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
    return this.attachItemsToOrders(rows as Array<Record<string, unknown>>);
  }

  async listByCustomer(customerId: number): Promise<Order[]> {
    const rows = await this.db
      .select(orderColumns)
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));

    return this.attachItemsToOrders(rows as Array<Record<string, unknown>>);
  }

  async linkGuestOrdersByEmail(email: string, customerId: number): Promise<number> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return 0;

    const updated = await this.db
      .update(orders)
      .set({ customerId })
      .where(and(isNull(orders.customerId), eq(orders.customerEmail, cleanEmail)))
      .returning({ id: orders.id });

    return updated.length;
  }

  async updateStatus(id: number, status: OrderStatus, updatedAt: number): Promise<Order> {
    const [updated] = await this.db
      .update(orders)
      .set({ status, updatedAt })
      .where(eq(orders.id, id))
      .returning(orderColumns);

    if (!updated) {
      throw new Error(`Order ${id} not found`);
    }

    return this.attachItemsToOrder(updated as Record<string, unknown>);
  }

  async updatePayment(
    id: number,
    data: {
      paymentStatus: PaymentStatus;
      paymentExternalId?: string | null;
      paymentDetails?: GatewayPaymentDetails | null;
      updatedAt: number;
    }
  ): Promise<Order> {
    const updatePayload: Record<string, unknown> = {
      paymentStatus: data.paymentStatus,
      updatedAt: data.updatedAt,
    };
    if (data.paymentExternalId !== undefined) {
      updatePayload.paymentExternalId = data.paymentExternalId;
    }
    if (data.paymentDetails !== undefined) {
      updatePayload.paymentDetailsJson = data.paymentDetails
        ? JSON.stringify(data.paymentDetails)
        : null;
    }
    const [updated] = await this.db
      .update(orders)
      .set(updatePayload)
      .where(eq(orders.id, id))
      .returning(orderColumns);

    if (!updated) {
      throw new Error(`Order ${id} not found`);
    }

    return this.attachItemsToOrder(updated as Record<string, unknown>);
  }

  async updateTimeline(
    id: number,
    timeline: OrderTimelineEvent[],
    updatedAt: number
  ): Promise<Order> {
    const [updated] = await this.db
      .update(orders)
      .set({
        timelineJson: JSON.stringify(timeline),
        updatedAt,
      })
      .where(eq(orders.id, id))
      .returning(orderColumns);

    if (!updated) {
      throw new Error(`Order ${id} not found`);
    }

    return this.attachItemsToOrder(updated as Record<string, unknown>);
  }

  async updateTransferReceipt(
    id: number,
    receiptUrl: string,
    uploadedAt: number
  ): Promise<Order> {
    const [updated] = await this.db
      .update(orders)
      .set({
        transferReceiptUrl: receiptUrl,
        transferReceiptUploadedAt: uploadedAt,
        updatedAt: uploadedAt,
      })
      .where(eq(orders.id, id))
      .returning(orderColumns);

    if (!updated) {
      throw new Error(`Order ${id} not found`);
    }

    return this.attachItemsToOrder(updated as Record<string, unknown>);
  }
}

