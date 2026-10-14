import { resolveStoreTheme } from "../../lib/theme/palettes";

interface StoreThemeStylesProps {
  paletteId?: string | null;
  primaryColor?: string | null;
}

/**
 * Inyecta variables CSS dinámicas basadas en la paleta configurada en el Backoffice (sin re-deploy).
 */
export function StoreThemeStyles({ paletteId, primaryColor }: StoreThemeStylesProps) {
  const theme = resolveStoreTheme(paletteId, primaryColor);

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root {
          --store-bg: ${theme.bg};
          --store-surface: ${theme.surface};
          --store-accent: ${theme.accent};
          --store-text: ${theme.text};
          --store-border: ${theme.border};
        }
      `,
    }} />
  );
}

