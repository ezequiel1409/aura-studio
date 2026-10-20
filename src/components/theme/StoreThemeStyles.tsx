import { resolveStoreTheme, hexToRgb } from "../../lib/theme/palettes";
import { resolveStoreFont } from "../../lib/theme/fonts";

interface StoreThemeStylesProps {
  paletteId?: string | null;
  primaryColor?: string | null;
  fontId?: string | null;
}

/**
 * Calcula un color de texto accesible (blanco o casi negro) con alto contraste para el color de acento
 */
function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 140 ? "#111827" : "#ffffff";
}

/**
 * Inyecta variables CSS dinámicas y reglas de tema para la tienda pública
 * basadas en la paleta y la tipografía configuradas en el Backoffice (sin re-deploy).
 * Protege el backoffice (#admin-layout-root) para no alterar el panel administrativo.
 */
export function StoreThemeStyles({ paletteId, primaryColor, fontId }: StoreThemeStylesProps) {
  const theme = resolveStoreTheme(paletteId, primaryColor);
  const font = resolveStoreFont(fontId);
  const contrastColor = getContrastColor(theme.accent);

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        :root {
          --store-bg: ${theme.bg};
          --store-surface: ${theme.surface};
          --store-accent: ${theme.accent};
          --store-accent-contrast: ${contrastColor};
          --store-text: ${theme.text};
          --store-border: ${theme.border};

          --bg: ${theme.bg};
          --surface: ${theme.surface};
          --primary: ${theme.accent};
          --border: ${theme.border};
          --text: ${theme.text};
          --background: ${theme.bg};
          --foreground: ${theme.text};
          --card-bg: ${theme.surface};
          --border-color: ${theme.border};
          --accent: ${theme.accent};

          --font-serif: ${font.serifFont};
          --font-sans: ${font.sansFont};
        }

        /* 1. Fondo, texto y tipografía base de la tienda pública */
        body:not(:has(#admin-layout-root)) {
          background-color: var(--store-bg) !important;
          color: var(--store-text) !important;
          font-family: var(--font-sans) !important;
        }

        /* 2. Títulos y etiquetas tipográficas con la fuente seleccionada por el comercio */
        body:not(:has(#admin-layout-root)) .font-serif,
        body:not(:has(#admin-layout-root)) [class*="font-serif"],
        body:not(:has(#admin-layout-root)) h1.font-serif,
        body:not(:has(#admin-layout-root)) h2.font-serif,
        body:not(:has(#admin-layout-root)) h3.font-serif {
          font-family: var(--font-serif) !important;
        }

        /* 3. Reemplazo reactivo de utilidades de fondo de tienda */
        body:not(:has(#admin-layout-root)) .bg-\\[\\#faf8f5\\],
        body:not(:has(#admin-layout-root)) .bg-\\[\\#faf8f5\\]\\/90,
        body:not(:has(#admin-layout-root)) .bg-\\[\\#faf8f5\\]\\/80,
        body:not(:has(#admin-layout-root)) .bg-\\[\\#faf8f5\\]\\/70,
        body:not(:has(#admin-layout-root)) .bg-\\[\\#faf8f5\\]\\/50 {
          background-color: var(--store-bg) !important;
        }

        /* 4. Reemplazo reactivo de utilidades de texto de tienda */
        body:not(:has(#admin-layout-root)) .text-\\[\\#1c1917\\] {
          color: var(--store-text) !important;
        }

        /* 5. Reemplazo reactivo de bordes de tienda */
        body:not(:has(#admin-layout-root)) .border-\\[\\#e7e2da\\],
        body:not(:has(#admin-layout-root)) .border-\\[\\#e7e2da\\]\\/70,
        body:not(:has(#admin-layout-root)) .border-\\[\\#e7e2da\\]\\/60 {
          border-color: var(--store-border) !important;
        }

        /* 6. Botones principales, llamados a la acción (CTA) y acentos de marca seleccionados por el comercio */
        body:not(:has(#admin-layout-root)) .bg-stone-900,
        body:not(:has(#admin-layout-root)) button.bg-stone-900,
        body:not(:has(#admin-layout-root)) a.bg-stone-900,
        body:not(:has(#admin-layout-root)) .bg-\\[\\#1c1917\\],
        body:not(:has(#admin-layout-root)) .bg-\\[\\#926a3c\\] {
          background-color: var(--store-accent) !important;
          color: var(--store-accent-contrast) !important;
        }

        /* Estados hover para botones primarios */
        body:not(:has(#admin-layout-root)) .bg-stone-900:hover,
        body:not(:has(#admin-layout-root)) button.bg-stone-900:hover,
        body:not(:has(#admin-layout-root)) a.bg-stone-900:hover,
        body:not(:has(#admin-layout-root)) .bg-\\[\\#1c1917\\]:hover,
        body:not(:has(#admin-layout-root)) .hover\\:bg-stone-800:hover {
          filter: brightness(0.9) !important;
        }

        /* Bordes de botones y chips activos */
        body:not(:has(#admin-layout-root)) .border-stone-900,
        body:not(:has(#admin-layout-root)) button.border-stone-900,
        body:not(:has(#admin-layout-root)) a.border-stone-900,
        body:not(:has(#admin-layout-root)) .border-\\[\\#926a3c\\] {
          border-color: var(--store-accent) !important;
        }

        /* Anillos de foco y selección */
        body:not(:has(#admin-layout-root)) .focus-visible\\:outline-stone-900:focus-visible {
          outline-color: var(--store-accent) !important;
        }
        body:not(:has(#admin-layout-root)) .ring-stone-900 {
          --tw-ring-color: var(--store-accent) !important;
        }

        /* Acentos de texto de marca */
        body:not(:has(#admin-layout-root)) .text-\\[\\#926a3c\\] {
          color: var(--store-accent) !important;
        }

        /* Selección de texto */
        body:not(:has(#admin-layout-root)) ::selection {
          background-color: var(--store-accent) !important;
          color: var(--store-accent-contrast) !important;
        }
      `,
      }}
    />
  );
}
