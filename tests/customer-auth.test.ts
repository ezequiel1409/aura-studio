import { beforeEach, describe, expect, it } from "vitest";
import { createTestEnvironment } from "./setup-db";
import {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  addCustomerAddress,
  getCustomerAddresses,
  setDefaultCustomerAddress,
  deleteCustomerAddress,
  getCustomerOrders,
} from "../src/services/customer.service";
import {
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from "../src/infra/auth/customer-session";
import {
  validateCustomerRegistration,
  validateCustomerAddress,
} from "../src/domain/customer/rules";
import { ValidationError } from "../src/domain/errors";
import { createOrder } from "../src/services/order.service";
import { createProduct } from "../src/services/product.service";

describe("Customer Authentication & Account Management", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  describe("Reglas de Dominio de Clientes (rules.ts)", () => {
    it("valida campos requeridos al registrarse", () => {
      // Email inválido
      expect(() =>
        validateCustomerRegistration({
          email: "invalido",
          name: "Valeria",
          password: "password123",
        })
      ).toThrow(ValidationError);

      // Nombre muy corto
      expect(() =>
        validateCustomerRegistration({
          email: "valeria@aura.com",
          name: "V",
          password: "password123",
        })
      ).toThrow(ValidationError);

      // Contraseña menor a 6 caracteres
      expect(() =>
        validateCustomerRegistration({
          email: "valeria@aura.com",
          name: "Valeria Gomez",
          password: "123",
        })
      ).toThrow(ValidationError);

      // Datos válidos
      const valid = validateCustomerRegistration({
        email: "  VALERIA@Aura.com ",
        name: "  Valeria Gomez ",
        phone: "+54 9 11 1234-5678",
        password: "securePassword123",
      });
      expect(valid.email).toBe("valeria@aura.com");
      expect(valid.name).toBe("Valeria Gomez");
      expect(valid.phone).toBe("+54 9 11 1234-5678");
    });

    it("valida campos de dirección de entrega", () => {
      // Dirección demasiado corta
      expect(() =>
        validateCustomerAddress({
          customerId: 1,
          address: "abc",
        })
      ).toThrow(ValidationError);

      const valid = validateCustomerAddress({
        customerId: 1,
        label: " Showroom ",
        address: "Av. Alvear 1850, Recoleta",
        city: "CABA",
        postalCode: "C1014",
      });
      expect(valid.label).toBe("Showroom");
      expect(valid.address).toBe("Av. Alvear 1850, Recoleta");
      expect(valid.city).toBe("CABA");
      expect(valid.postalCode).toBe("C1014");
    });
  });

  describe("Tokens de Sesión de Cliente (customer-session.ts)", () => {
    const SECRET = "customer-test-secret-key-32-chars-long!";

    it("genera y valida un token de sesión criptográficamente firmado", async () => {
      const now = 1700000000000;
      const token = await createCustomerSessionToken(
        { customerId: 42, email: "cliente@aura.com", name: "Clara" },
        SECRET,
        86400000,
        now
      );

      expect(typeof token).toBe("string");
      expect(token).toContain(".");

      const verification = await verifyCustomerSessionToken(token, SECRET, now + 1000);
      expect(verification.valid).toBe(true);
      expect(verification.payload?.customerId).toBe(42);
      expect(verification.payload?.email).toBe("cliente@aura.com");
      expect(verification.payload?.name).toBe("Clara");
    });

    it("rechaza token manipulado o con firma inválida", async () => {
      const token = await createCustomerSessionToken(
        { customerId: 42, email: "cliente@aura.com", name: "Clara" },
        SECRET
      );

      const [payload, sig] = token.split(".");
      const tampered = `${payload}.invalidsignature123`;

      const result = await verifyCustomerSessionToken(tampered, SECRET);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("invalid_signature");
    });

    it("detecta token expirado por tiempo", async () => {
      const now = 1700000000000;
      const token = await createCustomerSessionToken(
        { customerId: 42, email: "cliente@aura.com", name: "Clara" },
        SECRET,
        1000, // 1 segundo
        now
      );

      const result = await verifyCustomerSessionToken(token, SECRET, now + 5000); // 5s después
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("token_expired");
    });
  });

  describe("Servicio de Clientes (customer.service.ts)", () => {
    it("registra un cliente correctamente con contraseña hasheada", async () => {
      const regResult = await registerCustomer(
        {
          name: "Sofía Rossi",
          email: "sofia@aura.com",
          phone: "1123456789",
          password: "mypassword123",
        },
        env.deps
      );

      expect(regResult.success).toBe(true);
      expect(regResult.customer?.id).toBeGreaterThan(0);
      expect(regResult.customer?.email).toBe("sofia@aura.com");
      expect(regResult.customer?.name).toBe("Sofía Rossi");
      expect(regResult.sessionToken).toBeDefined();

      // No debe exponer hashes en SafeCustomer
      expect((regResult.customer as Record<string, unknown>).passwordHash).toBeUndefined();
      expect((regResult.customer as Record<string, unknown>).passwordSalt).toBeUndefined();
    });

    it("impide registrar correos duplicados", async () => {
      await registerCustomer(
        {
          name: "Sofía Rossi",
          email: "sofia@aura.com",
          password: "mypassword123",
        },
        env.deps
      );

      const duplicate = await registerCustomer(
        {
          name: "Otra Sofía",
          email: "SOFIA@aura.com",
          password: "otherpassword123",
        },
        env.deps
      );

      expect(duplicate.success).toBe(false);
      expect(duplicate.error).toContain("Ya existe una cuenta registrada");
    });

    it("permite login con contraseña correcta y rechaza contraseñas inválidas", async () => {
      await registerCustomer(
        {
          name: "Camila Díaz",
          email: "camila@aura.com",
          password: "correctPassword123",
        },
        env.deps
      );

      // Login con contraseña incorrecta
      const failLogin = await loginCustomer(
        {
          email: "camila@aura.com",
          password: "wrongPassword",
          clientKey: "test-ip-1",
        },
        env.deps
      );
      expect(failLogin.success).toBe(false);
      expect(failLogin.error).toContain("incorrectos");

      // Login con contraseña correcta
      const successLogin = await loginCustomer(
        {
          email: "camila@aura.com",
          password: "correctPassword123",
          clientKey: "test-ip-1",
        },
        env.deps
      );
      expect(successLogin.success).toBe(true);
      expect(successLogin.customer?.email).toBe("camila@aura.com");
      expect(successLogin.sessionToken).toBeDefined();
    });

    it("activa bloqueo por fuerza bruta tras 5 intentos fallidos", async () => {
      await registerCustomer(
        {
          name: "Lucía Paz",
          email: "lucia@aura.com",
          password: "password123",
        },
        env.deps
      );

      const clientKey = "bruteforce-ip-test";

      // 4 intentos fallidos
      for (let i = 0; i < 4; i++) {
        const attempt = await loginCustomer(
          { email: "lucia@aura.com", password: "bad", clientKey },
          env.deps
        );
        expect(attempt.success).toBe(false);
      }

      // 5to intento fallido activa bloqueo
      const fifth = await loginCustomer(
        { email: "lucia@aura.com", password: "bad", clientKey },
        env.deps
      );
      expect(fifth.success).toBe(false);
      expect(fifth.remainingLockSeconds).toBe(60);

      // 6to intento bloqueado inmediatamente sin chequear contraseña
      const sixth = await loginCustomer(
        { email: "lucia@aura.com", password: "password123", clientKey },
        env.deps
      );
      expect(sixth.success).toBe(false);
      expect(sixth.error).toContain("bloqueado");
    });
  });

  describe("Gestión de Direcciones de Cliente", () => {
    it("administra direcciones guardadas y asigna la primera como predeterminada", async () => {
      const reg = await registerCustomer(
        {
          name: "Martina Sol",
          email: "martina@aura.com",
          password: "password123",
        },
        env.deps
      );
      const customerId = reg.customer!.id;

      // 1. Agregar primera dirección -> se asigna automáticamente como predeterminada
      const addr1 = await addCustomerAddress(
        customerId,
        {
          label: "Casa",
          address: "Av. Libertador 2450, 6° A",
          city: "Palermo, CABA",
          postalCode: "1425",
        },
        env.deps
      );
      expect(addr1.isDefault).toBe(true);

      // 2. Agregar segunda dirección no predeterminada
      const addr2 = await addCustomerAddress(
        customerId,
        {
          label: "Oficina",
          address: "Corrientes 500, Piso 10",
          city: "Microcentro, CABA",
          isDefault: false,
        },
        env.deps
      );
      expect(addr2.isDefault).toBe(false);

      let list = await getCustomerAddresses(customerId, env.deps);
      expect(list.length).toBe(2);

      // 3. Cambiar predeterminada a addr2
      await setDefaultCustomerAddress(customerId, addr2.id, env.deps);
      list = await getCustomerAddresses(customerId, env.deps);
      const updatedAddr1 = list.find((a) => a.id === addr1.id);
      const updatedAddr2 = list.find((a) => a.id === addr2.id);
      expect(updatedAddr1?.isDefault).toBe(false);
      expect(updatedAddr2?.isDefault).toBe(true);

      // 4. Eliminar dirección
      const deleted = await deleteCustomerAddress(customerId, addr1.id, env.deps);
      expect(deleted).toBe(true);
      list = await getCustomerAddresses(customerId, env.deps);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(addr2.id);
    });
  });

  describe("Vinculación de Órdenes a Clientes y Comercios", () => {
    it("asocia la orden al customerId y comercio predeterminado", async () => {
      // 1. Registrar cliente
      const reg = await registerCustomer(
        {
          name: "Julieta V",
          email: "julieta@aura.com",
          phone: "1198765432",
          password: "password123",
        },
        env.deps
      );
      const customerId = reg.customer!.id;

      // 2. Crear producto para comprar
      const product = await createProduct(
        {
          rawText: "Blazer Lino Crudo $85.000",
          colors: [
            {
              name: "Único",
              position: 0,
              sizes: [{ size: "U", stock: 10 }],
            },
          ],
        },
        env.deps
      );

      // 3. Crear orden vinculando al cliente
      const defaultCommerce = await env.deps.commerceRepo.findDefault();
      expect(defaultCommerce).toBeDefined();

      const orderResult = await createOrder(
        {
          customerId,
          commerceId: defaultCommerce?.id,
          customerName: "Julieta V",
          customerPhone: "1198765432",
          customerEmail: "julieta@aura.com",
          deliveryMethod: "PICKUP",
          items: [
            {
              productId: product.id,
              productCode: product.code,
              productTitle: product.title ?? "Blazer Lino Crudo",
              colorName: "Único",
              size: "U",
              quantity: 1,
              unitPriceCents: 8500000,
            },
          ],
        },
        env.deps
      );

      expect(orderResult.order.customerId).toBe(customerId);
      expect(orderResult.order.commerceId).toBe(defaultCommerce?.id);

      // 4. Consultar historial de pedidos del cliente
      const customerOrders = await getCustomerOrders(customerId, env.deps);
      expect(customerOrders.length).toBe(1);
      expect(customerOrders[0].id).toBe(orderResult.order.id);
      expect(customerOrders[0].customerName).toBe("Julieta V");
    });
  });
});