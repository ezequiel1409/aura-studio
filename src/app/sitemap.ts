import type { MetadataRoute } from "next";
import { getProductServiceDeps } from "../infra/db/connection";
import { NavigationSection } from "../domain/navigation/types";
import { Product } from "../domain/product/types";
import { Promotion } from "../domain/promotion/types";

// Revalida el mapa del sitio cada 1 hora en CDN / Edge
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mitienda.local";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalogo`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/promociones`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/arrepentimiento`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const deps = getProductServiceDeps();
    const [sections, productsResult, activePromos] = await Promise.all([
      deps.navigationRepo.listSections({ visibleOnly: true }),
      deps.productRepo.list({ pageSize: 1000 }),
      deps.promotionRepo.listPromotions({ activeOnly: true }),
    ]);

    const sectionRoutes: MetadataRoute.Sitemap = sections.map(
      (section: NavigationSection) => ({
        url: `${baseUrl}/${section.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );

    const productRoutes: MetadataRoute.Sitemap = productsResult.items.map(
      (prod: Product) => {
        const codePadded = prod.code.toString().padStart(3, "0");
        return {
          url: `${baseUrl}/p/${codePadded}`,
          lastModified: new Date(prod.updatedAt || prod.createdAt || Date.now()),
          changeFrequency: "weekly",
          priority: prod.status === "AVAILABLE" ? 0.8 : 0.4,
        };
      }
    );

    const promoRoutes: MetadataRoute.Sitemap = activePromos.map(
      (promo: Promotion) => ({
        url: `${baseUrl}/promociones/${promo.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    );

    return [...staticRoutes, ...sectionRoutes, ...promoRoutes, ...productRoutes];
  } catch (error) {
    console.error("Error al generar sitemap.xml:", error);
    return staticRoutes;
  }
}
