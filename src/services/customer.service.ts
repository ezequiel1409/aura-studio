import {
  CreateCustomerAddressInput,
  CreateCustomerInput,
  Customer,
  CustomerAddress,
  SafeCustomer,
  toSafeCustomer,
} from "../domain/customer/types";
import {
  validateCustomerAddress,
  validateCustomerRegistration,
} from "../domain/customer/rules";
import { isAccountLocked } from "../domain/auth/rules";
import {
  ICustomerRepository,
  ICustomerAddressRepository,
  IOrderRepository,
  ICommerceRepository,
  ILoginAttemptRepository,
} from "../domain/ports/repositories.port";
import { createCustomerSessionToken } from "../infra/auth/customer-session";
import { generateSalt, hashPassword, verifyPasswordHash } from "../lib/crypto/password";
import { Order } from "../domain/order/types";
import { Commerce } from "../domain/commerce/types";

export interface CustomerServiceDeps {
  customerRepo: ICustomerRepository;
  customerAddressRepo?: ICustomerAddressRepository;
  orderRepo?: IOrderRepository;
  commerceRepo?: ICommerceRepository;
  loginAttemptRepo?: ILoginAttemptRepository;
  sessionSecret?: string;
}

export interface RegisterCustomerResult {
  success: boolean;
  error?: string;
  customer?: SafeCustomer;
  sessionToken?: string;
}

export interface LoginCustomerInput {
  email: string;
  password: string;
  clientKey?: string;
  now?: number;
}

export interface LoginCustomerResult {
  success: boolean;
  error?: string;
  remainingLockSeconds?: number;
  customer?: SafeCustomer;
  sessionToken?: string;
}

/**
 * Registra una nueva cuenta de cliente con contraseña segura (PBKDF2-HMAC-SHA512).
 */
export async function registerCustomer(
  input: CreateCustomerInput,
  deps: CustomerServiceDeps
): Promise<RegisterCustomerResult> {
  const { customerRepo } = deps;

  // 1. Validar reglas de dominio (email, longitud de nombre, contraseña >= 6)
  const clean = validateCustomerRegistration(input);

  // 2. Verificar duplicados de correo electrónico
  const existing = await customerRepo.findByEmail(clean.email);
  if (existing) {
    return {
      success: false,
      error: "Ya existe una cuenta registrada con este correo electrónico.",
    };
  }

  // 3. Generar salt criptográfico y hash PBKDF2
  const { hash: passwordHash, salt } = await hashPassword(clean.password);

  // 4. Crear cliente en base de datos
  const customer = await customerRepo.create({
    email: clean.email,
    name: clean.name,
    phone: clean.phone,
    dni: clean.dni,
    passwordHash,
    passwordSalt: salt,
    status: "ACTIVE",
  });

  // 5. Generar token de sesión persistente (30 días)
  const sessionToken = await createCustomerSessionToken(
    {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
    },
    deps.sessionSecret
  );

  return {
    success: true,
    customer: toSafeCustomer(customer),
    sessionToken,
  };
}

/**
 * Autentica un cliente con su correo y contraseña.
 * Protegido contra ataques de fuerza bruta mediante IP/Key throttling.
 */
export async function loginCustomer(
  input: LoginCustomerInput,
  deps: CustomerServiceDeps
): Promise<LoginCustomerResult> {
  const { customerRepo, loginAttemptRepo } = deps;
  const now = input.now ?? Date.now();

  // 1. Validar bloqueo por fuerza bruta si existe loginAttemptRepo
  if (loginAttemptRepo && input.clientKey) {
    const existingAttempt = await loginAttemptRepo.get(`cust_${input.clientKey}`);
    const lockStatus = isAccountLocked(existingAttempt, now);
    if (lockStatus.locked) {
      return {
        success: false,
        error: `Acceso temporalmente bloqueado tras reiterados intentos fallidos. Intente nuevamente en ${lockStatus.remainingSeconds} segundos.`,
        remainingLockSeconds: lockStatus.remainingSeconds,
      };
    }
  }

  const handleFailure = async (): Promise<LoginCustomerResult> => {
    if (loginAttemptRepo && input.clientKey) {
      const incrementResult = await loginAttemptRepo.incrementFailed(
        `cust_${input.clientKey}`,
        now
      );
      if (incrementResult.isLocked) {
        return {
          success: false,
          error: "Ha superado el límite de 5 intentos fallidos. El acceso ha sido bloqueado por 60 segundos.",
          remainingLockSeconds: 60,
        };
      }
      const remaining = 5 - incrementResult.failedCount;
      return {
        success: false,
        error: `Correo o contraseña incorrectos. Le quedan ${remaining} intento${remaining === 1 ? "" : "s"}.`,
      };
    }

    return {
      success: false,
      error: "Correo o contraseña incorrectos.",
    };
  };

  const email = input.email?.trim().toLowerCase();
  if (!email || !input.password) {
    return {
      success: false,
      error: "Debes ingresar tu correo y contraseña.",
    };
  }

  // 2. Buscar cliente por email
  const customer = await customerRepo.findByEmail(email);
  if (!customer) {
    return handleFailure();
  }

  if (customer.status === "SUSPENDED") {
    return {
      success: false,
      error: "Esta cuenta se encuentra temporalmente deshabilitada. Contactanos por WhatsApp.",
    };
  }

  // 3. Verificar hash PBKDF2
  const isValid = await verifyPasswordHash(
    input.password,
    customer.passwordHash,
    customer.passwordSalt
  );

  if (!isValid) {
    return handleFailure();
  }

  // 4. Resetear intentos fallidos tras login exitoso
  if (loginAttemptRepo && input.clientKey) {
    await loginAttemptRepo.reset(`cust_${input.clientKey}`);
  }

  // 5. Generar token de sesión persistente
  const sessionToken = await createCustomerSessionToken(
    {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
    },
    deps.sessionSecret,
    undefined,
    now
  );

  return {
    success: true,
    customer: toSafeCustomer(customer),
    sessionToken,
  };
}

