import { describe, expect, it } from "vitest";
import {
  extractPriceCents,
  extractSize,
  parseSizesList,
  formatSizesForBadge,
  parseProductText,
} from "../src/lib/parser/product-parser";
import { sanitizePlainText } from "../src/lib/parser/sanitize";
import { formatPrice } from "../src/lib/format/currency";

describe("Text Sanitization (BR-06)", () => {
  it("elimina etiquetas HTML y scripts preservando texto plano y emojis", () => {
    const malicious = "<script>alert('hack')</script>✨ Remera Florencia 💖 <b>100% algodón</b>";
    const cleaned = sanitizePlainText(malicious);

    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("alert");
    expect(cleaned).not.toContain("<b>");
    expect(cleaned).toContain("✨ Remera Florencia 💖");
    expect(cleaned).toContain("100% algodón");
  });
});

describe("Price and Size Extraction (BR-20, BR-23)", () => {
  it("extrae precios con formato argentino en centavos ($15.000 -> 1500000)", () => {
    expect(extractPriceCents("Remera básica $15.000 talle M")).toBe(1500000);
    expect(extractPriceCents("Top lino\nPrecio: $ 25.500")).toBe(2550000);
    expect(extractPriceCents("Buzo oversize 35k")).toBe(3500000);
    expect(extractPriceCents("Jean wide leg $42000")).toBe(4200000);
  });

  it("retorna null para productos sin precio o con 'consultar precio' (BR-23)", () => {
    expect(extractPriceCents("Vestido de fiesta seda - consultar precio")).toBeNull();
    expect(extractPriceCents("Campera de cuero - precio por privado")).toBeNull();
    expect(extractPriceCents("Tapado paño sin mención monetaria")).toBeNull();
  });

  it("normaliza talles de indumentaria a mayúsculas y estándar", () => {
    expect(extractSize("Talle S")).toBe("S");
    expect(extractSize("Talle: m")).toBe("M");
    expect(extractSize("T. L")).toBe("L");
    expect(extractSize("Talle XL")).toBe("XL");
    expect(extractSize("Talle único")).toBe("ÚNICO");
    expect(extractSize("Talle unico")).toBe("ÚNICO");
    expect(extractSize("Talle 2")).toBe("2");
    expect(extractSize("Talle 38")).toBe("38");
    expect(extractSize("Sin talle especificado")).toBeNull();
  });

  it("soporta extracción y lista de múltiples talles (S, M, L / 36, 38, 40)", () => {
    expect(extractSize("Top lino\nTalles: S, M, L\nPrecio: $15.000")).toBe("S, M, L");
    expect(extractSize("Jean rígido\nTalles: 36, 38, 40")).toBe("36, 38, 40");
    expect(extractSize("Vestido\nTalles: S / M / L")).toBe("S, M, L");

    expect(parseSizesList("S, M, L")).toEqual(["S", "M", "L"]);
    expect(parseSizesList("36, 38, 40")).toEqual(["36", "38", "40"]);
    expect(parseSizesList("ÚNICO")).toEqual(["ÚNICO"]);
    expect(parseSizesList("M")).toEqual(["M"]);
    expect(parseSizesList(null)).toEqual([]);
    expect(parseSizesList(undefined)).toEqual([]);
  });

  it("formatea talles para la tarjeta del catálogo de forma compacta (formatSizesForBadge)", () => {
    // 1 talle
    expect(formatSizesForBadge(["M"])).toBe("T. M");
    expect(formatSizesForBadge(["ÚNICO"])).toBe("ÚNICO");

    // 2 y 3 talles
    expect(formatSizesForBadge(["S", "M"])).toBe("S · M");
    expect(formatSizesForBadge(["S", "M", "L"])).toBe("S · M · L");

    // 4 o más talles: rangos inteligentes
    expect(formatSizesForBadge(["34", "36", "38", "40", "42"])).toBe("34 al 42");
    expect(formatSizesForBadge(["XS", "S", "M", "L", "XL"])).toBe("XS al XL");
    expect(formatSizesForBadge(["1", "2", "3", "4"])).toBe("1 al 4");
    expect(formatSizesForBadge(["A", "B", "C", "D", "E"])).toBe("A, B +3");
    expect(formatSizesForBadge([])).toBe("");
  });

  it("formatea moneda en ARS con soporte para 'Consultar precio' (BR-23)", () => {
    expect(formatPrice(1500000)).toMatch(/\$|ARS/);
    expect(formatPrice(null)).toBe("Consultar precio");
    expect(formatPrice(undefined)).toBe("Consultar precio");
  });
});

describe("Product Text Parser (BR-05, BR-26)", () => {
  it("enriquece los datos del producto a partir del texto libre sin bloquear", () => {
    const raw = `✨ Remera Tokio Oversize
Talle: M
Precio: $ 18.500
100% algodón peinado, súper suave.`;

    const parsed = parseProductText(raw);

    expect(parsed.title).toBe("Remera Tokio Oversize");
    expect(parsed.priceCents).toBe(1850000);
    expect(parsed.size).toBe("M");
    expect(parsed.suggestedCategorySlug).toBe("remeras-y-tops");
  });

  it("permite textos crudos sin estructura y no falla", () => {
    const raw = "Solo una descripción sin precio ni talle";
    const parsed = parseProductText(raw);

    expect(parsed.title).toBe("Solo una descripción sin precio ni talle");
    expect(parsed.priceCents).toBeNull();
    expect(parsed.size).toBeNull();
  });
});
