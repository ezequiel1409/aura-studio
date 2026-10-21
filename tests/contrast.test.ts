import { describe, it, expect } from "vitest";
import { calculateContrastRatio } from "../src/lib/theme/contrast";
import { resolveStoreTheme } from "../src/lib/theme/palettes";

describe("ADM-06: Validador de Contraste WCAG 2.2 y Resolución de Paletas", () => {
  it("calcula contraste de texto negro sobre blanco (21:1, cumple AAA)", () => {
    const result = calculateContrastRatio("#000000", "#ffffff");
    expect(result.ratio).toBe(21);
    expect(result.isCompliantAA).toBe(true);
    expect(result.isCompliantAAA).toBe(true);
    expect(result.status).toBe("success");
  });

  it("detecta contraste insuficiente en texto claro sobre fondo claro (< 4.5:1)", () => {
    // Gris claro #999999 sobre blanco #ffffff
    const result = calculateContrastRatio("#999999", "#ffffff");
    expect(result.ratio).toBeLessThan(4.5);
    expect(result.isCompliantAA).toBe(false);
    expect(result.status).not.toBe("success");
    expect(result.suggestion).toBeDefined();
  });

  it("detecta contraste óptimo para la paleta lino (#1c1917 sobre #faf8f5)", () => {
    const result = calculateContrastRatio("#1c1917", "#faf8f5");
    expect(result.ratio).toBeGreaterThan(10);
    expect(result.isCompliantAA).toBe(true);
  });

  it("resolveStoreTheme respeta personalizaciones de fondo y superficie", () => {
    const theme = resolveStoreTheme("lino", "#ff0000", "#111111", "#222222");
    expect(theme.accent).toBe("#ff0000");
    expect(theme.bg).toBe("#111111");
    expect(theme.surface).toBe("#222222");
  });
});

