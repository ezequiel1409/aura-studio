import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { NextRequest } from "next/server";
import { Header } from "../src/components/layout/Header";
import { FeaturedSectionsMosaic } from "../src/components/home/FeaturedSectionsMosaic";
import { ADMIN_PRIMARY_NAV_ITEMS } from "../src/components/admin/header/nav-items";
import { NavbarSettingsManager } from "../src/components/admin/settings/NavbarSettingsManager";
import { HomeSectionsManager } from "../src/components/admin/settings/HomeSectionsManager";
import { NavigationSection } from "../src/domain/navigation/types";
import { DEFAULT_NAVBAR_CONFIG, NavbarConfig } from "../src/services/settings.service";
import { listHomeSections } from "../src/services/navigation.service";
import {
  GET as getSectionsHandler,
  POST as postSectionsHandler,
  PUT as putSectionsHandler,
  DELETE as deleteSectionsHandler,
} from "../src/app/api/admin/sections/route";
import {
  GET as getNavHandler,
  PUT as putNavHandler,
} from "../src/app/api/admin/nav/route";
import { createSessionToken } from "../src/infra/auth/session";
import { ADMIN_SESSION_COOKIE_NAME } from "../src/infra/auth/guard";
import { getEnv } from "../src/lib/env";
import { setGlobalAppDepsForTesting } from "../src/infra/db/connection";
import { createTestEnvironment } from "./setup-db";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Mejora de Navegación y Personalización de Tienda (Navbar & Secciones)", () => {
  const mockSections: NavigationSection[] = [
    {
      id: 1,
      name: "COLECCIÓN SEAMLESS",
      slug: "coleccion-seamless",
      ruleType: "FEATURED",
      ruleConfig: { layout: "1_col", subtitle: "Prendas de alta compresión" },
      accentColor: null,
      bannerImageUrl: "https://example.com/banner-seamless.jpg",
      coverImageUrl: "https://example.com/banner-seamless.jpg",
      showInHomeMosaic: true,
      layout: "1_col",
      subtitle: "Prendas de alta compresión",
      targetUrl: "/catalogo?categoria=seamless",
      position: 1,
      isVisible: true,
      productCount: 8,
    },
    {
      id: 2,
      name: "REMERAS Y TOPS",
      slug: "remeras-y-tops",
      ruleType: "ATTRIBUTE",
      ruleConfig: { layout: "2_col" },
      accentColor: "#926a3c",
      bannerImageUrl: null,
      coverImageUrl: null,
      showInHomeMosaic: true,
      layout: "2_col",
      targetUrl: null,
      position: 2,
      isVisible: true,
      productCount: 14,
    },
    {
      id: 3,
      name: "RECIÉN LLEGADOS",
      slug: "recien-llegados",
      ruleType: "RECENCY",
      ruleConfig: { layout: "3_col" },
      accentColor: null,
      bannerImageUrl: null,
      coverImageUrl: null,
      showInHomeMosaic: true,
      layout: "3_col",
      position: 3,
      isVisible: true,
    },
    {
      id: 4,
      name: "SALE",
      slug: "sale",
      ruleType: "SALE",
      ruleConfig: { layout: "4_col" },
      accentColor: null,
      bannerImageUrl: null,
      coverImageUrl: null,
      showInHomeMosaic: true,
      layout: "4_col",
      position: 4,
      isVisible: true,
    },
  ];

  describe("Header: Navbar Switch, Alineación y Enlaces", () => {
    it("si la navbar está desactivada (enabled: false), no renderiza la barra de navegación ni el botón de menú móvil", () => {
      const disabledNavbar: NavbarConfig = {
        enabled: false,
        alignment: "left",
        items: [],
      };

      const html = renderToString(
        React.createElement(Header, {
          brandName: "Mi Tienda",
          navbarConfig: disabledNavbar,
          sections: mockSections,
        })
      );

      // No debe contener la etiqueta <nav aria-label="Secciones principales de la tienda">
      expect(html).not.toContain('aria-label="Secciones principales de la tienda"');
      // No debe contener el botón móvil de menú de secciones
      expect(html).not.toContain('aria-label="Abrir menú de secciones"');
      // Pero sí conserva la marca, el buscador y las acciones
      expect(html).toContain("Mi Tienda");
      expect(html).toContain('role="search"');
    });

    it("si la navbar está activada con alineación centrado, renderiza el nav centrado", () => {
      const centeredNavbar: NavbarConfig = {
        enabled: true,
        alignment: "center",
        items: [
          { id: "1", label: "TOPS", href: "/tops", position: 1 },
          { id: "2", label: "PANTALONES", href: "/pantalones", position: 2 },
        ],
      };

      const html = renderToString(
        React.createElement(Header, {
          brandName: "Mi Tienda",
          navbarConfig: centeredNavbar,
          sections: mockSections,
        })
      );

      expect(html).toContain('aria-label="Secciones principales de la tienda"');
      expect(html).toContain("justify-center");
      expect(html).toContain("TOPS");
      expect(html).toContain("PANTALONES");
    });

    it("si la navbar está configurada en segunda fila (second_row), renderiza la barra dedicada inferior con colores personalizados", () => {
      const secondRowNavbar: NavbarConfig = {
        enabled: true,
        alignment: "second_row",
        items: [
          { id: "1", label: "VERANO 2026", href: "/verano", position: 1 },
        ],
        secondRowBgColor: "#18181b",
        secondRowTextColor: "#ffffff",
      };

      const html = renderToString(
        React.createElement(Header, {
          brandName: "Mi Tienda",
          navbarConfig: secondRowNavbar,
          sections: mockSections,
        })
      );

      expect(html).toContain("VERANO 2026");
      expect(html).toContain("border-t border-[#e7e2da]");
      expect(html).toContain("background-color:#18181b");
      expect(html).toContain("color:#ffffff");
    });

    it("el enlace de MUJER en la navbar conserva el botón desplegable (dropdown) y contiene secciones y categorías", () => {
      const navbarWithWomen: NavbarConfig = {
        enabled: true,
        alignment: "left",
        items: [
          { id: "nav-mujer", label: "MUJER", href: "/mujer", position: 1 },
          { id: "nav-sale", label: "SALE", href: "/sale", isSale: true, position: 2 },
        ],
      };

      const categories = [
        { id: 1, name: "Remeras y Tops", slug: "remeras-y-tops", position: 1, isHidden: false },
        { id: 2, name: "Pantalones", slug: "pantalones", position: 2, isHidden: false },
      ];

      const html = renderToString(
        React.createElement(Header, {
          brandName: "Mi Tienda",
          navbarConfig: navbarWithWomen,
          sections: mockSections,
          categories: categories as any,
        })
      );

      // Debe incluir el botón para desplegar el submenú de MUJER
      expect(html).toContain('aria-label="Subcategorías de MUJER"');
      // Debe incluir el enlace a MUJER
      expect(html).toContain("MUJER");
    });

    it("el enlace con subItems configurados por el usuario activa el botón desplegable de subcategorías", () => {
      const customNavbar: NavbarConfig = {
        enabled: true,
        alignment: "left",
        items: [
          {
            id: "nav-outfits",
            label: "OUTFITS",
            href: "/outfits",
            position: 1,
            subItems: [
              { id: "sub-1", label: "CONJUNTOS SEAMLESS", href: "/catalogo?categoria=seamless" },
              { id: "sub-2", label: "REMERAS Y TOPS", href: "/catalogo?categoria=remeras-y-tops" },
            ],
          },
        ],
      };

      const html = renderToString(
        React.createElement(Header, {
          brandName: "Mi Tienda",
          navbarConfig: customNavbar,
          sections: mockSections,
        })
      );

      expect(html).toContain("OUTFITS");
      expect(html).toContain('aria-label="Subcategorías de OUTFITS"');
    });
  });

  describe("FeaturedSectionsMosaic: Formato de Columnas (1, 2, 3 o 4 columnas)", () => {
    it("asigna clases de ancho completo (col-span-12) para secciones de 1 columna", () => {
      const html = renderToString(
        React.createElement(FeaturedSectionsMosaic, {
          sections: [mockSections[0]],
        })
      );

      expect(html).toContain("col-span-12");
      expect(html).toContain("COLECCIÓN SEAMLESS");
      expect(html).toContain("Prendas de alta compresión");
      expect(html).toContain('href="/catalogo?categoria=seamless"');
    });

    it("asigna clases de grilla 2 columnas (sm:col-span-6) para secciones 2_col", () => {
      const html = renderToString(
        React.createElement(FeaturedSectionsMosaic, {
          sections: [mockSections[1]],
        })
      );

      expect(html).toContain("col-span-12 sm:col-span-6");
      expect(html).toContain("REMERAS Y TOPS");
    });

    it("asigna clases de grilla 3 columnas (lg:col-span-4) para secciones 3_col", () => {
      const html = renderToString(
        React.createElement(FeaturedSectionsMosaic, {
          sections: [mockSections[2]],
        })
      );

      expect(html).toContain("lg:col-span-4");
      expect(html).toContain("RECIÉN LLEGADOS");
    });

    it("asigna clases de grilla 4 columnas (lg:col-span-3) para secciones 4_col", () => {
      const html = renderToString(
        React.createElement(FeaturedSectionsMosaic, {
          sections: [mockSections[3]],
        })
      );

      expect(html).toContain("lg:col-span-3");
      expect(html).toContain("SALE");
    });

    it("por defecto la sección en el mosaico NO menciona la cantidad de piezas ni productos", () => {
      // mockSections[0] tiene productCount: 8, pero no tiene showProductCount: true
      const html = renderToString(
        React.createElement(FeaturedSectionsMosaic, {
          sections: [mockSections[0]],
        })
      );

      expect(html).not.toContain("piezas");
      expect(html).not.toContain("8 piezas");
      expect(html).toContain("COLECCIÓN SEAMLESS");
    });

    it("si la sección tiene showProductCount: true, sí menciona la cantidad de piezas", () => {
      const sectionWithCount: NavigationSection = {
        ...mockSections[0],
        showProductCount: true,
        productCount: 15,
      };

      const html = renderToString(
        React.createElement(FeaturedSectionsMosaic, {
          sections: [sectionWithCount],
        })
      );

      expect(html).toContain("15 piezas");
    });
  });

  describe("Reorganización del Panel de Admin y Navegación", () => {
    it("ADMIN_PRIMARY_NAV_ITEMS incluye 'Atributos y Filtros' bajo Productos", () => {
      const catalogNav = ADMIN_PRIMARY_NAV_ITEMS.find((item) => item.id === "catalog");
      expect(catalogNav).toBeDefined();

      const attrItem = catalogNav?.subItems?.find(
        (sub) => sub.href === "/admin/productos/atributos"
      );
      expect(attrItem).toBeDefined();
      expect(attrItem?.label).toBe("Atributos y Filtros");
    });

    it("ADMIN_PRIMARY_NAV_ITEMS incluye 'Diseño y Personalización' bajo Tienda", () => {
      const storeNav = ADMIN_PRIMARY_NAV_ITEMS.find((item) => item.id === "store");
      expect(storeNav).toBeDefined();

      const portadaItem = storeNav?.subItems?.find(
        (sub) => sub.href === "/admin/tienda/portada"
      );
      expect(portadaItem).toBeDefined();
      expect(portadaItem?.label).toBe("Diseño y Personalización");
    });

    it("NavbarSettingsManager renderiza switch de activación y selector de alineación", () => {
      const html = renderToString(
        React.createElement(NavbarSettingsManager, {
          config: DEFAULT_NAVBAR_CONFIG,
          onChange: vi.fn(),
        })
      );

      expect(html).toContain("Barra de Navegación en Tienda (Navbar)");
      expect(html).toContain("Posicionamiento y Alineación en la Cabecera");
      expect(html).toContain("Junto al Logo (Izquierda)");
      expect(html).toContain("Centrado");
      expect(html).toContain("A la Derecha");
      expect(html).toContain("Segunda Fila Dedicada");
      // Switch encendido en color verde esmeralda
      expect(html).toContain("bg-emerald-500");
      expect(html).toContain("Navbar Visible");
    });

    it("el switch de activación se muestra en color rojo cuando la navbar está apagada", () => {
      const disabledConfig: NavbarConfig = {
        enabled: false,
        alignment: "center",
        items: DEFAULT_NAVBAR_CONFIG.items,
      };

      const html = renderToString(
        React.createElement(NavbarSettingsManager, {
          config: disabledConfig,
          onChange: vi.fn(),
        })
      );

      // Switch apagado en color rojo
      expect(html).toContain("bg-rose-600");
      expect(html).toContain("Navbar Oculta (Apagada)");
    });

    it("cuando la navbar está apagada (enabled: false), las secciones de Alineación y Enlaces se muestran grisadas y deshabilitadas", () => {
      const disabledConfig: NavbarConfig = {
        enabled: false,
        alignment: "center",
        items: DEFAULT_NAVBAR_CONFIG.items,
      };

      const html = renderToString(
        React.createElement(NavbarSettingsManager, {
          config: disabledConfig,
          onChange: vi.fn(),
        })
      );

      // Ambas secciones siguen visibles en el DOM
      expect(html).toContain("Posicionamiento y Alineación en la Cabecera");
      expect(html).toContain("Enlaces y Orden de la Barra");
      // Contienen las clases de aspecto grisado y deshabilitado
      expect(html).toContain("opacity-45 grayscale pointer-events-none select-none");
      expect(html).toContain("Pausado (Navbar apagada)");
      expect(html).toContain("aria-disabled=\"true\"");
    });

    it("NavbarSettingsManager renderiza el botón de Subsecciones con el conteo correspondiente para cada ítem", () => {
      const configWithSubItems: NavbarConfig = {
        enabled: true,
        alignment: "left",
        items: [
          {
            id: "nav-1",
            label: "MUJER",
            href: "/mujer",
            position: 1,
            subItems: [
              { id: "sub-1", label: "TOPS", href: "/mujer?categoria=tops" },
              { id: "sub-2", label: "PANTALONES", href: "/mujer?categoria=calzas" },
            ],
          },
          {
            id: "nav-2",
            label: "SALE",
            href: "/sale",
            position: 2,
          },
        ],
      };

      const html = renderToString(
        React.createElement(NavbarSettingsManager, {
          config: configWithSubItems,
          onChange: vi.fn(),
          categories: [
            { id: 1, name: "Pantalones", slug: "remeras-y-tops", position: 1, isHidden: false },
            { id: 2, name: "Tops", slug: "pantalones", position: 2, isHidden: false },
          ] as any,
          sections: mockSections,
        })
      );

      expect(html).toContain("Subsecciones (2)");
      expect(html).toContain("Subsecciones (0)");
      expect(html).toContain("MUJER");
      expect(html).toContain("SALE");
    });

    it("HomeSectionsManager renderiza opciones de layout para secciones de la home", () => {
      const html = renderToString(
        React.createElement(HomeSectionsManager, {
          sections: mockSections,
          onSectionsChange: vi.fn(),
        })
      );

      expect(html).toContain("Secciones y Banners de la Home");
      expect(html).toContain("COLECCIÓN SEAMLESS");
      expect(html).toContain("1 Col (Ancho Completo)");
      expect(html).toContain("2 Columnas");
      expect(html).toContain("Sin piezas");
    });

    it("listHomeSections incluye todas las secciones visibles de portada sin descartar aquellas con 0 productos", async () => {
      const mockNavRepo = {
        listSections: vi.fn().mockResolvedValue([
          {
            id: 1,
            name: "BANNER PRINCIPAL",
            slug: "banner-principal",
            ruleType: "ATTRIBUTE" as const,
            ruleConfig: { layout: "1_col" },
            accentColor: null,
            coverImageUrl: "https://example.com/banner.jpg",
            bannerImageUrl: "https://example.com/banner.jpg",
            showInHomeMosaic: true,
            layout: "1_col" as const,
            position: 1,
            isVisible: true,
          },
          {
            id: 2,
            name: "COLECCIÓN OTOÑO",
            slug: "coleccion-otono",
            ruleType: "FEATURED" as const,
            ruleConfig: { layout: "2_col" },
            accentColor: null,
            coverImageUrl: null,
            bannerImageUrl: null,
            showInHomeMosaic: true,
            layout: "2_col" as const,
            position: 2,
            isVisible: true,
          },
        ]),
      };

      const mockProductRepo = {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      };

      const mockCategoryRepo = {
        listAll: vi.fn().mockResolvedValue([]),
      };

      const sections = await listHomeSections({
        navigationRepo: mockNavRepo as any,
        productRepo: mockProductRepo as any,
        categoryRepo: mockCategoryRepo as any,
      });

      // Ambas secciones deben incluirse para la home aunque productCount sea 0
      expect(sections.length).toBe(2);
      expect(sections[0].name).toBe("BANNER PRINCIPAL");
      expect(sections[1].name).toBe("COLECCIÓN OTOÑO");
    });
  });

  describe("Endpoints dedicados: /api/admin/sections y /api/admin/nav (Single Responsibility)", () => {
    let testEnv: ReturnType<typeof createTestEnvironment>;
    let validToken: string;

    beforeEach(async () => {
      testEnv = createTestEnvironment();
      await testEnv.seed();
      setGlobalAppDepsForTesting(testEnv.deps);

      validToken = await createSessionToken(
        getEnv().SESSION_SECRET,
        { email: "admin@example.com", role: "SUPER_ADMIN" },
        7200 * 1000
      );
    });

    afterEach(() => {
      setGlobalAppDepsForTesting(null);
    });

    it("GET /api/admin/sections requiere autorización y lista secciones", async () => {
      const unauthorizedReq = new NextRequest("http://localhost:3000/api/admin/sections");
      const unauthRes = await getSectionsHandler(unauthorizedReq);
      expect(unauthRes.status).toBe(401);

      const authorizedReq = new NextRequest("http://localhost:3000/api/admin/sections");
      authorizedReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
      const res = await getSectionsHandler(authorizedReq);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.sections)).toBe(true);
    });

    it("POST /api/admin/sections crea una nueva sección con layout 1_col (Ancho Completo)", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "SEAMLESS IMPACTO",
          slug: "seamless-impacto",
          layout: "1_col",
          showInHomeMosaic: true,
          subtitle: "Colección protagonista ancho completo",
          position: 10,
        }),
      });
      req.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);

      const res = await postSectionsHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.section.layout).toBe("1_col");
      expect(data.section.subtitle).toBe("Colección protagonista ancho completo");
    });

    it("PUT /api/admin/sections edita una sección existente a 1_col preservando su position", async () => {
      // 1. Crear sección inicial
      const createReq = new NextRequest("http://localhost:3000/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "EDITABLE TEST",
          slug: "editable-test",
          layout: "2_col",
          position: 5,
        }),
      });
      createReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
      const createRes = await postSectionsHandler(createReq);
      const created = await createRes.json();
      const sectionId = created.section.id;

      // 2. Editar sección cambiando layout a 1_col sin enviar position
      const updateReq = new NextRequest(`http://localhost:3000/api/admin/sections?id=${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sectionId,
          name: "EDITABLE TEST ACTUALIZADO",
          layout: "1_col",
          showProductCount: true,
        }),
      });
      updateReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
      const updateRes = await putSectionsHandler(updateReq);
      expect(updateRes.status).toBe(200);
      const updated = await updateRes.json();

      expect(updated.ok).toBe(true);
      expect(updated.section.layout).toBe("1_col");
      expect(updated.section.position).toBe(5); // Preserva la posición original
      expect(updated.section.showProductCount).toBe(true);
    });

    it("DELETE /api/admin/sections elimina la sección especificada", async () => {
      // 1. Crear sección para borrar
      const createReq = new NextRequest("http://localhost:3000/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "SECCION A ELIMINAR",
          slug: "seccion-a-eliminar",
        }),
      });
      createReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
      const createRes = await postSectionsHandler(createReq);
      const created = await createRes.json();
      const sectionId = created.section.id;

      // 2. Eliminarla
      const deleteReq = new NextRequest(`http://localhost:3000/api/admin/sections?id=${sectionId}`, {
        method: "DELETE",
      });
      deleteReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
      const deleteRes = await deleteSectionsHandler(deleteReq);
      expect(deleteRes.status).toBe(200);
      const data = await deleteRes.json();
      expect(data.ok).toBe(true);
      expect(data.sections.some((s: any) => s.id === sectionId)).toBe(false);
    });

    it("GET y PUT /api/admin/nav consulta y actualiza la navbar de forma aislada", async () => {
      const getReq = new NextRequest("http://localhost:3000/api/admin/nav");
      getReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
      const getRes = await getNavHandler(getReq);
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.ok).toBe(true);
      expect(getData.navbarConfig).toBeDefined();

      // Actualizar a segunda fila con colores y subítems
      const putReq = new NextRequest("http://localhost:3000/api/admin/nav", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          navbarConfig: {
            enabled: true,
            alignment: "second_row",
            secondRowBgColor: "#000000",
            secondRowTextColor: "#ffffff",
            items: [
              {
                id: "nav-mujer",
                label: "MUJER",
                href: "/mujer",
                position: 1,
                subItems: [
                  { id: "sub-1", label: "TOPS", href: "/mujer/tops" },
                ],
              },
            ],
          },
        }),
      });
      putReq.cookies.set(ADMIN_SESSION_COOKIE_NAME, validToken);
      const putRes = await putNavHandler(putReq);
      expect(putRes.status).toBe(200);
      const putData = await putRes.json();
      expect(putData.ok).toBe(true);
      expect(putData.navbarConfig.alignment).toBe("second_row");
      expect(putData.navbarConfig.secondRowBgColor).toBe("#000000");
      expect(putData.navbarConfig.items[0].subItems.length).toBe(1);
    });
  });
});

