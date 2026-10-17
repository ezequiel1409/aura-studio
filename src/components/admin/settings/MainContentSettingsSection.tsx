"use client";

import { Image as ImageIcon, LayoutTemplate, Palette, Sparkles } from "lucide-react";
import { HeroMode } from "../../../services/settings.service";
import { THEME_PALETTES, hexToRgb, rgbToHex } from "../../../lib/theme/palettes";

interface MainContentSettingsSectionProps {
  heroMode: HeroMode;
  heroTitle: string;
  heroSubtitle: string;
  heroBannerUrl: string;
  themePalette: string;
  themePrimaryColor: string;
  onHeroModeChange: (mode: HeroMode) => void;
  onHeroTitleChange: (val: string) => void;
  onHeroSubtitleChange: (val: string) => void;
  onHeroBannerUrlChange: (val: string) => void;
  onSelectPreset: (paletteId: string) => void;
  onCustomColorChange: (hex: string) => void;
}

export function MainContentSettingsSection({
  heroMode,
  heroTitle,
  heroSubtitle,
  heroBannerUrl,
  themePalette,
  themePrimaryColor,
  onHeroModeChange,
  onHeroTitleChange,
  onHeroSubtitleChange,
  onHeroBannerUrlChange,
  onSelectPreset,
  onCustomColorChange,
}: MainContentSettingsSectionProps) {
  const currentRgb = hexToRgb(themePrimaryColor) || { r: 146, g: 106, b: 60 };

  const previewTextColor = (() => {
    const rgb = hexToRgb(themePrimaryColor);
    if (!rgb) return "#ffffff";
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.55 ? "#1c1917" : "#ffffff";
  })();

  const handleRgbChange = (channel: "r" | "g" | "b", val: number) => {
    const updated = {
      ...currentRgb,
      [channel]: Math.max(0, Math.min(255, isNaN(val) ? 0 : val)),
    };
    const hex = rgbToHex(updated.r, updated.g, updated.b);
    onCustomColorChange(hex);
  };

  return (
    <div
      id="settings-panel-main"
      role="tabpanel"
      aria-labelledby="settings-tab-main"
      className="space-y-5"
    >
      {/* Bloque 1: Portada y Hero del Catálogo (Home) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={16} className="text-amber-400" aria-hidden="true" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Portada de la Tienda (Contenido Principal)
            </h2>
            <p className="text-[11px] text-zinc-400">
              Elegí qué mostrar en el bloque principal de bienvenida a tus clientas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            aria-pressed={heroMode === "featured_carousel"}
            onClick={() => onHeroModeChange("featured_carousel")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              heroMode === "featured_carousel"
                ? "border-amber-400 bg-amber-950/20 ring-1 ring-amber-400"
                : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
              <Sparkles size={14} className="text-amber-400" />
              <span>Carrusel de Destacados</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">
              Muestra las fotos y detalles de las prendas marcadas como destacadas en un carrusel
              interactivo.
            </p>
          </button>

          <button
            type="button"
            aria-pressed={heroMode === "editorial"}
            onClick={() => onHeroModeChange("editorial")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              heroMode === "editorial"
                ? "border-amber-400 bg-amber-950/20 ring-1 ring-amber-400"
                : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
              <span>📝 Banner Editorial</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">
              Texto de bienvenida elegante y minimalista con título de colección y bajada
              editorial.
            </p>
          </button>

          <button
            type="button"
            aria-pressed={heroMode === "custom_banner"}
            onClick={() => onHeroModeChange("custom_banner")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              heroMode === "custom_banner"
                ? "border-amber-400 bg-amber-950/20 ring-1 ring-amber-400"
                : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
              <ImageIcon size={14} className="text-zinc-400" />
              <span>Banner de Campaña</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">
              Imagen fotográfica de portada completa de temporada con textos superpuestos.
            </p>
          </button>
        </div>

        {(heroMode === "editorial" || heroMode === "custom_banner") && (
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            {heroMode === "custom_banner" && (
              <div className="space-y-1">
                <label htmlFor="heroBannerUrlInput" className="text-xs text-zinc-300">
                  URL de la Imagen del Banner
                </label>
                <input
                  id="heroBannerUrlInput"
                  type="url"
                  value={heroBannerUrl}
                  onChange={(e) => onHeroBannerUrlChange(e.target.value)}
                  placeholder="https://ejemplo.com/campana-invierno.jpg"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="heroTitleInput" className="text-xs text-zinc-300">
                  Título de la Portada
                </label>
                <input
                  id="heroTitleInput"
                  type="text"
                  value={heroTitle}
                  onChange={(e) => onHeroTitleChange(e.target.value)}
                  placeholder="Piezas únicas con carácter propio"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="heroSubtitleInput" className="text-xs text-zinc-300">
                  Bajada de Texto / Descripción
                </label>
                <input
                  id="heroSubtitleInput"
                  type="text"
                  value={heroSubtitle}
                  onChange={(e) => onHeroSubtitleChange(e.target.value)}
                  placeholder="Cada pieza de nuestro showroom es única e irrepetible..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {heroMode === "featured_carousel" && (
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
            <Sparkles size={15} className="shrink-0" />
            <span>
              El carrusel tomará automáticamente las prendas que tengan la estrella de{" "}
              <strong>Destacada</strong> activada en el listado de productos.
            </span>
          </div>
        )}
      </div>

      {/* Bloque 2: Paleta de Colores de la Tienda */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-amber-400" aria-hidden="true" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Paleta de Colores de la Tienda
            </h2>
            <p className="text-[11px] text-zinc-400">
              Personalizá la armonía visual del contenido principal eligiendo una paleta curada o
              definiendo tu color de acento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.values(THEME_PALETTES).map((p) => {
            const isSelected = themePalette === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectPreset(p.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-amber-400 bg-amber-950/20 ring-1 ring-amber-400"
                    : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-2xs inline-block shrink-0"
                    style={{ backgroundColor: p.accent }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-2xs inline-block shrink-0"
                    style={{ backgroundColor: p.bg }}
                  />
                </div>
                <p className="text-xs font-semibold text-zinc-100">{p.name}</p>
                <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{p.description}</p>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-zinc-800/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-300">
              Ajuste de Color de Acento (RGB y Hexadecimal):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <input
                id="primaryColorPicker"
                type="color"
                value={themePrimaryColor.length === 7 ? themePrimaryColor : "#926a3c"}
                onChange={(e) => onCustomColorChange(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                aria-label="Selector visual de color"
              />
              <div>
                <label
                  htmlFor="primaryColorHexInput"
                  className="block text-[10px] font-mono uppercase text-zinc-400"
                >
                  Hex
                </label>
                <input
                  id="primaryColorHexInput"
                  type="text"
                  value={themePrimaryColor}
                  onChange={(e) => onCustomColorChange(e.target.value)}
                  placeholder="#926a3c"
                  className="w-24 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <label htmlFor="rgbRInput" className="block text-[10px] font-mono text-zinc-400">
                  R (Rojo)
                </label>
                <input
                  id="rgbRInput"
                  type="number"
                  min={0}
                  max={255}
                  value={currentRgb.r}
                  onChange={(e) => handleRgbChange("r", parseInt(e.target.value, 10))}
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label htmlFor="rgbGInput" className="block text-[10px] font-mono text-zinc-400">
                  G (Verde)
                </label>
                <input
                  id="rgbGInput"
                  type="number"
                  min={0}
                  max={255}
                  value={currentRgb.g}
                  onChange={(e) => handleRgbChange("g", parseInt(e.target.value, 10))}
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label htmlFor="rgbBInput" className="block text-[10px] font-mono text-zinc-400">
                  B (Azul)
                </label>
                <input
                  id="rgbBInput"
                  type="number"
                  min={0}
                  max={255}
                  value={currentRgb.b}
                  onChange={(e) => handleRgbChange("b", parseInt(e.target.value, 10))}
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60">
              <span className="text-[11px] text-zinc-400">Vista previa de acento:</span>
              <span
                className="px-2.5 py-1 rounded-md text-xs font-bold shadow-xs transition-colors"
                style={{ backgroundColor: themePrimaryColor, color: previewTextColor }}
              >
                Aura Studio
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

