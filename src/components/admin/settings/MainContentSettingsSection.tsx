"use client";

import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  Megaphone,
  Palette,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import {
  AnnouncementBarConfig,
  CatalogConfig,
  DEFAULT_ANNOUNCEMENT_BAR,
  DEFAULT_CATALOG_CONFIG,
  DEFAULT_HOME_BLOCKS,
  HeroMode,
  HomeBlocksConfig,
} from "../../../services/settings.service";
import { THEME_PALETTES, hexToRgb, rgbToHex } from "../../../lib/theme/palettes";
import { THEME_FONTS } from "../../../lib/theme/fonts";

interface MainContentSettingsSectionProps {
  heroMode: HeroMode;
  heroTitle: string;
  heroSubtitle: string;
  heroBannerUrl: string;
  themePalette: string;
  themePrimaryColor: string;
  themeFont: string;
  announcementBar?: AnnouncementBarConfig;
  homeBlocks?: HomeBlocksConfig;
  catalogConfig?: CatalogConfig;
  onHeroModeChange: (mode: HeroMode) => void;
  onHeroTitleChange: (val: string) => void;
  onHeroSubtitleChange: (val: string) => void;
  onHeroBannerUrlChange: (val: string) => void;
  onSelectPreset: (paletteId: string) => void;
  onCustomColorChange: (hex: string) => void;
  onThemeFontChange: (fontId: string) => void;
  onAnnouncementBarChange?: (val: AnnouncementBarConfig) => void;
  onHomeBlocksChange?: (val: HomeBlocksConfig) => void;
  onCatalogConfigChange?: (val: CatalogConfig) => void;
}

