import { describe, it, expect, vi } from "vitest";
import {
  safeRevalidatePath,
  safeRevalidateTag,
  revalidateProducts,
  revalidateCategories,
  revalidateNavigation,
  revalidatePromotions,
  revalidateStoreSettings,
} from "../src/infra/cache/revalidation";

// Mock next/cache para monitorear las llamadas de revalidación
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { revalidatePath, revalidateTag } from "next/cache";

describe("Caché Incremental & Invalidación en Admin (Fase 1)", () => {
  it("safeRevalidatePath invoca revalidatePath de Next.js y maneja excepciones silenciosamente", () => {
    safeRevalidatePath("/");
    expect(revalidatePath).toHaveBeenCalledWith("/");

    safeRevalidatePath("/", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");

    // Simular error fuera de contexto Next.js
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error("Missing Next.js request context");
    });
    expect(() => safeRevalidatePath("/error")).not.toThrow();
  });

  it("safeRevalidateTag invoca revalidateTag con el perfil de Next.js 16 y maneja errores", () => {
    safeRevalidateTag("products");
    expect(revalidateTag).toHaveBeenCalledWith("products", "max");

    vi.mocked(revalidateTag).mockImplementationOnce(() => {
      throw new Error("Missing Next.js request context");
    });
    expect(() => safeRevalidateTag("error")).not.toThrow();
  });

  it("revalidateProducts invalida home, catalogo, ficha por código y tag 'products'", () => {
    vi.clearAllMocks();
    revalidateProducts(42);

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/catalogo");
    expect(revalidatePath).toHaveBeenCalledWith("/p/042");
    expect(revalidateTag).toHaveBeenCalledWith("products", "max");
  });

  it("revalidateProducts maneja código ausente o inválido", () => {
    vi.clearAllMocks();
    revalidateProducts();

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/catalogo");
    expect(revalidatePath).not.toHaveBeenCalledWith(expect.stringContaining("/p/"));
    expect(revalidateTag).toHaveBeenCalledWith("products", "max");
  });

  it("revalidateCategories invalida home, catálogo y tag 'categories'", () => {
    vi.clearAllMocks();
    revalidateCategories();

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/catalogo");
    expect(revalidateTag).toHaveBeenCalledWith("categories", "max");
  });

  it("revalidateNavigation invalida navegación y sección específica si se proporciona", () => {
    vi.clearAllMocks();
    revalidateNavigation("recien-llegados");

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/catalogo");
    expect(revalidatePath).toHaveBeenCalledWith("/recien-llegados");
    expect(revalidateTag).toHaveBeenCalledWith("navigation", "max");
  });

  it("revalidatePromotions invalida promociones y detalle si se provee slug", () => {
    vi.clearAllMocks();
    revalidatePromotions("banco-galicia");

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/promociones");
    expect(revalidatePath).toHaveBeenCalledWith("/promociones/banco-galicia");
    expect(revalidateTag).toHaveBeenCalledWith("promotions", "max");
  });

  it("revalidateStoreSettings invalida layout raíz completo y tag 'settings'", () => {
    vi.clearAllMocks();
    revalidateStoreSettings();

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(revalidateTag).toHaveBeenCalledWith("settings", "max");
  });
});
