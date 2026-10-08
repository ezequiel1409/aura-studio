import { sanitizePlainText } from "./sanitize";

export interface ParsedProductData {
  title: string | null;
  priceCents: number | null;
  currency: string;
  size: string | null;
  suggestedCategorySlug?: string;
}

export interface CategoryLookupItem {
  id: number;
  name: string;
  slug: string;
}

/**
 * Normaliza y extrae el precio en centavos (BR-20, BR-23).
 * Soporta:
 * - $15.000 / $ 15.000 / $15000 / $15000.-
 * - 15.000 / 15000
 * - 15k / $15k / 15 k
 * - $ 15.000,50 / 15000.50
 */
export function extractPriceCents(text: string): number | null {
  // Ignora si expresamente dice "consultar precio", "por privado", etc.
  if (/consultar\s+precio|precio\s+por\s+privado|precio\s+inbox/i.test(text)) {
    return null;
  }

  // Patrón '15k' o '$15k'
  const kMatch = text.match(/(?:\$|\b)\s*(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(",", "."));
    if (!Number.isNaN(num) && num > 0) {
      return Math.round(num * 1000 * 100);
    }
  }

  // Patrón estándar con símbolo $ o prefijo 'precio:' o 'valor:'
  const priceRegexes = [
    /(?:precio|valor)?\s*\$\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{1,2})?)/i, // $ 15.000 o $ 15.000,50
    /(?:precio|valor)?\s*\$\s*([0-9]+(?:,[0-9]{1,2})?)/i, // $ 15000 o $ 15000,50
    /(?:precio|valor):\s*([0-9]{1,3}(?:\.[0-9]{3})+)/i, // precio: 15.000
    /(?:precio|valor):\s*([0-9]+)/i, // precio: 15000
  ];

  for (const regex of priceRegexes) {
    const match = text.match(regex);
    if (match) {
      const rawNum = match[1];
      // Si tiene separador de miles '.' y decimal ','
      if (rawNum.includes(".") && rawNum.includes(",")) {
        const normalized = rawNum.replace(/\./g, "").replace(",", ".");
        const val = parseFloat(normalized);
        if (!Number.isNaN(val) && val > 0) return Math.round(val * 100);
      } else if (rawNum.includes(".")) {
        // En Argentina los puntos son miles: 15.000 -> 15000
        const withoutDots = rawNum.replace(/\./g, "");
        const val = parseInt(withoutDots, 10);
        if (!Number.isNaN(val) && val > 0) return Math.round(val * 100);
      } else if (rawNum.includes(",")) {
        const val = parseFloat(rawNum.replace(",", "."));
        if (!Number.isNaN(val) && val > 0) return Math.round(val * 100);
      } else {
        const val = parseInt(rawNum, 10);
        if (!Number.isNaN(val) && val > 0) return Math.round(val * 100);
      }
    }
  }

  return null;
}

/**
 * Normaliza y extrae el talle (BR-20).
 * Soporta:
 * - Talle S, M, L, XL, XXL, XS
 * - Talle 1, 2, 3, 4
 * - Talle 36, 38, 40, 42
 * - Talle único / unico
 */
export function extractSize(text: string): string | null {
  // Talle único
  if (/(?:talle\s+)?(?:único|unico)\b/i.test(text) || /\b(?:[uú]nico)\b/iu.test(text)) {
    return "ÚNICO";
  }

  // Patrones tipo "Talle: M", "Talle M", "T: L", "Talle: 38", "T. 2"
  const sizeMatch = text.match(/(?:talle|t\.)\s*:?\s*([a-z0-9/+-]+)/i);
  if (sizeMatch) {
    const rawSize = sizeMatch[1].trim().toUpperCase();
    if (["XS", "S", "M", "L", "XL", "XXL"].includes(rawSize)) {
      return rawSize;
    }
    if (/^[0-9]+$/.test(rawSize)) {
      return rawSize;
    }
    if (["S/M", "M/L", "L/XL"].includes(rawSize)) {
      return rawSize;
    }
  }

  // Letra aislada de talle cuando dice "S", "M", "L" precedido por palabra clave
  const letterMatch = text.match(/\b(?:talles?)\s*:?\s*([xXsSmMlLeE]+)/i);
  if (letterMatch) {
    const raw = letterMatch[1].toUpperCase();
    if (["XS", "S", "M", "L", "XL", "XXL"].includes(raw)) {
      return raw;
    }
  }

  return null;
}