export function MainContentSettingsSection({
  heroMode,
  heroTitle,
  heroSubtitle,
  heroBannerUrl,
  themePalette,
  themePrimaryColor,
  themeFont,
  announcementBar = DEFAULT_ANNOUNCEMENT_BAR,
  homeBlocks = DEFAULT_HOME_BLOCKS,
  catalogConfig = DEFAULT_CATALOG_CONFIG,
  onHeroModeChange,
  onHeroTitleChange,
  onHeroSubtitleChange,
  onHeroBannerUrlChange,
  onSelectPreset,
  onCustomColorChange,
  onThemeFontChange,
  onAnnouncementBarChange,
  onHomeBlocksChange,
  onCatalogConfigChange,
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

  const sortedBlocks = [...(homeBlocks.blocks || DEFAULT_HOME_BLOCKS.blocks)].sort(
    (a, b) => a.position - b.position
  );

  const handleToggleHomeBlock = (id: string) => {
    if (!onHomeBlocksChange) return;
    const nextBlocks = sortedBlocks.map((b) =>
      b.id === id ? { ...b, enabled: !b.enabled } : b
    );
    onHomeBlocksChange({ ...homeBlocks, blocks: nextBlocks });
  };

  const handleMoveHomeBlock = (index: number, direction: -1 | 1) => {
    if (!onHomeBlocksChange) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sortedBlocks.length) return;
    const next = [...sortedBlocks];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    const normalized = next.map((b, idx) => ({ ...b, position: idx }));
    onHomeBlocksChange({ ...homeBlocks, blocks: normalized });
  };

  return (
    <div
      id="settings-panel-main"
      role="tabpanel"
      aria-labelledby="settings-tab-main"
      className="space-y-5"
    >
      {/* Bloque 0: Barra de Anuncios Superior */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Megaphone size={16} className="text-amber-400" aria-hidden="true" />
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Barra de Anuncios Rotativa (36–40 px)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Avisos cortos arriba del header: promos bancarias, envío gratis o retiro en local.
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
            <input
              type="checkbox"
              checked={announcementBar.enabled}
              onChange={(e) =>
                onAnnouncementBarChange?.({
                  ...announcementBar,
                  enabled: e.target.checked,
                })
              }
              className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
            />
            <span>Activa</span>
          </label>
        </div>

        {announcementBar.enabled && (
          <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
            {(announcementBar.messages || []).map((msg, idx) => (
              <div
                key={msg.id || idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-2.5"
              >
                <div className="sm:col-span-7">
                  <input
                    type="text"
                    value={msg.text}
                    onChange={(e) => {
                      const next = [...announcementBar.messages];
                      next[idx] = { ...msg, text: e.target.value };
                      onAnnouncementBarChange?.({ ...announcementBar, messages: next });
                    }}
                    placeholder="Ej: 3 cuotas sin interés con bancos seleccionados"
                    aria-label={`Texto del anuncio ${idx + 1}`}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={msg.href || ""}
                    onChange={(e) => {
                      const next = [...announcementBar.messages];
                      next[idx] = { ...msg, href: e.target.value };
                      onAnnouncementBarChange?.({ ...announcementBar, messages: next });
                    }}
                    placeholder="/promociones o /catalogo"
                    aria-label={`Enlace del anuncio ${idx + 1}`}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const next = announcementBar.messages.filter((_, i) => i !== idx);
                      onAnnouncementBarChange?.({ ...announcementBar, messages: next });
                    }}
                    aria-label={`Eliminar anuncio ${idx + 1}`}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                const next = [
                  ...(announcementBar.messages || []),
                  {
                    id: `ann-${Date.now()}`,
                    text: "Envío bonificado desde $85.000",
                    href: "/catalogo",
                  },
                ];
                onAnnouncementBarChange?.({ ...announcementBar, messages: next });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Agregar mensaje</span>
            </button>
          </div>
        )}
      </div>

      {/* Bloque 1: Bloques de la Vidriera (Home Rediseñada) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} className="text-amber-400" aria-hidden="true" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Bloques de la Vidriera (Home)
            </h2>
            <p className="text-[11px] text-zinc-400">
              Activá, ocultá u ordená los bloques de tu página de inicio. Los bloques sin contenido se ocultan solos.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {sortedBlocks.map((block, index) => (
            <div
              key={block.id}
              className="flex items-center justify-between gap-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl px-3.5 py-2.5"
            >
              <label className="flex items-center gap-2.5 text-xs font-medium text-zinc-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.enabled}
                  onChange={() => handleToggleHomeBlock(block.id)}
                  className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
                />
                <span>{block.label}</span>
              </label>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveHomeBlock(index, -1)}
                  aria-label={`Subir bloque ${block.label}`}
                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  disabled={index === sortedBlocks.length - 1}
                  onClick={() => handleMoveHomeBlock(index, 1)}
                  aria-label={`Bajar bloque ${block.label}`}
                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <label htmlFor="newArrivalsDaysInput" className="text-xs font-medium text-zinc-300 block">
              Ventana de &ldquo;Recién llegados&rdquo; (días de antigüedad)
            </label>
            <p className="text-[11px] text-zinc-400">
              Por defecto: últimos 30 días desde la fecha de publicación del producto.
            </p>
          </div>
          <input
            id="newArrivalsDaysInput"
            type="number"
            min={1}
            max={365}
            value={homeBlocks.newArrivalsDays || 30}
            onChange={(e) =>
              onHomeBlocksChange?.({
                ...homeBlocks,
                newArrivalsDays: Math.max(1, parseInt(e.target.value, 10) || 30),
              })
            }
            className="w-24 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Bloque 1.5: Configuración del Catálogo (Tamaño de tanda y Filtros) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-amber-400" aria-hidden="true" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Catálogo y Paginación por Tandas
            </h2>
            <p className="text-[11px] text-zinc-400">
              Configurá cuántos productos se cargan por tanda (12 se reparte exacto en 2, 3 y 4 columnas).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-zinc-300 font-medium">Tamaño de tanda por página:</span>
          <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950 p-1 gap-1">
            {([12, 16, 24] as const).map((size) => {
              const active = (catalogConfig.pageSize || 12) === size;
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onCatalogConfigChange?.({
                      ...catalogConfig,
                      pageSize: size,
                    })
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? "bg-amber-300 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {size} productos {size === 12 ? "(Recomendado)" : ""}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bloque 2: Portada y Hero del Catálogo (Home) */}
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

      {/* Bloque 3: Paleta de Colores de la Tienda */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-amber-400" aria-hidden="true" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Paleta de Colores de la Tienda
            </h2>
            <p className="text-[11px] text-zinc-400">
              Personalizá la armonía visual de tu tienda eligiendo una paleta curada o
              definiendo tu color de acento propio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-2xs inline-block shrink-0"
                    style={{ backgroundColor: p.accent }}
                    title={`Acento: ${p.accent}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-2xs inline-block shrink-0"
                    style={{ backgroundColor: p.bg }}
                    title={`Fondo: ${p.bg}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-2xs inline-block shrink-0"
                    style={{ backgroundColor: p.border }}
                    title={`Borde: ${p.border}`}
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
                className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
                style={{ backgroundColor: themePrimaryColor, color: previewTextColor }}
              >
                Aura Studio
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bloque 4: Tipografía de la Marca (Estilo de Fuente y Títulos) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Type size={16} className="text-amber-400" aria-hidden="true" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Tipografía de la Marca (Estilo de Fuente)
            </h2>
            <p className="text-[11px] text-zinc-400">
              Elegí la personalidad tipográfica para los títulos, nombres de prendas y encabezados de tu tienda.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(THEME_FONTS).map((f) => {
            const isSelected = themeFont === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onThemeFontChange(f.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-amber-400 bg-amber-950/20 ring-1 ring-amber-400"
                    : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-xs font-bold text-zinc-100">{f.name}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {f.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                    {f.description}
                  </p>
                </div>

                {/* Muestra de Espécimen Tipográfico con la fuente real */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/50">
                  <p
                    className="text-sm font-medium text-zinc-100 truncate"
                    style={{ fontFamily: f.serifFont }}
                  >
                    {f.sampleHeading}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {f.sampleSubtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
