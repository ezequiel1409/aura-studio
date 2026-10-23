import { describe, it, expect, vi } from "vitest";
import { logger, maskEmail, maskDni, sanitizeContext } from "../src/lib/logger";

describe("Logger & Observability (Zero-PII & Structured JSON)", () => {
  it("enmascara correctamente correos electrónicos para no exponer PII", () => {
    expect(maskEmail("valentina@aura.com")).toBe("v***a@aura.com");
    expect(maskEmail("ab@test.com")).toBe("*@test.com");
    expect(maskEmail("")).toBe("***");
  });

  it("enmascara números de DNI para soporte seguro", () => {
    expect(maskDni("12345678")).toBe("***5678");
    expect(maskDni(40123456)).toBe("***3456");
    expect(maskDni("123")).toBe("****");
  });

  it("redacta llaves sensibles automáticamente en el contexto", () => {
    const rawContext = {
      orderId: 105,
      password: "secret_password_123",
      token: "jwt_token_xyz",
      creditCard: "4500-1234-5678-9012",
      cvv: "123",
      email: "cliente@dominio.com",
      dni: "38999888",
      items: [{ id: 1 }, { id: 2 }],
      customer: { id: 4, name: "Valentina", phone: "+5491112345678" },
      durationMs: 42,
    };

    const sanitized = sanitizeContext(rawContext);

    expect(sanitized.orderId).toBe(105);
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.token).toBe("[REDACTED]");
    expect(sanitized.creditCard).toBe("[REDACTED]");
    expect(sanitized.cvv).toBe("[REDACTED]");
    expect(sanitized.email).toBe("c***e@dominio.com");
    expect(sanitized.dni).toBe("***9888");
    expect(sanitized.items).toBe("[Array(2)]");
    expect(sanitized.customer).toEqual({ id: 4, name: "Valentina" });
    expect(sanitized.durationMs).toBe(42);
  });

  it("emite logs estructurados parseables en JSON con formato y niveles correctos", () => {
    const spyLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spyError = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.info("ORDER:CREATED", "Orden generada", { orderId: 99, totalCents: 50000 });
    expect(spyLog).toHaveBeenCalledTimes(1);
    const parsedLog = JSON.parse(spyLog.mock.calls[0][0]);
    expect(parsedLog.level).toBe("INFO");
    expect(parsedLog.tag).toBe("ORDER:CREATED");
    expect(parsedLog.orderId).toBe(99);
    expect(parsedLog.totalCents).toBe(50000);
    expect(parsedLog.timestamp).toBeDefined();

    logger.warn("CHECKOUT:STOCK", "Stock bajo", { productCode: 4, reason: "LOW_STOCK" });
    expect(spyWarn).toHaveBeenCalledTimes(1);
    const parsedWarn = JSON.parse(spyWarn.mock.calls[0][0]);
    expect(parsedWarn.level).toBe("WARN");
    expect(parsedWarn.productCode).toBe(4);

    const testError = new Error("D1 connection timeout");
    logger.error("DB:ERROR", "Fallo al consultar base", testError, { orderId: 99 });
    expect(spyError).toHaveBeenCalledTimes(1);
    const parsedError = JSON.parse(spyError.mock.calls[0][0]);
    expect(parsedError.level).toBe("ERROR");
    expect(parsedError.errorMessage).toBe("D1 connection timeout");
    expect(parsedError.orderId).toBe(99);

    spyLog.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });
});

