import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "../src/infra/auth/session";
import { ADMIN_SESSION_COOKIE_NAME } from "../src/infra/auth/guard";
import { getEnv } from "../src/lib/env";
import {
  ADMIN_PRIMARY_NAV_ITEMS,
  getActiveNavGroup,
  isAdminNavItemActive,
  isSubNavItemActive,
} from "../src/components/admin/header/nav-items";

const cookieState = vi.hoisted(() => ({
  token: undefined as string | undefined,
  throwOnCookies: false,
}));

const redirectSpy = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  })
);

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => {
    if (cookieState.throwOnCookies) {
      throw new Error("No request scope");
    }
    return {
      get: (name: string) =>
        name === ADMIN_SESSION_COOKIE_NAME && cookieState.token
          ? { name, value: cookieState.token }
          : undefined,
    };
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectSpy,
}));

vi.mock("../src/infra/db/connection", () => ({
  getProductServiceDeps: () => ({}),
}));

vi.mock("../src/services/settings.service", () => ({
  getShowroomSettings: vi.fn(async () => ({
    showroomName: "Comercio Demo",
    storeType: "Showroom",
    logoUrl: "/api/media/media/brand/logo.webp",
    ordersPaused: false,
    ordersPausedNotice: null,
  })),
}));

vi.mock("../src/services/order.service", () => ({
  getOrdersSummaryCounts: vi.fn(async () => ({
    pending: 4,
  })),
}));

import {
  getAdminSession,
  getAdminShellData,
  requireAdminSession,
} from "../src/infra/auth/dal";

describe("Admin DAL & Single-Source Navigation Rules", () => {
  beforeEach(() => {
    cookieState.token = undefined;
    cookieState.throwOnCookies = false;
    redirectSpy.mockClear();
  });

  describe("Auth DAL (getAdminSession, requireAdminSession, getAdminShellData)", () => {
    it("retorna null en getAdminSession y datos anónimos seguros cuando falta la cookie", async () => {
      const session = await getAdminSession();
      expect(session).toBeNull();

      const shell = await getAdminShellData();
      expect(shell.session).toBeNull();
      expect(shell.pendingOrdersCount).toBe(0);
      expect(shell.brandName).toBeTruthy();
    });

    it("retorna null de forma segura fuera de request scope (cookies() lanza error)", async () => {
      cookieState.throwOnCookies = true;
      const session = await getAdminSession();
      expect(session).toBeNull();
    });

    it("redirige a /admin/login en requireAdminSession cuando no hay sesión válida", async () => {
      await expect(requireAdminSession()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
      expect(redirectSpy).toHaveBeenCalledWith("/admin/login");
    });

    it("verifica sesión firmada y construye AdminShellData hidratada desde el servidor", async () => {
      const env = getEnv();
      cookieState.token = await createSessionToken(
        env.SESSION_SECRET,
        {
          userId: 7,
          email: "owner@example.com",
          role: "SUPER_ADMIN",
        },
        7200 * 1000
      );

      const session = await getAdminSession();
      expect(session).not.toBeNull();
      expect(session?.authenticated).toBe(true);
      expect(session?.email).toBe("owner@example.com");
      expect(session?.role).toBe("SUPER_ADMIN");
      expect(session?.expiresInSeconds).toBeGreaterThan(0);

      const shell = await getAdminShellData();
      expect(shell.session?.authenticated).toBe(true);
      expect(shell.brandName).toBe("Comercio Demo");
      expect(shell.pendingOrdersCount).toBe(4);
      expect(shell.logoUrl).toBe("/api/media/media/brand/logo.webp");
    });
  });

  describe("Admin Navigation Items & Active Matchers", () => {
    it("no conserva rutas legacy eliminadas en el árbol de navegación administrativa", () => {
      const allHrefs = ADMIN_PRIMARY_NAV_ITEMS.flatMap((item) => [
        item.href,
        ...(item.matchPrefix ?? []),
        ...(item.subItems?.flatMap((sub) => [sub.href, ...(sub.matchPrefix ?? [])]) ?? []),
      ]);

      expect(allHrefs).toContain("/admin/tienda/politicas");
      expect(allHrefs).not.toContain("/admin/configuracion");
      expect(allHrefs).not.toContain("/admin/tienda/personalizacion");
      expect(allHrefs).not.toContain("/admin/tienda/contenido");
    });

    it("resuelve grupo activo y subítems activos correctamente", () => {
      expect(getActiveNavGroup("/admin")?.id).toBe("dashboard");
      expect(getActiveNavGroup("/admin/ordenes/42")?.id).toBe("orders");
      expect(getActiveNavGroup("/admin/productos/atributos")?.id).toBe("catalog");
      expect(getActiveNavGroup("/admin/tienda/politicas")?.id).toBe("store");

      const storeGroup = ADMIN_PRIMARY_NAV_ITEMS.find((i) => i.id === "store")!;
      const policiesSub = storeGroup.subItems!.find(
        (s) => s.href === "/admin/tienda/politicas"
      )!;
      expect(isSubNavItemActive("/admin/tienda/politicas", policiesSub)).toBe(true);
      expect(isSubNavItemActive("/admin/tienda/negocio", policiesSub)).toBe(false);

      const dashboard = ADMIN_PRIMARY_NAV_ITEMS.find((i) => i.id === "dashboard")!;
      expect(isAdminNavItemActive("/admin", dashboard)).toBe(true);
      expect(isAdminNavItemActive("/admin/ordenes", dashboard)).toBe(false);
    });
  });
});
