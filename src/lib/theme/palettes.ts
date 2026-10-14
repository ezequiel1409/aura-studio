/**
 * Paletas de colores curadas y utilidades de color RGB / Hex para Aura Studio
 */

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  bg: string;
  surface: string;
  accent: string;
  text: string;
  border: string;
}

export const THEME_PALETTES: Record<string, ThemePalette> = {
  lino: {
    id: "lino",
    name: "Lino & Champagne",
    description: "Cálido y natural con tonos arena, lino y dorado sutil (Estilo Showroom)",
    bg: "#faf8f5",
    surface: "#ffffff",
    accent: "#926a3c",
    text: "#1c1917",
    border: "#e7e2da",
  },
  noir: {
    id: "noir",
    name: "Monocromo Noir",
    description: "Alta costura minimalista, blanco puro y contrastes negros editoriales",
    bg: "#ffffff",
    surface: "#ffffff",
    accent: "#18181b",
    text: "#09090b",
    border: "#e4e4e7",
  },
  terracota: {
    id: "terracota",
    name: "Terracota & Arcilla",
    description: "Boutique bohemia con acentos cálidos de tierra tostada y arcilla",
    bg: "#fdfbf7",
    surface: "#ffffff",
    accent: "#9a3412",
    text: "#292524",
    border: "#e7e0d8",
  },
  oliva: {
    id: "oliva",
    name: "Oliva & Salvia",
    description: "Tonos botánicos frescos y orgánicos con verde oliva profundo",
    bg: "#f8faf7",
    surface: "#ffffff",
    accent: "#3f4f34",
    text: "#1c1f1a",
    border: "#dde3da",
  },
};

/**
 * Convierte color hexadecimal a componentes RGB { r, g, b }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

/**
 * Convierte componentes RGB a hexadecimal #RRGGBB
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val || 0)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Resuelve la paleta efectiva para la tienda pública
 */
export function resolveStoreTheme(
  paletteId?: string | null,
  customPrimaryColor?: string | null
): ThemePalette {
  const preset = paletteId && THEME_PALETTES[paletteId] ? THEME_PALETTES[paletteId] : THEME_PALETTES.lino;

  if (paletteId === "custom" && customPrimaryColor && /^#[0-9a-fA-F]{3,6}$/.test(customPrimaryColor.trim())) {
    return {
      id: "custom",
      name: "Personalizado",
      description: "Paleta personalizada con acento de marca a medida",
      bg: "#faf8f5",
      surface: "#ffffff",
      accent: customPrimaryColor.trim(),
      text: "#1c1917",
      border: "#e7e2da",
    };
  }

  return preset;
}

