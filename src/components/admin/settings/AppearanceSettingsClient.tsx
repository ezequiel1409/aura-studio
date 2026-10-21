"use client";

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Image as ImageIcon,
  Laptop,
  Layers,
  Loader2,
  Moon,
  Palette,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { HomeBanner, Promotion } from "../../../domain/promotion/types";
import { ShowroomSettings } from "../../../services/settings.service";
import { THEME_PALETTES, ThemePalette } from "../../../lib/theme/palettes";
import { calculateContrastRatio } from "../../../lib/theme/contrast";

interface AppearanceSettingsClientProps {
  initialSettings: ShowroomSettings;
  initialBanners: HomeBanner[];
  activePromotions: Promotion[];
}

export function AppearanceSettingsClient({
  initialSettings,
  initialBanners,
  activePromotions,
}: AppearanceSettingsClientProps) {
  // Estado de Portada / Banners
  const [banners, setBanners] = useState<HomeBanner[]>(initialBanners);
  const [heroTitle, setHeroTitle] = useState(initialSettings.heroTitle || "Nueva Colección 2026");
  const [heroSubtitle, setHeroSubtitle] = useState(
    initialSettings.heroSubtitle || "Piezas seleccionadas en edición limitada"
  );
  const [heroBannerUrl, setHeroBannerUrl] = useState(
    initialSettings.heroBannerUrl ||
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80"
  );

  // Estado de Apariencia
  const [themePalette, setThemePalette] = useState(initialSettings.themePalette || "lino");
  const [themePrimaryColor, setThemePrimaryColor] = useState(
    initialSettings.themePrimaryColor || THEME_PALETTES[initialSettings.themePalette || "lino"]?.accent || "#926a3c"
  );
  const [themeBgColor, setThemeBgColor] = useState(initialSettings.themeBgColor || "");
  const [themeSurfaceColor, setThemeSurfaceColor] = useState(initialSettings.themeSurfaceColor || "");
  const [themeHeaderBgColor, setThemeHeaderBgColor] = useState(initialSettings.themeHeaderBgColor || "");
  const [themeFooterBgColor, setThemeFooterBgColor] = useState(initialSettings.themeFooterBgColor || "");
  const [themeFont, setThemeFont] = useState(initialSettings.themeFont || "cormorant");

  // Estado de Vista Previa (Escritorio vs Celular, Claro vs Oscuro)
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [previewThemeMode, setPreviewThemeMode] = useState<"light" | "dark">("light");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const activePalette = THEME_PALETTES[themePalette] || THEME_PALETTES.lino;

  // Validador de contraste (ADM-06)
  const contrastResult = useMemo(() => {
    // Texto blanco o color acento sobre fondo
    return calculateContrastRatio(themePrimaryColor, activePalette.bg);
  }, [themePrimaryColor, activePalette]);

  const activeBanner = banners.find((b) => b.isActive) || banners[0] || null;

  const handlePaletteSelect = (palId: string) => {
    const pal = THEME_PALETTES[palId];
    if (pal) {
      setThemePalette(palId);
      setThemePrimaryColor(pal.accent);
      setThemeBgColor(pal.bg);
      setThemeSurfaceColor(pal.surface);
      setThemeHeaderBgColor(pal.bg);
      setThemeFooterBgColor(pal.surface);
    }
  };

  const handleResetColorsToPalette = () => {
    const pal = THEME_PALETTES[themePalette] || THEME_PALETTES.lino;
    setThemePrimaryColor(pal.accent);
    setThemeBgColor("");
    setThemeSurfaceColor("");
    setThemeHeaderBgColor("");
    setThemeFooterBgColor("");
  };

  const handleToggleBannerActive = (bannerId: number) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const handleMoveBanner = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;
    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIdx];
    newBanners[targetIdx] = temp;
    setBanners(newBanners);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroTitle,
          heroSubtitle,
          heroBannerUrl,
          themePalette,
          themePrimaryColor,
          themeBgColor: themeBgColor.trim() || null,
          themeSurfaceColor: themeSurfaceColor.trim() || null,
          themeHeaderBgColor: themeHeaderBgColor.trim() || null,
          themeFooterBgColor: themeFooterBgColor.trim() || null,
          themeFont,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar la configuración.");
      }

      setFeedback({
        type: "ok",
        text: "Portada y apariencia guardadas correctamente. Actualizado en la tienda en vivo.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error al conectar con el servidor.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
          Tienda › Portada y Apariencia (ADM-06)
        </span>
        <h1 className="text-xl sm:text-2xl font-serif font-light text-zinc-100 mt-1">
          Editor de Portada, Colores y Vista Previa
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Personalizá los banners de la home y la identidad visual con control de contraste WCAG AA.
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === "ok"
              ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
              : "bg-rose-950/60 border border-rose-800 text-rose-300"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Editor a 2 Columnas (ADM-06) */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECCIÓN A: Portada (Banners y Carrusel) */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <ImageIcon size={15} className="text-amber-400" />
                <span>Sección A: Portada Principal</span>
              </h2>
              <span className="text-[11px] text-zinc-500 font-mono">
                {banners.length} {banners.length === 1 ? "banner" : "banners"}
              </span>
            </div>

            {/* Banner Principal / Fallback */}
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="hero-title-input"
                  className="block text-xs font-medium text-zinc-300 mb-1"
                >
                  Título del Banner Principal
                </label>
                <input
                  id="hero-title-input"
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="hero-subtitle-input"
                  className="block text-xs font-medium text-zinc-300 mb-1"
                >
                  Bajada o Subtítulo
                </label>
                <input
                  id="hero-subtitle-input"
                  type="text"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="hero-banner-url-input"
                  className="block text-xs font-medium text-zinc-300 mb-1"
                >
                  URL de Imagen de Fondo (Escritorio)
                </label>
                <input
                  id="hero-banner-url-input"
                  type="url"
                  value={heroBannerUrl}
                  onChange={(e) => setHeroBannerUrl(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 font-mono text-xs focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Listado de Banners Adicionales */}
            {banners.length > 0 && (
              <div className="pt-2 border-t border-zinc-800 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Slides en carrusel
                </span>
                <ul className="space-y-2 list-none p-0 m-0">
                  {banners.map((banner, idx) => (
                    <li
                      key={banner.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={banner.desktopImageUrl || undefined}
                          alt={banner.title}
                          className="h-10 w-14 object-cover rounded-lg shrink-0 border border-zinc-800"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-200 truncate">{banner.title}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{banner.ctaLabel} → {banner.ctaHref}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBannerActive(banner.id)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            banner.isActive
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {banner.isActive ? "Activo" : "Pausado"}
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveBanner(idx, "up")}
                          aria-label="Subir orden"
                          className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === banners.length - 1}
                          onClick={() => handleMoveBanner(idx, "down")}
                          aria-label="Bajar orden"
                          className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* SECCIÓN B: Apariencia y Colores */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Palette size={15} className="text-amber-400" />
                <span>Sección B: Apariencia, Colores y Tipografía</span>
              </h2>
            </div>

            {/* Paletas Predefinidas */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">
                Paleta de Colores Curada
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.values(THEME_PALETTES).map((pal) => {
                  const isSelected = themePalette === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => handlePaletteSelect(pal.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400"
                          : "border-zinc-800 hover:border-zinc-700 bg-zinc-950"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-zinc-200 truncate">
                          {pal.name}
                        </span>
                        {isSelected && <Check size={12} className="text-amber-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-black/30"
                          style={{ backgroundColor: pal.bg }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-black/30"
                          style={{ backgroundColor: pal.accent }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-black/30"
                          style={{ backgroundColor: pal.text }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personalización Total de Colores (Fondo, Cabecera, Contenido, Footer y Acento) */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Personalización Integral de Colores
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Ajustá el fondo, la cabecera, las tarjetas y los botones según la identidad de tu marca.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetColorsToPalette}
                  className="text-[11px] font-semibold text-amber-300 hover:underline cursor-pointer"
                >
                  Restablecer a valores de paleta
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Color de Acento / Botones */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1.5">
                  <label htmlFor="accent-color-input" className="block text-xs font-medium text-zinc-300">
                    Acento / Botones de compra
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="accent-color-picker"
                      type="color"
                      value={themePrimaryColor}
                      onChange={(e) => setThemePrimaryColor(e.target.value)}
                      className="h-8 w-10 rounded border border-zinc-700 bg-zinc-900 p-0.5 cursor-pointer"
                    />
                    <input
                      id="accent-color-input"
                      type="text"
                      value={themePrimaryColor}
                      onChange={(e) => setThemePrimaryColor(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. Color de Fondo de Página */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1.5">
                  <label htmlFor="bg-color-input" className="block text-xs font-medium text-zinc-300">
                    Fondo de la Página
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="bg-color-picker"
                      type="color"
                      value={themeBgColor || activePalette.bg}
                      onChange={(e) => setThemeBgColor(e.target.value)}
                      className="h-8 w-10 rounded border border-zinc-700 bg-zinc-900 p-0.5 cursor-pointer"
                    />
                    <input
                      id="bg-color-input"
                      type="text"
                      placeholder={activePalette.bg}
                      value={themeBgColor}
                      onChange={(e) => setThemeBgColor(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3. Color de Cabecera (Header) */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1.5">
                  <label htmlFor="header-bg-input" className="block text-xs font-medium text-zinc-300">
                    Fondo de Cabecera (Header)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="header-bg-picker"
                      type="color"
                      value={themeHeaderBgColor || activePalette.bg}
                      onChange={(e) => setThemeHeaderBgColor(e.target.value)}
                      className="h-8 w-10 rounded border border-zinc-700 bg-zinc-900 p-0.5 cursor-pointer"
                    />
                    <input
                      id="header-bg-input"
                      type="text"
                      placeholder={activePalette.bg}
                      value={themeHeaderBgColor}
                      onChange={(e) => setThemeHeaderBgColor(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 4. Color de Superficie / Tarjetas */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1.5">
                  <label htmlFor="surface-color-input" className="block text-xs font-medium text-zinc-300">
                    Superficie / Tarjetas
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="surface-color-picker"
                      type="color"
                      value={themeSurfaceColor || activePalette.surface}
                      onChange={(e) => setThemeSurfaceColor(e.target.value)}
                      className="h-8 w-10 rounded border border-zinc-700 bg-zinc-900 p-0.5 cursor-pointer"
                    />
                    <input
                      id="surface-color-input"
                      type="text"
                      placeholder={activePalette.surface}
                      value={themeSurfaceColor}
                      onChange={(e) => setThemeSurfaceColor(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 5. Color de Pie de Página (Footer) */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1.5">
                  <label htmlFor="footer-bg-input" className="block text-xs font-medium text-zinc-300">
                    Fondo de Pie de Página (Footer)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="footer-bg-picker"
                      type="color"
                      value={themeFooterBgColor || activePalette.surface}
                      onChange={(e) => setThemeFooterBgColor(e.target.value)}
                      className="h-8 w-10 rounded border border-zinc-700 bg-zinc-900 p-0.5 cursor-pointer"
                    />
                    <input
                      id="footer-bg-input"
                      type="text"
                      placeholder={activePalette.surface}
                      value={themeFooterBgColor}
                      onChange={(e) => setThemeFooterBgColor(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 font-mono placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 6. Selector de Tipografía */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1.5">
                  <label htmlFor="font-select" className="block text-xs font-medium text-zinc-300">
                    Tipografía de Títulos
                  </label>
                  <select
                    id="font-select"
                    value={themeFont}
                    onChange={(e) => setThemeFont(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="cormorant">Cormorant Garamond (Editorial Clásico)</option>
                    <option value="playfair">Playfair Display (Alta Costura)</option>
                    <option value="dm_serif">DM Serif Display (Moderno y Rotundo)</option>
                    <option value="montserrat">Montserrat (Contemporáneo Geométrico)</option>
                  </select>
                </div>
              </div>

              {/* Callout para desarrollo de tipografía exclusiva */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-400/5 border border-amber-400/20 text-xs text-zinc-300">
                <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-amber-300">
                    ¿Tu marca utiliza una tipografía exclusiva?
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Las fuentes predefinidas garantizan velocidad editorial instantánea. Si tu comercio requiere incorporar una fuente corporativa con licencia (.woff2 o Adobe Fonts), podés solicitar un desarrollo específico a nuestro equipo de diseño.
                  </p>
                </div>
              </div>
            </div>

            {/* VALIDADOR DE CONTRASTE WCAG 2.2 (ADM-06) */}
            <div
              className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                contrastResult.status === "success"
                  ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                  : contrastResult.status === "warning"
                  ? "bg-amber-950/40 border-amber-800/80 text-amber-300"
                  : "bg-rose-950/40 border-rose-800/80 text-rose-300"
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={15} />
                  <span>Validador de Contraste WCAG 2.2 AA</span>
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-black/40">
                  {contrastResult.ratioString}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">{contrastResult.statusText}</p>
              {contrastResult.suggestion && (
                <p className="text-[11px] opacity-90 italic pt-0.5">
                  {contrastResult.suggestion}
                </p>
              )}
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md hover:bg-amber-300 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Guardando apariencia...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Guardar portada y apariencia</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa Fija (Sticky) de la Home (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 space-y-3.5">
            {/* Controles de vista previa: Escritorio / Celular y Claro / Oscuro */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Eye size={14} className="text-amber-400" />
                <span>Vista Previa de la Home</span>
              </span>

              <div className="flex items-center gap-1.5">
                {/* Selector Dispositivo */}
                <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("desktop")}
                    aria-label="Vista escritorio"
                    className={`p-1.5 rounded-md transition-colors ${
                      previewViewport === "desktop"
                        ? "bg-zinc-800 text-amber-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Laptop size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("mobile")}
                    aria-label="Vista celular"
                    className={`p-1.5 rounded-md transition-colors ${
                      previewViewport === "mobile"
                        ? "bg-zinc-800 text-amber-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Smartphone size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Marco de Simulación de la Tienda Pública */}
            <div
              className={`mx-auto transition-all duration-300 rounded-xl overflow-hidden border border-[#d8d2c7] shadow-xl ${
                previewViewport === "mobile"
                  ? "max-w-[320px] text-[11px]"
                  : "w-full text-xs"
              }`}
              style={{
                backgroundColor: themeBgColor || activePalette.bg,
                color: activePalette.text,
              }}
            >
              {/* Barra superior de anuncios simulada */}
              <div
                className="py-1 px-3 text-center text-[10px] font-semibold text-white tracking-wider uppercase transition-colors"
                style={{ backgroundColor: themePrimaryColor }}
              >
                Hasta 3 cuotas sin interés · Envíos a todo el país
              </div>

              {/* Header simulado */}
              <div className="px-4 py-2.5 border-b border-[#e7e2da] flex items-center justify-between" style={{ backgroundColor: themeHeaderBgColor || activePalette.surface }}>
                <span className="font-serif font-bold uppercase tracking-wider text-stone-900 text-xs">
                  {initialSettings.showroomName || "Aura Studio"}
                </span>
                <span className="text-[10px] text-stone-500">Bolsa (0)</span>
              </div>

              {/* Hero Banner en vivo */}
              <div
                className="relative min-h-[160px] sm:min-h-[200px] flex flex-col justify-end p-4 text-white bg-cover bg-center overflow-hidden"
                style={{
                  backgroundImage: `url(${heroBannerUrl})`,
                }}
              >
                <div className="absolute inset-0 bg-black/45" />
                <div className="relative z-10 space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-300 font-bold block">
                    Novedades
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-light text-white leading-tight">
                    {heroTitle}
                  </h3>
                  <p className="text-[11px] text-stone-200 line-clamp-1">
                    {heroSubtitle}
                  </p>
                  <div className="pt-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase text-white shadow-xs"
                      style={{ backgroundColor: themePrimaryColor }}
                    >
                      <span>Descubrir piezas</span>
                      <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque Promociones Bancarias Simulado */}
              <div className="p-4 space-y-2 bg-white/70">
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-800">
                  <span>Promociones Bancarias</span>
                  <span className="text-[10px] text-stone-500">Ver todas →</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-lg border border-[#e7e2da] bg-white">
                    <p className="font-bold text-stone-900">Banco Galicia</p>
                    <p className="text-stone-500">3 cuotas sin interés</p>
                  </div>
                  <div className="p-2 rounded-lg border border-[#e7e2da] bg-white">
                    <p className="font-bold text-stone-900">Banco Santander</p>
                    <p className="text-stone-500">20% de reintegro</p>
                  </div>
                </div>
              </div>

              {/* Pie de frame informativo */}
              <div className="p-2 text-center text-[10px] text-stone-500 bg-white/90 border-t border-[#e7e2da]">
                © {new Date().getFullYear()} {initialSettings.showroomName}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
              <span>Actualización reactiva sin recargar (&lt; 300 ms)</span>
              <span className="text-emerald-400 font-mono">En vivo</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
