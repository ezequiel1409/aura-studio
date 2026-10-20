import { describe, expect, it, beforeEach } from "vitest";
import { DEFAULT_ARGENTINE_BANKS } from "../src/domain/promotion/default-banks";
import { ADMIN_PRIMARY_NAV_ITEMS } from "../src/components/admin/header/nav-items";
import { createTestEnvironment } from "./setup-db";
import {
  listAttributeDefinitions,
  upsertAttributeDefinition,
  deleteAttributeDefinition,
} from "../src/services/navigation.service";
import {
  getShowroomSettings,
  updateShowroomSettings,
} from "../src/services/settings.service";

describe("SOLID Atributos, Promociones y Configuración de Tienda", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  describe("Atributos de Rubro (SOLID - Single Responsibility Principle)", () => {
    it("permite dar de alta, listar y eliminar atributos de rubro de forma independiente", async () => {
      const { deps } = env;

      // 1. Alta de atributo "Para"
      const created = await upsertAttributeDefinition(
        {
          name: "Para",
          slug: "para",
          label: "Para",
          options: ["Mujer", "Hombre", "Unisex", "Niño"],
          isFilterable: true,
          position: 1,
        },
        deps
      );

      expect(created.id).toBeGreaterThan(0);
      expect(created.name).toBe("Para");
      expect(created.slug).toBe("para");
      expect(created.options).toEqual(["Mujer", "Hombre", "Unisex", "Niño"]);
      expect(created.isFilterable).toBe(true);

      // 2. Listado de atributos
      const all = await listAttributeDefinitions(deps);
      expect(all.length).toBeGreaterThanOrEqual(1);
      const found = all.find((a) => a.slug === "para");
      expect(found).toBeDefined();
      expect(found?.label).toBe("Para");

      // 3. Eliminación
      await deleteAttributeDefinition(created.id, deps);
      const afterDelete = await listAttributeDefinitions(deps);
      expect(afterDelete.some((a) => a.id === created.id)).toBe(false);
    });
  });

  describe("Catálogo Extendido de Bancos y Billeteras de Argentina", () => {
    it("incluye al menos 16 entidades financieras y billeteras reconocidas con colores de marca", () => {
      expect(DEFAULT_ARGENTINE_BANKS.length).toBeGreaterThanOrEqual(16);

      const slugs = DEFAULT_ARGENTINE_BANKS.map((b) => b.slug);
      expect(slugs).toContain("banco-galicia");
      expect(slugs).toContain("banco-santander");
      expect(slugs).toContain("banco-bbva");
      expect(slugs).toContain("banco-macro");
      expect(slugs).toContain("banco-nacion");
      expect(slugs).toContain("banco-provincia");
      expect(slugs).toContain("banco-ciudad");
      expect(slugs).toContain("banco-credicoop");
      expect(slugs).toContain("icbc");
      expect(slugs).toContain("brubank");
      expect(slugs).toContain("mercado-pago");
      expect(slugs).toContain("uala");
      expect(slugs).toContain("cuenta-dni");
      expect(slugs).toContain("modo");
      expect(slugs).toContain("personal-pay");
      expect(slugs).toContain("naranja-x");

      // Cada banco tiene un color de marca definido
      for (const bank of DEFAULT_ARGENTINE_BANKS) {
        expect(bank.brandColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it("deps.promotionRepo auto-popula los bancos predeterminados si la tabla está vacía", async () => {
      const { deps } = env;
      const banks = await deps.promotionRepo.listBanks();
      expect(banks.length).toBeGreaterThanOrEqual(16);
      expect(banks.some((b) => b.name === "Mercado Pago")).toBe(true);
      expect(banks.some((b) => b.name === "Banco Galicia")).toBe(true);
    });
  });

  describe("Configuración de Tienda y Negocio sin 405", () => {
    it("guarda y recupera aboutText, businessVertical y businessDescriptor", async () => {
      const { deps } = env;

      const updated = await updateShowroomSettings(
        {
          showroomName: "Aura Studio Alta Costura",
          businessVertical: "indumentaria",
          businessDescriptor: "Prendas de autor y accesorios",
          aboutText: "Espacio boutique en Recoleta dedicado a prendas atemporales.",
        },
        deps
      );

      expect(updated.showroomName).toBe("Aura Studio Alta Costura");
      expect(updated.businessVertical).toBe("indumentaria");
      expect(updated.businessDescriptor).toBe("Prendas de autor y accesorios");
      expect(updated.aboutText).toBe("Espacio boutique en Recoleta dedicado a prendas atemporales.");

      const fetched = await getShowroomSettings(deps);
      expect(fetched.showroomName).toBe("Aura Studio Alta Costura");
      expect(fetched.aboutText).toBe("Espacio boutique en Recoleta dedicado a prendas atemporales.");
    });
  });

  describe("Navegación Unificada del Panel de Administración", () => {
    it("unifica Tienda y Configuración y asigna a Medios de Pago su propio apartado", () => {
      // 1. Áreas principales limpias
      const primaryLabels = ADMIN_PRIMARY_NAV_ITEMS.map((item) => item.label);
      expect(primaryLabels).toContain("Inicio");
      expect(primaryLabels).toContain("Pedidos");
      expect(primaryLabels).toContain("Productos");
      expect(primaryLabels).toContain("Configuración de la Tienda");

      // Tienda y Configuración están unificadas (no hay 2 áreas separadas)
      const storeItem = ADMIN_PRIMARY_NAV_ITEMS.find((item) => item.id === "store");
      expect(storeItem).toBeDefined();
      expect(storeItem?.matchPrefix).toContain("/admin/tienda");
      expect(storeItem?.matchPrefix).toContain("/admin/configuracion");

      // 2. Medios de pago tiene su propio apartado dedicado
      const subItems = storeItem?.subItems || [];
      const paymentSubItem = subItems.find((s) => s.href === "/admin/tienda/pagos");
      expect(paymentSubItem).toBeDefined();
      expect(paymentSubItem?.label).toBe("Medios de pago");

      // 3. Promociones y Descuentos agrupados bajo Productos
      const catalogItem = ADMIN_PRIMARY_NAV_ITEMS.find((item) => item.id === "catalog");
      expect(catalogItem).toBeDefined();
      const catalogSubItems = catalogItem?.subItems || [];
      expect(catalogSubItems.some((s) => s.href === "/admin/promociones")).toBe(true);
      expect(catalogSubItems.some((s) => s.href === "/admin/descuentos")).toBe(true);
    });
  });
});

