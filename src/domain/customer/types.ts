export type CustomerStatus = "ACTIVE" | "SUSPENDED";

export interface Customer {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  passwordHash: string;
  passwordSalt: string;
  status: CustomerStatus;
  createdAt: number;
  updatedAt: number;
}

export type SafeCustomer = Omit<Customer, "passwordHash" | "passwordSalt">;

export function toSafeCustomer(customer: Customer): SafeCustomer {
  const { passwordHash, passwordSalt, ...safe } = customer;
  return safe;
}

export interface CustomerAddress {
  id: number;
  customerId: number;
  label: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  address: string;
  city?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateCustomerInput {
  email: string;
  name: string;
  phone?: string | null;
  password: string;
}

export interface CreateCustomerAddressInput {
  customerId: number;
  label?: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  address: string;
  city?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  isDefault?: boolean;
}