/**
 * Sugiere una categoría a partir de palabras clave en el texto.
 */
export function suggestCategory(text: string): string | undefined {
  const lower = text.toLowerCase();

  // Partes de arriba
  if (/\b(?:remera|remeron|remerón|musculosa|top|croptop|crop\s*top)\b/.test(lower)) {
    return "remeras-y-tops";
  }
  if (/\b(?:camisa|blusa)\b/.test(lower)) {
    return "camisas-y-blusas";
  }
  if (/\b(?:buzo|sweater|sueter|cardigan|chaleco)\b/.test(lower)) {
    return "buzos-y-sweaters";
  }
  if (/\b(?:campera|tapado|blazer|trench|parka|abrigo)\b/.test(lower)) {
    return "abrigos";
  }

  // Partes de abajo
  if (/\b(?:jean|denim)\b/.test(lower)) {
    return "jeans";
  }
  if (/\b(?:pantalon|pantalón|jogger|palazzo|calza)\b/.test(lower)) {
    return "pantalones";
  }
  if (/\b(?:short|bermuda|pollera|falda|minifalda)\b/.test(lower)) {
    return "shorts-y-faldas";
  }

  // Vestidos
  if (/\b(?:vestido|enterito|mono)\b/.test(lower)) {
    return "vestidos-y-enteritos";
  }

  // Calzado
  if (/\b(?:zapatilla|zapatillas|botas|borcegos|sandalias|mocasines|zapatos)\b/.test(lower)) {
    return "calzado";
  }

  // Accesorios
  if (/\b(?:cartera|bolso|cinturon|cinturón|rinonera|riñonera|gorra|sombrero|bufanda)\b/.test(lower)) {
    return "accesorios";
  }

  return undefined;
}

/**
 * Propone un título a partir del texto crudo.
 * Toma la primera línea representativa y limpia información secundaria (precios o talles si estuvieran en esa misma línea).
 */
export function extractTitle(text: string): string | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let firstLine = lines[0];

  // Remueve emojis o viñetas al inicio (ej: "✨ Remera Oversize" -> "Remera Oversize")
  firstLine = firstLine.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s•\-–—*#]+/u, "").trim();

  // Si la primera línea es muy corta o solo un emoji, pasa a la siguiente si existe
  if (firstLine.length < 3 && lines.length > 1) {
    firstLine = lines[1].replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s•\-–—*#]+/u, "").trim();
  }

  // Limpia menciones de precio y talle del título si vinieron pegados
  firstLine = firstLine
    .replace(/\s*-\s*\$\s*[0-9.,]+.*$/, "")
    .replace(/\s*-\s*talle\s+.*$/i, "")
    .trim();

  if (!firstLine) return null;

  // Límite razonable para título
  return firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine;
}

/**
 * Parser principal de texto libre para productos (BR-05, BR-06, BR-20, BR-23, BR-26).
 * Nunca bloquea la publicación si falta algo o si el texto es crudo/desconocido.
 */
export function parseProductText(rawText: string): ParsedProductData {
  const sanitized = sanitizePlainText(rawText);

  const title = extractTitle(sanitized);
  const priceCents = extractPriceCents(sanitized);
  const size = extractSize(sanitized);
  const suggestedCategorySlug = suggestCategory(sanitized);

  return {
    title,
    priceCents,
    currency: "ARS",
    size,
    suggestedCategorySlug,
  };
}
