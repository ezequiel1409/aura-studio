/**
 * Tipografías de marca curadas para Aura Studio y comercios multirrubro
 */

export interface ThemeFont {
  id: string;
  name: string;
  category: "Serif" | "Sans";
  description: string;
  serifFont: string;
  sansFont: string;
  sampleHeading: string;
  sampleSubtitle: string;
}

export const THEME_FONTS: Record<string, ThemeFont> = {
  cormorant: {
    id: "cormorant",
    name: "Cormorant Garamond",
    category: "Serif",
    description: "Editorial, refinada y de alta costura. El estándar de showrooms parisinos y marcas de lujo.",
    serifFont: "var(--font-cormorant), Georgia, serif",
    sansFont: "var(--font-geist-sans), system-ui, sans-serif",
    sampleHeading: "Aura Studio — Colección de Autor",
    sampleSubtitle: "Piezas únicas seleccionadas a mano",
  },
  playfair: {
    id: "playfair",
    name: "Playfair Display",
    category: "Serif",
    description: "Contraste marcado y carácter editorial imponente. Estilo sastrería, marroquinería y calzado.",
    serifFont: "var(--font-playfair), Didot, Georgia, serif",
    sansFont: "var(--font-geist-sans), system-ui, sans-serif",
    sampleHeading: "Sastrería & Herencia Clásica",
    sampleSubtitle: "Cortes estructurados y materiales nobles",
  },
  dm_serif: {
    id: "dm_serif",
    name: "DM Serif Display",
    category: "Serif",
    description: "Curvilínea, cálida y bohemia. Ideal para indumentaria casual chic, deco de hogar y lencería.",
    serifFont: "var(--font-dm-serif), Georgia, serif",
    sansFont: "var(--font-geist-sans), system-ui, sans-serif",
    sampleHeading: "Texturas Naturales & Confort",
    sampleSubtitle: "Diseño cálido para todos los días",
  },
  montserrat: {
    id: "montserrat",
    name: "Montserrat",
    category: "Sans",
    description: "Geométrica, limpia y con presencia bold contemporánea. Marcas jóvenes, streetwear y moda urbana.",
    serifFont: "var(--font-montserrat), system-ui, sans-serif",
    sansFont: "var(--font-geist-sans), system-ui, sans-serif",
    sampleHeading: "Vanguardia & Moda Contemporánea",
    sampleSubtitle: "Siluetas modernas y carácter audaz",
  },
  modern: {
    id: "modern",
    name: "Geist / Clean Sans",
    category: "Sans",
    description: "Minimalismo puro neo-grotesco sin serifas. Estilo visual Apple, Zara Studio o Cos.",
    serifFont: "var(--font-geist-sans), system-ui, sans-serif",
    sansFont: "var(--font-geist-sans), system-ui, sans-serif",
    sampleHeading: "Minimalismo Depurado & Esencial",
    sampleSubtitle: "Líneas puras y máxima funcionalidad",
  },
};

export const DEFAULT_THEME_FONT = "cormorant";

export function resolveStoreFont(fontId?: string | null): ThemeFont {
  if (fontId && THEME_FONTS[fontId]) {
    return THEME_FONTS[fontId];
  }
  return THEME_FONTS[DEFAULT_THEME_FONT];
}
