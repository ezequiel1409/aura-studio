import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  ADMIN_CHANGELOG_RELEASES,
  getAcknowledgedReleaseIds,
  acknowledgeRelease,
  acknowledgeAllReleases,
  getUnreadReleasesCount,
  hasUnreadReleases,
} from "../src/lib/changelog/releases";
import { AdminWhatsNewModal } from "../src/components/admin/onboarding/AdminWhatsNewModal";
import { AdminWhatsNewBanner } from "../src/components/admin/onboarding/AdminWhatsNewBanner";
import { AdminWhatsNewTrigger } from "../src/components/admin/onboarding/AdminWhatsNewTrigger";

// Mock de window y localStorage para el entorno de test en Node
const storage = new Map<string, string>();
const eventTarget = new EventTarget();

(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
  dispatchEvent: (event: Event) => eventTarget.dispatchEvent(event),
  addEventListener: (type: string, listener: any) =>
    eventTarget.addEventListener(type, listener),
  removeEventListener: (type: string, listener: any) =>
    eventTarget.removeEventListener(type, listener),
};

describe("Catálogo Mandatorio de Novedades e Integraciones (What's New)", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("el catálogo contiene la entrada de la nueva división de navegación y portada", () => {
    expect(ADMIN_CHANGELOG_RELEASES.length).toBeGreaterThan(0);
    const navRelease = ADMIN_CHANGELOG_RELEASES.find(
      (r) => r.id === "2026-10-navbar-and-home-sections"
    );
    expect(navRelease).toBeDefined();
    expect(navRelease?.title).toContain("Navbar");
    expect(navRelease?.category).toBe("Diseño y Personalización");
    expect(navRelease?.before.title).toBeDefined();
    expect(navRelease?.now.title).toBeDefined();
    expect(navRelease?.before.points?.length).toBeGreaterThan(0);
    expect(navRelease?.now.points?.length).toBeGreaterThan(0);
    expect(navRelease?.actionHref).toBe("/admin/tienda/portada");
  });

  it("inicia sin novedades comprendidas para un usuario nuevo", () => {
    const userId = 101;
    expect(getAcknowledgedReleaseIds(userId)).toEqual([]);
    expect(hasUnreadReleases(userId)).toBe(true);
    expect(getUnreadReleasesCount(userId)).toBe(ADMIN_CHANGELOG_RELEASES.length);
  });

  it("marca una novedad individual como entendida para el usuario específico", () => {
    const userA = 101;
    const userB = 202;
    const targetReleaseId = "2026-10-navbar-and-home-sections";

    // Usuario A marca como entendido
    acknowledgeRelease(targetReleaseId, userA);

    expect(getAcknowledgedReleaseIds(userA)).toContain(targetReleaseId);
    expect(getUnreadReleasesCount(userA)).toBe(ADMIN_CHANGELOG_RELEASES.length - 1);
    

    // Usuario B no se ve afectado (aislamiento por usuario)
    expect(getAcknowledgedReleaseIds(userB)).toEqual([]);
    expect(hasUnreadReleases(userB)).toBe(true);
  });

  it("permite marcar todas las novedades como entendidas de una sola vez", () => {
    const userId = 303;
    expect(hasUnreadReleases(userId)).toBe(true);

    acknowledgeAllReleases(userId);

    const acks = getAcknowledgedReleaseIds(userId);
    expect(acks.length).toBe(ADMIN_CHANGELOG_RELEASES.length);
    expect(getUnreadReleasesCount(userId)).toBe(0);
    expect(hasUnreadReleases(userId)).toBe(false);
  });

  it("tolera almacenamiento corrupto o nulo de forma resiliente", () => {
    const userId = 404;
    storage.set("app_ack_releases_404", "invalid json {{");
    expect(getAcknowledgedReleaseIds(userId)).toEqual([]);
    expect(hasUnreadReleases(userId)).toBe(true);
  });

  it("dispara evento personalizado app_changelog_updated al marcar como leído", () => {
    const userId = 505;
    const listener = vi.fn();
    window.addEventListener("app_changelog_updated", listener);

    acknowledgeRelease("2026-10-navbar-and-home-sections", userId);

    expect(listener).toHaveBeenCalled();
    window.removeEventListener("app_changelog_updated", listener);
  });

  describe("Componentes de UI de Novedades e Integraciones", () => {
    it("AdminWhatsNewModal renderiza el diálogo con títulos y tarjetas Antes vs Ahora", () => {
      const html = renderToString(
        React.createElement(AdminWhatsNewModal, {
          isOpen: true,
          onClose: () => {},
          userId: 999,
        })
      );

      expect(html).toContain("Centro de Novedades e Integraciones");
      expect(html).toContain("¿Cómo funcionaba anteriormente?");
      expect(html).toContain("¿Cómo se gestiona ahora?");
      expect(html).toContain("Ya lo entendí");
      expect(html).toContain(ADMIN_CHANGELOG_RELEASES[0].actionLabel);
    });

    it("AdminWhatsNewModal no renderiza nada si isOpen es false", () => {
      const html = renderToString(
        React.createElement(AdminWhatsNewModal, {
          isOpen: false,
          onClose: () => {},
          userId: 999,
        })
      );

      expect(html).toBe("");
    });

    it("AdminWhatsNewBanner renderiza el aviso con clases semánticas accesibles de degradado y contraste", () => {
      const html = renderToString(
        React.createElement(AdminWhatsNewBanner, {
          userId: 888,
        })
      );

      expect(html).toContain("admin-whats-new-banner");
      expect(html).toContain("banner-pill-badge");
      expect(html).toContain("banner-title");
      expect(html).toContain("banner-summary");
      expect(html).toContain("banner-primary-btn");
      expect(html).toContain("banner-ack-btn");
      expect(html).toContain("Nueva Actualización");
      expect(html).toContain("Ver cambios (Antes vs Ahora)");
      expect(html).toContain("Ya lo entendí");
    });

    it("AdminWhatsNewTrigger renderiza el botón de acceso y badge", () => {
      const html = renderToString(
        React.createElement(AdminWhatsNewTrigger, {
          userId: 777,
          variant: "button",
        })
      );

      expect(html).toContain("Novedades");
    });

    it("globals.css define estilos accesibles para el banner en modo claro y oscuro", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const css = fs.readFileSync(path.resolve(__dirname, "../src/app/globals.css"), "utf-8");

      expect(css).toContain(".admin-whats-new-banner");
      expect(css).toContain('#admin-layout-root[data-theme="light"] .admin-whats-new-banner');
      expect(css).toContain('#admin-layout-root[data-theme="dark"] .admin-whats-new-banner');
      expect(css).toContain(".banner-title");
      expect(css).toContain(".banner-summary");
      expect(css).toContain(".banner-primary-btn");
      expect(css).toContain(".banner-ack-btn");
    });
  });
});
