import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { NextRequest } from "next/server";
import { GET as sessionGetHandler } from "../src/app/api/admin/session/route";
import { POST as sessionRefreshHandler } from "../src/app/api/admin/session/refresh/route";
import { createSessionToken } from "../src/infra/auth/session";
import { getEnv } from "../src/lib/env";
import AdminLayout from "../src/app/admin/layout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Supervisión y Renovación de Sesión en 1 Clic (BR-10, BR-37, AR-11)", () => {
  const env = getEnv();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/session", () => {
    it("registra log y responde desautenticado cuando no hay cookie de sesión", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const req = new NextRequest("http://localhost:3000/api/admin/session", {
        headers: { "x-forwarded-for": "192.168.1.10" },
      });

      const res = await sessionGetHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.authenticated).toBe(false);
      expect(data.expiresInSeconds).toBe(0);
      expect(data.reason).toBe("missing_token");
      expect(data.sessionDurationHours).toBe(2);

      expect(warnSpy).toHaveBeenCalled();
      const warnCalls = warnSpy.mock.calls.flat().join(" ");
      expect(warnCalls).toContain("[AUTH]");
      expect(warnCalls).toContain("desautenticado");
    });

    it("informa sesión válida y segundos restantes cuando el token está activo", async () => {
      const token = await createSessionToken(
        env.SESSION_SECRET,
        { email: "admin@aurastudio.com", role: "SUPER_ADMIN" },
        7200 * 1000 // 2 horas
      );

      const req = new NextRequest("http://localhost:3000/api/admin/session");
      req.cookies.set("aura_admin_token", token);

      const res = await sessionGetHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.expiresInSeconds).toBeGreaterThan(7000);
      expect(data.sessionDurationHours).toBe(2);
      expect(data.user.email).toBe("admin@aurastudio.com");
    });

    it("registra log y reporta sesión expirada cuando exp <= now", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Token creado con expiración en el pasado
      const pastToken = await createSessionToken(
        env.SESSION_SECRET,
        { email: "admin@aurastudio.com" },
        -1000 // ya expirado
      );

      const req = new NextRequest("http://localhost:3000/api/admin/session");
      req.cookies.set("aura_admin_token", pastToken);

      const res = await sessionGetHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.authenticated).toBe(false);
      expect(data.expiresInSeconds).toBe(0);
      expect(data.reason).toBe("token_expired");

      expect(warnSpy).toHaveBeenCalled();
      const warnCalls = warnSpy.mock.calls.flat().join(" ");
      expect(warnCalls).toContain("[AUTH]");
      expect(warnCalls).toContain("expirada");
    });
  });

  describe("POST /api/admin/session/refresh", () => {
    it("renueva la sesión en 1 clic generando nueva cookie por 2 horas más y registrando auditoría", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const activeToken = await createSessionToken(
        env.SESSION_SECRET,
        { userId: 1, email: "admin@aurastudio.com", role: "SUPER_ADMIN" },
        1800 * 1000 // media hora restante
      );

      const req = new NextRequest("http://localhost:3000/api/admin/session/refresh", {
        method: "POST",
      });
      req.cookies.set("aura_admin_token", activeToken);

      const res = await sessionRefreshHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.expiresInSeconds).toBe(7200);
      expect(data.message).toContain("2 horas");

      // Verifica la cookie devuelta
      const setCookie = res.cookies.get("aura_admin_token");
      expect(setCookie).toBeDefined();
      expect(setCookie?.maxAge).toBe(7200);
      expect(setCookie?.httpOnly).toBe(true);

      // Auditoría en logs
      expect(infoSpy).toHaveBeenCalled();
      const infoCalls = infoSpy.mock.calls.flat().join(" ");
      expect(infoCalls).toContain("[AUTH]");
      expect(infoCalls).toContain("renovada en 1 clic");
      expect(infoCalls).toContain("admin@aurastudio.com");
    });

    it("rechaza la renovación si no se envía token con status 401 y log de seguridad", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const req = new NextRequest("http://localhost:3000/api/admin/session/refresh", {
        method: "POST",
      });

      const res = await sessionRefreshHandler(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.ok).toBe(false);

      expect(warnSpy).toHaveBeenCalled();
    });

    it("rechaza renovación si la sesión ya expiró completamente", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const expiredToken = await createSessionToken(
        env.SESSION_SECRET,
        { email: "admin@aurastudio.com" },
        -5000
      );

      const req = new NextRequest("http://localhost:3000/api/admin/session/refresh", {
        method: "POST",
      });
      req.cookies.set("aura_admin_token", expiredToken);

      const res = await sessionRefreshHandler(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.error).toContain("expirado");

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("AdminLayout (Montaje de AdminSessionMonitor)", () => {
    it("incluye el monitor de sesión dentro de la estructura principal del backoffice", () => {
      const html = renderToString(
        React.createElement(AdminLayout, null, React.createElement("div", null, "Panel"))
      );

      expect(html).toContain('id="admin-layout-root"');
      expect(html).toContain("Panel");
    });
  });
});
