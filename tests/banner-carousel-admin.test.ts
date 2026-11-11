import { describe, expect, it, beforeEach } from "vitest";
import { createTestEnvironment } from "./setup-db";
import { listActiveHomeBanners } from "../src/services/promotion.service";
import { HomeBanner } from "../src/domain/promotion/types";

describe("Gestor de Banners y Carrusel de Portada en Panel de Admin", () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(async () => {
    env = createTestEnvironment();
    await env.seed();
  });

  it("permite dar de alta múltiples slides para el carrusel con imágenes para escritorio y móvil, títulos y botones", async () => {
    const { deps } = env;

    // 1. Alta de Slide 1: Colección
    const slide1 = await deps.promotionRepo.upsertHomeBanner({
      placement: "HOME_HERO",
      title: "Nueva Colección 2026",
      subtitle: "Piezas seleccionadas en edición limitada confeccionadas en lino",
      desktopImageUrl: "https://images.unsplash.com/photo-1490481651871?w=1600",
      mobileImageUrl: "https://images.unsplash.com/photo-1490481651871?w=800",
      ctaLabel: "Explorar colección",
      ctaHref: "/catalogo",
      position: 0,
      isActive: true,
    });

    expect(slide1.id).toBeGreaterThan(0);
    expect(slide1.title).toBe("Nueva Colección 2026");
    expect(slide1.subtitle).toBe("Piezas seleccionadas en edición limitada confeccionadas en lino");
    expect(slide1.desktopImageUrl).toBe("https://images.unsplash.com/photo-1490481651871?w=1600");
    expect(slide1.mobileImageUrl).toBe("https://images.unsplash.com/photo-1490481651871?w=800");
    expect(slide1.ctaLabel).toBe("Explorar colección");
    expect(slide1.ctaHref).toBe("/catalogo");
    expect(slide1.isActive).toBe(true);

    // 2. Alta de Slide 2: Promoción Bancaria
    const slide2 = await deps.promotionRepo.upsertHomeBanner({
      placement: "HOME_HERO",
      title: "Beneficio Banco Galicia",
      subtitle: "Hasta 3 cuotas sin interés y retiro inmediato en showroom",
      desktopImageUrl: "https://images.unsplash.com/photo-1441986300917?w=1600",
      mobileImageUrl: "https://images.unsplash.com/photo-1441986300917?w=800",
      ctaLabel: "Ver condiciones",
      ctaHref: "/promociones/galicia-cuotas",
      position: 1,
      isActive: true,
    });

    expect(slide2.id).toBeGreaterThan(0);
    expect(slide2.id).not.toBe(slide1.id);
    expect(slide2.title).toBe("Beneficio Banco Galicia");

    // 3. Listar slides activos para la vidriera pública
    const activeBanners = await listActiveHomeBanners(deps);
    expect(activeBanners.length).toBe(2);
    expect(activeBanners[0].title).toBe("Nueva Colección 2026");
    expect(activeBanners[1].title).toBe("Beneficio Banco Galicia");
  });

  it("permite pausar un slide y excluirlo de la vidriera pública preservándolo en el admin", async () => {
    const { deps } = env;

    const banner = await deps.promotionRepo.upsertHomeBanner({
      placement: "HOME_HERO",
      title: "Promo Flash Fin de Semana",
      subtitle: "Descuentos por tiempo limitado",
      desktopImageUrl: "https://ejemplo.com/flash.jpg",
      mobileImageUrl: "https://ejemplo.com/flash-m.jpg",
      ctaLabel: "Comprar ahora",
      ctaHref: "/sale",
      position: 0,
      isActive: true,
    });

    // Activo inicialmente
    let publicBanners = await listActiveHomeBanners(deps);
    expect(publicBanners.some((b) => b.id === banner.id)).toBe(true);

    // Pausar banner
    await deps.promotionRepo.upsertHomeBanner({
      id: banner.id,
      placement: "HOME_HERO",
      title: banner.title,
      subtitle: banner.subtitle,
      desktopImageUrl: banner.desktopImageUrl || "",
      mobileImageUrl: banner.mobileImageUrl || "",
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref,
      position: banner.position,
      isActive: false,
    });

    // En la tienda pública ya no aparece
    publicBanners = await listActiveHomeBanners(deps);
    expect(publicBanners.some((b) => b.id === banner.id)).toBe(false);

    // En el panel de administración sí sigue disponible
    const allAdminBanners = await deps.promotionRepo.listHomeBanners({ activeOnly: false });
    const foundAdmin = allAdminBanners.find((b) => b.id === banner.id);
    expect(foundAdmin).toBeDefined();
    expect(foundAdmin?.isActive).toBe(false);
  });

  it("permite reordenar slides del carrusel y respeta la secuencia de rotación", async () => {
    const { deps } = env;

    const b1 = await deps.promotionRepo.upsertHomeBanner({
      placement: "HOME_HERO",
      title: "Slide A",
      desktopImageUrl: "https://ejemplo.com/a.jpg",
      mobileImageUrl: "https://ejemplo.com/a.jpg",
      ctaLabel: "Ver A",
      ctaHref: "/a",
      position: 0,
      isActive: true,
    });

    const b2 = await deps.promotionRepo.upsertHomeBanner({
      placement: "HOME_HERO",
      title: "Slide B",
      desktopImageUrl: "https://ejemplo.com/b.jpg",
      mobileImageUrl: "https://ejemplo.com/b.jpg",
      ctaLabel: "Ver B",
      ctaHref: "/b",
      position: 1,
      isActive: true,
    });

    // Invertir orden: B primero (pos 0), A segundo (pos 1)
    await deps.promotionRepo.upsertHomeBanner({
      id: b2.id,
      placement: "HOME_HERO",
      title: b2.title,
      desktopImageUrl: b2.desktopImageUrl || "",
      mobileImageUrl: b2.mobileImageUrl || "",
      ctaLabel: b2.ctaLabel,
      ctaHref: b2.ctaHref,
      position: 0,
      isActive: true,
    });

    await deps.promotionRepo.upsertHomeBanner({
      id: b1.id,
      placement: "HOME_HERO",
      title: b1.title,
      desktopImageUrl: b1.desktopImageUrl || "",
      mobileImageUrl: b1.mobileImageUrl || "",
      ctaLabel: b1.ctaLabel,
      ctaHref: b1.ctaHref,
      position: 1,
      isActive: true,
    });

    const banners = await listActiveHomeBanners(deps);
    expect(banners[0].id).toBe(b2.id);
    expect(banners[0].title).toBe("Slide B");
    expect(banners[1].id).toBe(b1.id);
    expect(banners[1].title).toBe("Slide A");
  });

  it("permite eliminar un slide de forma definitiva", async () => {
    const { deps } = env;

    const banner = await deps.promotionRepo.upsertHomeBanner({
      placement: "HOME_HERO",
      title: "Banner a Eliminar",
      desktopImageUrl: "https://ejemplo.com/delete.jpg",
      mobileImageUrl: "https://ejemplo.com/delete.jpg",
      ctaLabel: "Eliminar",
      ctaHref: "/catalogo",
      position: 0,
      isActive: true,
    });

    expect(banner.id).toBeGreaterThan(0);

    await deps.promotionRepo.deleteHomeBanner(banner.id);

    const all = await deps.promotionRepo.listHomeBanners({ activeOnly: false });
    expect(all.some((b) => b.id === banner.id)).toBe(false);
  });

  it("soporta imágenes móviles opcionales con fallback automático a la de escritorio", async () => {
    const { deps } = env;

    const banner = await deps.promotionRepo.upsertHomeBanner({
      placement: "HOME_HERO",
      title: "Banner Solo Desktop",
      desktopImageUrl: "https://ejemplo.com/desktop-only.jpg",
      mobileImageUrl: "",
      ctaLabel: "Explorar",
      ctaHref: "/catalogo",
      position: 0,
      isActive: true,
    });

    // Si mobileImageUrl está vacío, el repositorio usa desktopImageUrl como fallback
    expect(banner.desktopImageUrl).toBe("https://ejemplo.com/desktop-only.jpg");
    expect(banner.mobileImageUrl).toBe("https://ejemplo.com/desktop-only.jpg");
  });
});

