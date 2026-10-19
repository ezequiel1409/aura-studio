import { resolveStoreTheme } from "../../lib/theme/palettes";
import { resolveStoreFont } from "../../lib/theme/fonts";

interface StoreThemeStylesProps {
  paletteId?: string | null;
  primaryColor?: string | null;
  fontId?: string | null;
}

/**
 * Inyecta variables CSS dinámicas y reglas de tema para la tienda pública
 * basadas en la paleta y la tipografía configuradas en el Backoffice (sin re-deploy).
 * Protege el backoffice (#admin-layout-root) para no alterar el panel administrativo.
 */
export function StoreThemeStyles({ paletteId, primaryColor, fontId }: StoreThemeStylesProps) {
  const theme = resolveStoreTheme(paletteId, primaryColor);
  const font = resolveStoreFont(fontId);

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        :root {
          --store-bg: ${theme.bg};
          --store-surface: ${theme.surface};
          --store-accent: ${theme.accent};
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

        /* 6. Reemplazo reactivo de acentos de marca */
        body:not(:has(#admin-layout-root)) .text-\\[\\#926a3c\\] {
          color: var(--store-accent) !important;
        }
        body:not(:has(#admin-layout-root)) .bg-\\[\\#926a3c\\] {
          background-color: var(--store-accent) !important;
        }
        body:not(:has(#admin-layout-root)) .border-\\[\\#926a3c\\] {
          border-color: var(--store-accent) !important;
        }
        body:not(:has(#admin-layout-root)) ::selection {
          background-color: var(--store-accent) !important;
          color: #ffffff !important;
        }
      `,
      }}
    />
  );
}
