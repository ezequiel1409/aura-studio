import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Invoca revalidatePath de manera segura sin romper si se ejecuta fuera
 * del ciclo de vida de peticiones de Next.js (por ejemplo en tests unitarios).
 */
export function safeRevalidatePath(path: string, type?: "layout" | "page"): void {
  try {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  } catch {
    // Silencioso fuera del contexto de petición HTTP
  }
}

/**
 * Invoca revalidateTag de manera segura.
 */
export function safeRevalidateTag(tag: string): void {
  try {
    revalidateTag(tag, "max");
  } catch {
    // Silencioso fuera del contexto de petición HTTP
  }
}

/**
 * Invalida páginas y tags asociados a productos cuando se crean, editan o eliminan.
 */
export function revalidateProducts(productCode?: number | string | null): void {
  safeRevalidatePath("/");
  safeRevalidatePath("/catalogo");
  if (productCode !== undefined && productCode !== null) {
    const codeNum = typeof productCode === "string" ? parseInt(productCode, 10) : productCode;
    if (!Number.isNaN(codeNum)) {
      const formatted = String(codeNum).padStart(3, "0");
      safeRevalidatePath(`/p/${formatted}`);
    }
  }
  safeRevalidateTag("products");
}

/**
 * Invalida páginas y tags cuando cambian categorías o su orden.
 */
export function revalidateCategories(): void {
  safeRevalidatePath("/");
  safeRevalidatePath("/catalogo");
  safeRevalidateTag("categories");
}

/**
 * Invalida páginas y tags cuando cambian las secciones o la barra de navegación.
 */
export function revalidateNavigation(sectionSlug?: string | null): void {
  safeRevalidatePath("/");
  safeRevalidatePath("/catalogo");
  if (sectionSlug) {
    safeRevalidatePath(`/${sectionSlug}`);
  }
  safeRevalidateTag("navigation");
}

/**
 * Invalida páginas y tags cuando cambian promociones, banners o bancos.
 */
export function revalidatePromotions(slug?: string | null): void {
  safeRevalidatePath("/");
  safeRevalidatePath("/promociones");
  if (slug) {
    safeRevalidatePath(`/promociones/${slug}`);
  }
  safeRevalidateTag("promotions");
}

/**
 * Invalida el layout global cuando se modifican ajustes de tienda, marca o diseño.
 */
export function revalidateStoreSettings(): void {
  safeRevalidatePath("/", "layout");
  safeRevalidateTag("settings");
}
