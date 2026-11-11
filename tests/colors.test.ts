import { describe, it, expect } from "vitest";
import { resolveColorHex } from "../src/lib/format/colors";

describe("resolveColorHex - Mapeo de colores textiles", () => {
  it("respeta códigos hexadecimales válidos ingresados por el usuario o comercio", () => {
    expect(resolveColorHex("Verde personalizado", "#123456")).toBe("#123456");
    expect(resolveColorHex("Rosa", "#fbcfe8")).toBe("#fbcfe8");
  });

  it("resuelve colores textiles comunes cuando hexCode es null o vacío", () => {
    expect(resolveColorHex("Negro", null)).toBe("#18181b");
    expect(resolveColorHex("Blanco", "")).toBe("#ffffff");
    expect(resolveColorHex("Verde musgo", null)).toBe("#4d5b3d");
    expect(resolveColorHex("Chocolate", undefined)).toBe("#3d2314");
    expect(resolveColorHex("Rosa pastel", null)).toBe("#fbcfe8");
    expect(resolveColorHex("Azul marino", null)).toBe("#0f172a");
    expect(resolveColorHex("Beige", null)).toBe("#d8c4b6");
    expect(resolveColorHex("Celeste", null)).toBe("#38bdf8");
  });

  it("resuelve nombres con acentos o mayúsculas/minúsculas indiferentemente", () => {
    expect(resolveColorHex("BORDÓ", null)).toBe("#701a35");
    expect(resolveColorHex("carbón", null)).toBe("#27272a");
    expect(resolveColorHex("Visón", null)).toBe("#8b7e74");
  });

  it("devuelve fallback neutro (#78716c) para nombres no reconocidos", () => {
    expect(resolveColorHex("color_desconocido_xyz_99", null)).toBe("#78716c");
    expect(resolveColorHex("", null)).toBe("#78716c");
  });
});