/**
 * Obtiene el perfil seguro del cliente autenticado.
 */
export async function getCustomerProfile(
  customerId: number,
  deps: CustomerServiceDeps
): Promise<SafeCustomer | null> {
  const customer = await deps.customerRepo.findById(customerId);
  if (!customer || customer.status === "SUSPENDED") return null;
  return toSafeCustomer(customer);
}

/**
 * Actualiza el perfil básico del cliente (nombre, teléfono, DNI).
 */
export async function updateCustomerProfile(
  customerId: number,
  input: { name?: string; phone?: string | null; dni?: string | null },
  deps: CustomerServiceDeps
): Promise<SafeCustomer | null> {
  const customer = await deps.customerRepo.findById(customerId);
  if (!customer) return null;

  const cleanDni =
    input.dni !== undefined
      ? (input.dni ? input.dni.replace(/\D/g, "") || null : null)
      : customer.dni;

  const updated = await deps.customerRepo.updateProfile(customerId, {
    name: input.name?.trim() || customer.name,
    phone: input.phone !== undefined ? (input.phone?.trim() || null) : customer.phone,
    dni: cleanDni,
    updatedAt: Date.now(),
  });

  return toSafeCustomer(updated);
}

/**
 * Actualiza la contraseña del cliente verificando la contraseña actual.
 */
export async function updateCustomerPassword(
  customerId: number,
  input: { currentPassword?: string; newPassword: string },
  deps: CustomerServiceDeps
): Promise<{ success: boolean; error?: string }> {
  const customer = await deps.customerRepo.findById(customerId);
  if (!customer) {
    return { success: false, error: "Cliente no encontrado." };
  }

  if (input.currentPassword) {
    const isValid = await verifyPasswordHash(
      input.currentPassword,
      customer.passwordHash,
      customer.passwordSalt
    );
    if (!isValid) {
      return { success: false, error: "La contraseña actual es incorrecta." };
    }
  }

  if (!input.newPassword || input.newPassword.length < 8) {
    return {
      success: false,
      error: "La nueva contraseña debe tener al menos 8 caracteres.",
    };
  }

  const { hash, salt } = await hashPassword(input.newPassword);
  await deps.customerRepo.updatePassword(customerId, hash, salt, Date.now());

  return { success: true };
}

/**
 * Lista las direcciones guardadas del cliente.
 */
export async function getCustomerAddresses(
  customerId: number,
  deps: CustomerServiceDeps
): Promise<CustomerAddress[]> {
  if (!deps.customerAddressRepo) return [];
  return deps.customerAddressRepo.listByCustomer(customerId);
}

/**
 * Agrega una nueva dirección para el cliente.
 * Si es la primera dirección o se marca como predeterminada, actualiza las demás.
 */
export async function addCustomerAddress(
  customerId: number,
  input: Omit<CreateCustomerAddressInput, "customerId">,
  deps: CustomerServiceDeps
): Promise<CustomerAddress> {
  if (!deps.customerAddressRepo) {
    throw new Error("Repositorio de direcciones no disponible.");
  }

  const existing = await deps.customerAddressRepo.listByCustomer(customerId);
  const validated = validateCustomerAddress({
    ...input,
    customerId,
    // Si no tiene ninguna dirección previa, esta es predeterminada por defecto
    isDefault: existing.length === 0 ? true : (input.isDefault ?? false),
  });

  return deps.customerAddressRepo.create({
    customerId,
    ...validated,
  });
}

/**
 * Establece una dirección como predeterminada.
 */
export async function setDefaultCustomerAddress(
  customerId: number,
  addressId: number,
  deps: CustomerServiceDeps
): Promise<boolean> {
  if (!deps.customerAddressRepo) return false;
  await deps.customerAddressRepo.setDefault(customerId, addressId, Date.now());
  return true;
}

/**
 * Elimina una dirección perteneciente al cliente.
 */
export async function deleteCustomerAddress(
  customerId: number,
  addressId: number,
  deps: CustomerServiceDeps
): Promise<boolean> {
  if (!deps.customerAddressRepo) return false;

  const addresses = await deps.customerAddressRepo.listByCustomer(customerId);
  const belongs = addresses.some((a) => a.id === addressId);
  if (!belongs) {
    return false;
  }

  await deps.customerAddressRepo.delete(addressId);
  return true;
}

/**
 * Lista el historial de pedidos de un cliente.
 */
export async function getCustomerOrders(
  customerId: number,
  deps: CustomerServiceDeps
): Promise<Order[]> {
  if (!deps.orderRepo) return [];
  return deps.orderRepo.listByCustomer(customerId);
}

/**
 * Obtiene el comercio principal/predeterminado del sistema.
 */
export async function getDefaultCommerce(
  deps: CustomerServiceDeps
): Promise<Commerce | null> {
  if (!deps.commerceRepo) return null;
  return deps.commerceRepo.findDefault();
}
