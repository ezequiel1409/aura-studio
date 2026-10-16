import { ValidationError } from "../errors";
import { CreateCustomerInput, CreateCustomerAddressInput } from "./types";

export function validateCustomerRegistration(input: CreateCustomerInput): {
  email: string;
  name: string;
  phone: string | null;
  password: string;
} {
  const email = input.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("Ingresá un correo electrónico válido.");
  }

  const name = input.name?.trim();
  if (!name || name.length < 2) {
    throw new ValidationError("El nombre debe tener al menos 2 caracteres.");
  }

  const phone = input.phone?.trim() || null;
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) {
      throw new ValidationError("Ingresá un teléfono o WhatsApp válido.");
    }
  }

  const password = input.password;
  if (!password || password.length < 6) {
    throw new ValidationError("La contraseña debe tener al menos 6 caracteres.");
  }

  return { email, name, phone, password };
}

export function validateCustomerAddress(input: CreateCustomerAddressInput): {
  label: string;
  recipientName: string | null;
  recipientPhone: string | null;
  address: string;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
  isDefault: boolean;
} {
  const address = input.address?.trim();
  if (!address || address.length < 4) {
    throw new ValidationError("La dirección de entrega es obligatoria (calle, número, etc.).");
  }

  return {
    label: input.label?.trim() || "Principal",
    recipientName: input.recipientName?.trim() || null,
    recipientPhone: input.recipientPhone?.trim() || null,
    address,
    city: input.city?.trim() || null,
    postalCode: input.postalCode?.trim() || null,
    notes: input.notes?.trim() || null,
    isDefault: input.isDefault ?? true,
  };
}

