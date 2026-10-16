import { desc, eq } from "drizzle-orm";
import { ICustomerAddressRepository } from "../../../domain/ports/repositories.port";
import { CustomerAddress } from "../../../domain/customer/types";
import { DbClient } from "../client";
import { customerAddresses } from "../schema";

export class DrizzleCustomerAddressRepository implements ICustomerAddressRepository {
  constructor(private readonly db: DbClient) {}

  async create(data: Omit<CustomerAddress, "id"> | (Omit<CustomerAddress, "id" | "createdAt" | "updatedAt"> & { createdAt?: number; updatedAt?: number })): Promise<CustomerAddress> {
    const now = Date.now();
    const createdAt = data.createdAt ?? now;
    const updatedAt = data.updatedAt ?? now;

    // Si se marca como default, desmarcar las demás del mismo cliente
    if (data.isDefault) {
      await this.db
        .update(customerAddresses)
        .set({ isDefault: 0, updatedAt })
        .where(eq(customerAddresses.customerId, data.customerId));
    }

    const [inserted] = await this.db
      .insert(customerAddresses)
      .values({
        customerId: data.customerId,
        label: data.label.trim(),
        recipientName: data.recipientName?.trim() ?? null,
        recipientPhone: data.recipientPhone?.trim() ?? null,
        address: data.address.trim(),
        city: data.city?.trim() ?? null,
        postalCode: data.postalCode?.trim() ?? null,
        notes: data.notes?.trim() ?? null,
        isDefault: data.isDefault ? 1 : 0,
        createdAt,
        updatedAt,
      })
      .returning();

    return {
      ...(inserted as unknown as CustomerAddress),
      isDefault: Boolean(inserted.isDefault),
    };
  }

  async findById(id: number): Promise<CustomerAddress | null> {
    const [row] = await this.db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.id, id));

    if (!row) return null;
    return {
      ...(row as unknown as CustomerAddress),
      isDefault: Boolean(row.isDefault),
    };
  }

  async listByCustomer(customerId: number): Promise<CustomerAddress[]> {
    const rows = await this.db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));

    return rows.map((r) => ({
      ...(r as unknown as CustomerAddress),
      isDefault: Boolean(r.isDefault),
    }));
  }

  async setDefault(customerId: number, addressId: number, updatedAt: number): Promise<void> {
    // Desmarcar todas las del cliente
    await this.db
      .update(customerAddresses)
      .set({ isDefault: 0, updatedAt })
      .where(eq(customerAddresses.customerId, customerId));

    // Marcar la seleccionada
    await this.db
      .update(customerAddresses)
      .set({ isDefault: 1, updatedAt })
      .where(eq(customerAddresses.id, addressId));
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(customerAddresses).where(eq(customerAddresses.id, id));
  }
}
