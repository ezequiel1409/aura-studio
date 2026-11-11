"use client";

import { useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  Eye,
  Image as ImageIcon,
  Laptop,
  Layers,
  LayoutGrid,
  Loader2,
  Maximize2,
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
import { NavigationSection, ProductAttributeDefinition } from "../../../domain/navigation/types";
import { Category } from "../../../domain/category/types";
import {
  ShowroomSettings,
  StoreContentWidth,
  STORE_CONTENT_WIDTHS,
  DEFAULT_STORE_CONTENT_WIDTH,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_NAVBAR_CONFIG,
  FooterConfig,
  NavbarConfig,
} from "../../../services/settings.service";
import { THEME_PALETTES, ThemePalette, hexToRgb, normalizeHexColor } from "../../../lib/theme/palettes";
import { THEME_FONTS } from "../../../lib/theme/fonts";
import { calculateContrastRatio } from "../../../lib/theme/contrast";
import { BannerCarouselManager } from "./BannerCarouselManager";
import { FooterCmsManager } from "./FooterCmsManager";
import { NavbarSettingsManager } from "./NavbarSettingsManager";
import { HomeSectionsManager } from "./HomeSectionsManager";

interface AppearanceSettingsClientProps {
  initialSettings: ShowroomSettings;
  initialBanners: HomeBanner[];
  activePromotions: Promotion[];
  initialSections?: NavigationSection[];
  categories?: Category[];
  attributes?: ProductAttributeDefinition[];
}

type AppearanceTab = "navbar" | "sections" | "banners" | "appearance" | "footer";


interface ColorSettingCardProps {
  id: string;
  label: string;
  description: string;
  value: string;
  fallback: string;
  onChange: (val: string) => void;
  onReset: () => void;
}

function ColorSettingCard({
  id,
  label,
  description,
  value,
  fallback,
  onChange,
  onReset,
}: ColorSettingCardProps) {
  const effectiveHex = normalizeHexColor(value || fallback, fallback);
  const rgb = hexToRgb(effectiveHex) || { r: 0, g: 0, b: 0 };
  const isCustom = Boolean(value && value.trim().toLowerCase() !== fallback.trim().toLowerCase());

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2.5 min-w-0 transition-colors hover:border-zinc-700">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <label htmlFor={`${id}-input`} className="block text-xs font-semibold text-zinc-200 truncate" title={label}>
          {label}
        </label>
        {isCustom && (
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] font-semibold text-amber-300 hover:text-amber-200 hover:underline shrink-0 cursor-pointer"
            title="Volver al color de la paleta"
          >
            Restablecer
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 min-w-0">
        {/* Selector Visual / Swatch */}
        <div
          className="relative w-9 h-9 shrink-0 rounded-xl border border-zinc-700 shadow-inner overflow-hidden cursor-pointer flex items-center justify-center transition-transform hover:scale-105"
          title={`Seleccionar color visual para ${label}`}
        >
          <input
            id={`${id}-picker`}
            type="color"
            value={effectiveHex}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer opacity-0 z-10"
            aria-label={`Selector de color para ${label}`}
          />
          <div
            className="w-full h-full pointer-events-none rounded-lg"
            style={{ backgroundColor: effectiveHex }}
          />
        </div>

        {/* Input Hexadecimal */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs select-none pointer-events-none">
            #
          </span>
          <input
            id={`${id}-input`}
            type="text"
            value={value ? value.replace(/^#/, "") : ""}
            placeholder={fallback.replace(/^#/, "")}
            onChange={(e) => {
              const cleaned = e.target.value.trim().replace(/^#/, "");
              onChange(cleaned ? `#${cleaned}` : "");
            }}
            maxLength={6}
            className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-900 pl-6 pr-2.5 py-1.5 text-xs text-zinc-100 font-mono uppercase focus:border-amber-400 focus:outline-none"
          />
        </div>

        {/* Mini Pill de valores RGB para verificación precisa */}
        <span
          className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 px-2 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 shrink-0"
          title={`RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}`}
        >
          {rgb.r},{rgb.g},{rgb.b}
        </span>
      </div>

      <p className="text-[11px] text-zinc-400 leading-tight truncate" title={description}>
        {description}
      </p>
    </div>
  );
}

export function AppearanceSettingsClient({
  initialSettings,
  initialBanners,
  activePromotions,
  initialSections = [],
  categories = [],
  attributes = [],
}: AppearanceSettingsClientProps) {
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab") as AppearanceTab | null;
  const validTabs: AppearanceTab[] = ["navbar", "sections", "banners", "appearance", "footer"];
  const [activeTab, setActiveTab] = useState<AppearanceTab>(
    queryTab && validTabs.includes(queryTab) ? queryTab : "navbar"
  );

  const [navbarConfig, setNavbarConfig] = useState<NavbarConfig>(
    () => initialSettings.navbarConfig || DEFAULT_NAVBAR_CONFIG
  );
  const [sections, setSections] = useState<NavigationSection[]>(initialSections);

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
  const [contentWidth, setContentWidth] = useState<StoreContentWidth>(
    initialSettings.contentWidth || DEFAULT_STORE_CONTENT_WIDTH
  );
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(() => {
    return initialSettings.footerConfig || DEFAULT_FOOTER_CONFIG;
  });

  // Estado de Vista Previa (Escritorio vs Celular, Claro vs Oscuro)
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [previewThemeMode, setPreviewThemeMode] = useState<"light" | "dark">("light");
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const activePalette = THEME_PALETTES[themePalette] || THEME_PALETTES.lino;

  // Validador de contraste (ADM-06)
  const contrastResult = useMemo(() => {
    // Texto blanco o color acento sobre fondo
    return calculateContrastRatio(themePrimaryColor, activePalette.bg);
  }, [themePrimaryColor, activePalette]);

  // Slides activos para el carrusel en vivo de la vista previa
  const activeSlides = useMemo(() => {
    const active = banners.filter((b) => b.isActive);
    if (active.length > 0) return active;
    return [
      {
        id: 0,
        title: heroTitle || "Nueva Colección 2026",
        subtitle: heroSubtitle || "Piezas seleccionadas en edición limitada",
        desktopImageUrl: heroBannerUrl,
        mobileImageUrl: heroBannerUrl,
        ctaLabel: "Descubrir piezas",
        ctaHref: "/catalogo",
        promotionSlug: null,
        startsAt: null,
        endsAt: null,
        position: 0,
        isActive: true,
      },
    ];
  }, [banners, heroTitle, heroSubtitle, heroBannerUrl]);

  const currentPreviewSlide = activeSlides[previewSlideIndex % activeSlides.length];
  const previewImageUrl =
    previewViewport === "mobile" && currentPreviewSlide.mobileImageUrl
      ? currentPreviewSlide.mobileImageUrl
      : currentPreviewSlide.desktopImageUrl || heroBannerUrl;

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      if (activeTab === "navbar") {
        const res = await fetch("/api/admin/nav", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ navbarConfig }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "No se pudo guardar la configuración de la navegación.");
        }

        setFeedback({
          type: "ok",
          text: "Cabecera y navegación guardadas correctamente en /api/admin/nav.",
        });
      } else {
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
            contentWidth,
            footerConfig,
            navbarConfig,
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
      }
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
      {/* Encabezado Principal */}
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
          Tienda › Portada y Apariencia
        </span>
        <h1 className="text-xl sm:text-2xl font-serif font-light text-zinc-100 mt-1">
          Diseño y Personalización de la Tienda
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configurá los banners de inicio, la paleta de colores y la estructura del pie de página.
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

      {/* Pestañas de Navegación de Portada y Apariencia */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("navbar")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "navbar"
              ? "bg-amber-400 text-zinc-950 shadow-sm"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <Compass size={15} />
          <span>Cabecera y Navbar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sections")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "sections"
              ? "bg-amber-400 text-zinc-950 shadow-sm"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <LayoutGrid size={15} />
          <span>Secciones de la Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("banners")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "banners"
              ? "bg-amber-400 text-zinc-950 shadow-sm"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <ImageIcon size={15} />
          <span>Banners de Portada</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("appearance")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "appearance"
              ? "bg-amber-400 text-zinc-950 shadow-sm"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <Palette size={15} />
          <span>Estilos y Ancho</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("footer")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "footer"
              ? "bg-amber-400 text-zinc-950 shadow-sm"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <Layers size={15} />
          <span>Pie de Página (Footer CMS)</span>
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === "navbar" && (
          <NavbarSettingsManager
            config={navbarConfig}
            onChange={setNavbarConfig}
            sections={sections}
            categories={categories}
          />
        )}

        {activeTab === "sections" && (
          <HomeSectionsManager
            sections={sections}
            onSectionsChange={setSections}
            categories={categories}
            attributes={attributes}
          />
        )}

        {activeTab === "footer" && (
          <div className="space-y-4 pt-1">
            <FooterCmsManager
              footerConfig={footerConfig}
              onChange={setFooterConfig}
              mercadopagoEnabled={initialSettings.mercadopagoEnabled}
              transferEnabled={initialSettings.transferEnabled}
              cashEnabled={initialSettings.cashEnabled}
            />
          </div>
        )}

        {(activeTab === "banners" || activeTab === "appearance") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Editor (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {activeTab === "banners" && (
                <BannerCarouselManager
                  banners={banners}
                  onBannersChange={setBanners}
                  activePromotions={activePromotions}
                  heroTitle={heroTitle}
                  heroSubtitle={heroSubtitle}
                  heroBannerUrl={heroBannerUrl}
                  onHeroTitleChange={setHeroTitle}
                  onHeroSubtitleChange={setHeroSubtitle}
                  onHeroBannerUrlChange={setHeroBannerUrl}
                />
              )}

              {activeTab === "appearance" && (
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                      <Palette size={15} className="text-amber-400" />
                      <span>Identidad Visual, Paleta y Tipografía</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {/* 1. Color de Acento / Botones */}
                <ColorSettingCard
                  id="accent-color"
                  label="Acento / Botones de compra"
                  description="Botones de compra, badges y llamadas a la acción principales"
                  value={themePrimaryColor}
                  fallback={activePalette.accent}
                  onChange={(val) => setThemePrimaryColor(val)}
                  onReset={() => setThemePrimaryColor(activePalette.accent)}
                />

                {/* 2. Color de Fondo de Página */}
                <ColorSettingCard
                  id="bg-color"
                  label="Fondo de la Página"
                  description="Lienzo de fondo del catálogo y páginas públicas"
                  value={themeBgColor}
                  fallback={activePalette.bg}
                  onChange={(val) => setThemeBgColor(val)}
                  onReset={() => setThemeBgColor("")}
                />

                {/* 3. Color de Cabecera (Header) */}
                <ColorSettingCard
                  id="header-bg"
                  label="Fondo de Cabecera (Header)"
                  description="Barra superior fija donde se sitúa el logo y la navegación"
                  value={themeHeaderBgColor}
                  fallback={activePalette.bg}
                  onChange={(val) => setThemeHeaderBgColor(val)}
                  onReset={() => setThemeHeaderBgColor("")}
                />

                {/* 4. Color de Superficie / Tarjetas */}
                <ColorSettingCard
                  id="surface-color"
                  label="Superficie / Tarjetas"
                  description="Fondo de tarjetas de producto, modales y cajones"
                  value={themeSurfaceColor}
                  fallback={activePalette.surface}
                  onChange={(val) => setThemeSurfaceColor(val)}
                  onReset={() => setThemeSurfaceColor("")}
                />

                {/* 5. Color de Pie de Página (Footer) */}
                <ColorSettingCard
                  id="footer-bg"
                  label="Fondo de Pie de Página (Footer)"
                  description="Base del pie de página donde figura la información legal y data fiscal"
                  value={themeFooterBgColor}
                  fallback={activePalette.surface}
                  onChange={(val) => setThemeFooterBgColor(val)}
                  onReset={() => setThemeFooterBgColor("")}
                />

                {/* 6. Selector de Tipografía */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2.5 min-w-0 transition-colors hover:border-zinc-700">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <label htmlFor="font-select" className="block text-xs font-semibold text-zinc-200 truncate">
                      Tipografía de Títulos
                    </label>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 pt-0.5">
                    <Type size={16} className="text-amber-400 shrink-0" aria-hidden="true" />
                    <select
                      id="font-select"
                      value={themeFont}
                      onChange={(e) => setThemeFont(e.target.value)}
                      className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none cursor-pointer"
                    >
                      {Object.values(THEME_FONTS).map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight truncate">
                    Fuente tipográfica para titulares, marcas y logotipos
                  </p>
                </div>
              </div>

  
            {/* Control de Ancho y Espaciado de la Tienda (Layout Width & Spacing) */}
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                    <Maximize2 size={14} className="text-amber-400" />
                    <span>Ancho y Espaciado del Contenido de la Tienda (Layout)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Definí la amplitud con la que se distribuyen las piezas y bloques en el navegador.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.values(STORE_CONTENT_WIDTHS).map((opt) => {
                  const isSelected = contentWidth === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setContentWidth(opt.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400"
                          : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/70"
                      }`}
                    >
                      <div>
                        {/* Mini diagrama visual de proporciones del layout */}
                        <div className="w-full h-10 rounded-lg bg-zinc-900 border border-zinc-800 p-1.5 mb-2.5 flex items-center justify-center">
                          <div
                            className={`h-full rounded bg-amber-400/30 border border-amber-400/60 transition-all ${
                              opt.id === "compact"
                                ? "w-1/2"
                                : opt.id === "standard"
                                ? "w-2/3"
                                : opt.id === "wide"
                                ? "w-5/6"
                                : "w-full"
                            }`}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-zinc-100">
                            {opt.shortLabel}
                          </span>
                          {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                        </div>

                        {opt.recommended && (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full mb-1.5">
                            Recomendado WCAG
                          </span>
                        )}

                        <p className="text-[11px] text-zinc-400 leading-snug">
                          {opt.description}
                        </p>
                      </div>

                      <div className="pt-2 text-[10px] font-mono text-zinc-500">
                        Max: {opt.maxWidthCss}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Nota de accesibilidad sobre ancho de línea y ergonomía de lectura */}
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                <strong className="text-zinc-200">Estrategia de Accesibilidad (WCAG 2.1 - Criterio 1.4.8):</strong> El ancho <em className="text-zinc-200 font-medium">Estándar Editorial (1280px)</em> mantiene los bloques de texto dentro del rango óptimo de 60 a 80 caracteres por línea para una lectura descansada. Si seleccionás <em className="text-zinc-200 font-medium">Ancho Completo (100%)</em> o <em className="text-zinc-200 font-medium">Amplio</em>, el sistema extiende la grilla de productos a los extremos pero mantiene márgenes laterales de seguridad automáticos y columnas de lectura acotadas para no perder legibilidad en monitores 4K y ultrawide.
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
                  <span>Legibilidad y Contraste de Marca</span>
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
        )}
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

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                  {STORE_CONTENT_WIDTHS[contentWidth]?.shortLabel || "Estándar"}
                </span>
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
              <div className="border-b border-[#e7e2da] transition-all" style={{ backgroundColor: themeHeaderBgColor || activePalette.surface }}>
                <div
                  className={`px-4 py-2.5 flex items-center justify-between transition-all duration-300 ${
                    previewViewport === "desktop"
                      ? contentWidth === "compact"
                        ? "max-w-[78%] mx-auto"
                        : contentWidth === "standard"
                        ? "max-w-[88%] mx-auto"
                        : contentWidth === "wide"
                        ? "max-w-[96%] mx-auto"
                        : "w-full"
                      : "w-full"
                  }`}
                >
                  <span className="font-serif font-bold uppercase tracking-wider text-stone-900 text-xs">
                    {initialSettings.showroomName || "Mi Tienda"}
                  </span>
                  <span className="text-[10px] text-stone-500">Bolsa (0)</span>
                </div>
              </div>

              {/* Hero Banner en vivo (Carrusel Dinámico) */}
              <div
                className="relative min-h-[170px] sm:min-h-[220px] flex flex-col justify-end p-4 text-white bg-cover bg-center overflow-hidden transition-all duration-300"
                style={{
                  backgroundImage: `url(${previewImageUrl})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/55 to-stone-950/30" />
                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-amber-300 font-bold block">
                      {currentPreviewSlide.promotionSlug ? "Promoción Bancaria" : "Novedades"}
                    </span>
                    {activeSlides.length > 1 && (
                      <span className="text-[9px] font-mono bg-black/60 text-stone-300 px-1.5 py-0.5 rounded">
                        Slide {(previewSlideIndex % activeSlides.length) + 1} de {activeSlides.length}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl font-light text-white leading-tight">
                    {currentPreviewSlide.title}
                  </h3>
                  {currentPreviewSlide.subtitle && (
                    <p className="text-[11px] text-stone-200 line-clamp-2">
                      {currentPreviewSlide.subtitle}
                    </p>
                  )}
                  <div className="pt-2 flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase text-white shadow-xs"
                      style={{ backgroundColor: themePrimaryColor }}
                    >
                      <span>{currentPreviewSlide.ctaLabel || "Explorar"}</span>
                      <ArrowRight size={10} />
                    </span>

                    {/* Controles de navegación en vivo en la vista previa */}
                    {activeSlides.length > 1 && (
                      <div className="flex items-center gap-1 bg-black/70 rounded-full px-2 py-0.5 border border-white/20">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewSlideIndex(
                              (prev) => (prev - 1 + activeSlides.length) % activeSlides.length
                            )
                          }
                          aria-label="Ver slide anterior en vista previa"
                          className="p-1 hover:text-amber-300 text-white cursor-pointer"
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewSlideIndex(
                              (prev) => (prev + 1) % activeSlides.length
                            )
                          }
                          aria-label="Ver slide siguiente en vista previa"
                          className="p-1 hover:text-amber-300 text-white cursor-pointer"
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bloque Promociones Bancarias Simulado */}
              <div className="bg-white/70 transition-all">
                <div
                  className={`p-4 space-y-2 transition-all duration-300 ${
                    previewViewport === "desktop"
                      ? contentWidth === "compact"
                        ? "max-w-[78%] mx-auto"
                        : contentWidth === "standard"
                        ? "max-w-[88%] mx-auto"
                        : contentWidth === "wide"
                        ? "max-w-[96%] mx-auto"
                        : "w-full"
                      : "w-full"
                  }`}
                >
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
      </div>
    )}

        {/* Barra de Guardado Global (para navbar, banners, estilos y footer) */}
        {activeTab !== "sections" && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-400 text-center sm:text-left">
              {activeTab === "navbar"
                ? "Los cambios de navegación se guardan en el endpoint dedicado /api/admin/nav."
                : "Los cambios se guardan y aplican inmediatamente en la tienda en vivo."}
            </p>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-bold tracking-wider text-zinc-950 uppercase shadow-md hover:bg-amber-300 disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Guardar cambios</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
