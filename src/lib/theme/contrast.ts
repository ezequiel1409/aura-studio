/**
 * Utilidades para cálculo de contraste WCAG 2.2 AA.
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

/**
 * Calcula la luminancia relativa según WCAG 2.2
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface ContrastResult {
  ratio: number;
  ratioString: string;
  isCompliantAA: boolean;
  isCompliantAAA: boolean;
  status: "success" | "warning" | "danger";
  statusText: string;
  suggestion?: string;
}

/**
 * Calcula la relación de contraste entre dos colores (mínimo 4.5:1 para WCAG AA).
 */
export function calculateContrastRatio(
  foregroundHex: string,
  backgroundHex: string
): ContrastResult {
  const lum1 = getRelativeLuminance(foregroundHex);
  const lum2 = getRelativeLuminance(backgroundHex);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const rawRatio = (lighter + 0.05) / (darker + 0.05);
  const ratio = Math.round(rawRatio * 10) / 10;
  const ratioString = `${ratio.toFixed(1).replace(".", ",")}:1`;

  const isCompliantAA = ratio >= 4.5;
  const isCompliantAAA = ratio >= 7.0;

  let status: "success" | "warning" | "danger" = "success";
  let statusText = "Contraste óptimo (cumple WCAG AA)";
  let suggestion: string | undefined;

  if (ratio < 3.0) {
    status = "danger";
    statusText = `${ratioString} — Contraste insuficiente (crítico)`;
    suggestion =
      lum2 > 0.5
        ? "Recomendación: oscurecer el texto o elegir un fondo más oscuro para asegurar legibilidad."
        : "Recomendación: aclarar el texto a blanco (#ffffff) o elegir un tono con mayor luminancia.";
  } else if (ratio < 4.5) {
    status = "warning";
    statusText = `${ratioString} — Contraste justo (puede costar leerse en pantallas con sol)`;
    suggestion =
      lum2 > 0.5
        ? "Recomendación: oscurecer ligeramente el texto para superar 4,5:1."
        : "Recomendación: aclarar ligeramente el texto o usar una capa de contraste sobre la imagen.";
  } else if (isCompliantAAA) {
    statusText = `${ratioString} — Contraste excelente (cumple WCAG AAA)`;
  } else {
    statusText = `${ratioString} — Contraste adecuado (cumple WCAG AA)`;
  }

  return {
    ratio,
    ratioString,
    isCompliantAA,
    isCompliantAAA,
    status,
    statusText,
    suggestion,
  };
}

