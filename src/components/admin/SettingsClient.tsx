"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  MapPin,
  MessageCircle,
  Palette,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import { InstagramIcon, TikTokIcon } from "../icons/SocialIcons";
import { HeroMode, ShowroomSettings } from "../../services/settings.service";
import { THEME_PALETTES, hexToRgb, rgbToHex, resolveStoreTheme } from "../../lib/theme/palettes";

interface SettingsClientProps {
  initialSettings: ShowroomSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();

  const [showroomName, setShowroomName] = useState(initialSettings.showroomName);
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber);
  const [logoUrl, setLogoUrl] = useState<string>(initialSettings.logoUrl || "");
  const [instagramHandle, setInstagramHandle] = useState<string>(initialSettings.instagramHandle || "");
  const [tiktokHandle, setTiktokHandle] = useState<string>(initialSettings.tiktokHandle || "");
  const [address, setAddress] = useState<string>(initialSettings.address || "");
  const [dataFiscalUrl, setDataFiscalUrl] = useState<string>(initialSettings.dataFiscalUrl || "");

  // Portada y Hero
  const [heroMode, setHeroMode] = useState<HeroMode>(initialSettings.heroMode || "featured_carousel");
  const [heroTitle, setHeroTitle] = useState<string>(initialSettings.heroTitle || "");
  const [heroSubtitle, setHeroSubtitle] = useState<string>(initialSettings.heroSubtitle || "");
  const [heroBannerUrl, setHeroBannerUrl] = useState<string>(initialSettings.heroBannerUrl || "");

  // Paleta de Colores y RGB
  const [themePalette, setThemePalette] = useState<string>(initialSettings.themePalette || "lino");
  const [themePrimaryColor, setThemePrimaryColor] = useState<string>(
    initialSettings.themePrimaryColor || THEME_PALETTES[initialSettings.themePalette || "lino"]?.accent || "#926a3c"
  );

  const [saving, setSaving] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentRgb = hexToRgb(themePrimaryColor) || { r: 146, g: 106, b: 60 };

  const handleRgbChange = (channel: "r" | "g" | "b", val: number) => {
    const updated = { ...currentRgb, [channel]: Math.max(0, Math.min(255, isNaN(val) ? 0 : val)) };
    const hex = rgbToHex(updated.r, updated.g, updated.b);
    setThemePrimaryColor(hex);
    setThemePalette("custom");
  };

  const handleSelectPreset = (paletteId: string) => {
    setThemePalette(paletteId);
    if (THEME_PALETTES[paletteId]) {
      setThemePrimaryColor(THEME_PALETTES[paletteId].accent);
    }
  };

  // Manejo de carga de archivo PNG de logo
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor, seleccioná un archivo de imagen válido (preferentemente PNG).");
      return;
    }

    setReadingFile(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoUrl(result);
      setReadingFile(false);
    };
    reader.onerror = () => {
      setErrorMessage("Error al leer el archivo de logotipo.");
      setReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: whatsappNumber.trim(),
          showroomName: showroomName.trim(),
          logoUrl: logoUrl.trim(),
          instagramHandle: instagramHandle.trim(),
          tiktokHandle: tiktokHandle.trim(),
          address: address.trim(),
          dataFiscalUrl: dataFiscalUrl.trim(),
          heroMode,
          heroTitle: heroTitle.trim(),
          heroSubtitle: heroSubtitle.trim(),
          heroBannerUrl: heroBannerUrl.trim(),
          themePalette,
          themePrimaryColor: themePrimaryColor.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar la configuración.");
      }

      setSavedSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Cabecera */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
          Identidad y Showroom
        </span>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-zinc-100 mt-1">
          Configuración de la Tienda
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Modificá el logo de la tienda, número de WhatsApp, redes sociales y datos de contacto sin necesidad de hacer deploy.
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Sección 1: Logotipo de la Tienda (PNG preferentemente) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-amber-300" aria-hidden="true" />
              <label htmlFor="logoFileInput" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Logotipo de la Tienda (PNG preferentemente)
              </label>
            </div>
            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                aria-label="Quitar logotipo y usar nombre en texto"
                className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors p-1"
              >
                <Trash2 size={13} aria-hidden="true" />
                <span>Quitar logo</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Podés subir un archivo PNG (con fondo transparente recomendado) o indicar una URL externa. Si no se define un logo, se mostrará el nombre de la tienda en tipografía editorial.
          </p>

          {/* Vista previa del logo si existe */}
          {logoUrl ? (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Vista previa en cabecera
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Preview modo claro (como en la tienda pública) */}
                <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#e7e2da] flex flex-col items-center justify-center gap-1.5 min-h-[90px]">
                  <span className="text-[9px] font-mono uppercase text-stone-500">
                    Fondo Tienda Pública
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Vista previa del logo en fondo claro"
                    className="h-8 max-w-[180px] object-contain"
                  />
                </div>
                {/* Preview modo oscuro (como en panel de admin) */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center gap-1.5 min-h-[90px]">
                  <span className="text-[9px] font-mono uppercase text-zinc-500">
                    Fondo Panel Admin
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Vista previa del logo en fondo oscuro"
                    className="h-8 max-w-[180px] object-contain"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-950/50 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
              Actualmente se muestra el nombre &ldquo;{showroomName}&rdquo; en texto tipográfico serif.
            </div>
          )}

          {/* Selector de archivo PNG & Entrada de URL */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <label
              htmlFor="logoFileInput"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-amber-400"
            >
              {readingFile ? (
                <Loader2 size={15} className="animate-spin text-amber-300" aria-hidden="true" />
              ) : (
                <Upload size={15} className="text-amber-300" aria-hidden="true" />
              )}
              <span>{logoUrl ? "Cambiar archivo PNG" : "Subir archivo PNG..."}</span>
              <input
                id="logoFileInput"
                type="file"
                accept="image/png, image/webp, image/jpeg"
                onChange={handleLogoFileChange}
                disabled={readingFile}
                className="sr-only"
              />
            </label>

            <div className="flex-1">
              <input
                id="logoUrlInput"
                type="url"
                value={logoUrl.startsWith("data:") ? "" : logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="O pegar URL https://..."
                aria-label="URL del logotipo de la tienda"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Datos Básicos del Showroom */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Datos Básicos del Showroom
          </h2>

          {/* Nombre del Showroom */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Store size={15} className="text-amber-300" aria-hidden="true" />
              <label htmlFor="showroomNameInput" className="text-xs font-medium text-zinc-300">
                Nombre del Showroom / Marca
              </label>
            </div>
            <input
              id="showroomNameInput"
              type="text"
              required
              value={showroomName}
              onChange={(e) => setShowroomName(e.target.value)}
              placeholder="Aura Studio"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
            />
            <p className="text-[11px] text-zinc-500">
              Nombre visible en los títulos, mensajes y pie de página de la tienda.
            </p>
          </div>

          {/* WhatsApp Oficial */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <MessageCircle size={15} className="text-emerald-400" aria-hidden="true" />
              <label htmlFor="whatsappNumberInput" className="text-xs font-medium text-zinc-300">
                WhatsApp Oficial de Atención
              </label>
            </div>
            <input
              id="whatsappNumberInput"
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+5491100000000"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
            />
            <p className="text-[11px] text-zinc-500">
              Número con código internacional (ej: +54911...). Es el destino al que van los mensajes de consulta y reserva directa.
            </p>
          </div>
        </div>

        {/* Sección 3: Contacto, Redes Sociales y Ubicación (Opcionales) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Pie de Página: Contacto y Redes Sociales (Opcionales)
            </h2>
            <p className="text-[11px] text-zinc-400 mt-1">
              Los campos que completes se mostrarán elegantemente en el pie de página de la tienda pública.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Instagram */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <InstagramIcon size={14} className="text-[#E4405F]" />
                <label htmlFor="instagramInput" className="text-xs text-zinc-300">
                  Instagram
                </label>
              </div>
              <input
                id="instagramInput"
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@aurastudio o URL"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
              />
            </div>

            {/* TikTok */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <TikTokIcon size={14} className="text-zinc-400" />
                <label htmlFor="tiktokInput" className="text-xs text-zinc-300">
                  TikTok (opcional)
                </label>
              </div>
              <input
                id="tiktokInput"
                type="text"
                value={tiktokHandle}
                onChange={(e) => setTiktokHandle(e.target.value)}
                placeholder="@aurastudio o URL"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
              />
            </div>

            {/* Dirección Showroom */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-amber-400" aria-hidden="true" />
                <label htmlFor="addressInput" className="text-xs text-zinc-300">
                  Dirección física del Showroom (opcional)
                </label>
              </div>
              <input
                id="addressInput"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Honduras 4800, Palermo Soho, CABA"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
              />
            </div>

            {/* AFIP Data Fiscal */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-400" aria-hidden="true" />
                <label htmlFor="dataFiscalInput" className="text-xs text-zinc-300">
                  Data Fiscal / AFIP Formulario 960 (opcional)
                </label>
              </div>
              <input
                id="dataFiscalInput"
                type="url"
                value={dataFiscalUrl}
                onChange={(e) => setDataFiscalUrl(e.target.value)}
                placeholder="https://serviciosweb.afip.gob.ar/clavefiscal/qr/default.aspx?..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
              />
              <p className="text-[11px] text-zinc-500">
                Si tu comercio cuenta con código QR o constancia de Data Fiscal de AFIP, ingresá el enlace para mostrar la insignia oficial en el pie de página.
              </p>
            </div>
          </div>
        </div>

        {/* Sección 4: Portada y Hero del Catálogo (Home) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <LayoutTemplate size={16} className="text-amber-400" aria-hidden="true" />
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Portada de la Tienda (Página Principal)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Elegí qué mostrar en la cabecera principal de bienvenida a tus clientes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Opción 1: Carrusel de Destacados */}
            <button
              type="button"
              onClick={() => setHeroMode("featured_carousel")}
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
                Muestra las fotos y detalles de las prendas marcadas como destacadas en un carrusel interactivo.
              </p>
            </button>

            {/* Opción 2: Banner Editorial */}
            <button
              type="button"
              onClick={() => setHeroMode("editorial")}
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
                Texto de bienvenida elegante y minimalista con título de colección y bajada editorial.
              </p>
            </button>

            {/* Opción 3: Banner con Imagen */}
            <button
              type="button"
              onClick={() => setHeroMode("custom_banner")}
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

          {/* Campos de texto según el modo */}
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
                    onChange={(e) => setHeroBannerUrl(e.target.value)}
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
                    onChange={(e) => setHeroTitle(e.target.value)}
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
                    onChange={(e) => setHeroSubtitle(e.target.value)}
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
                El carrusel tomará automáticamente las prendas que tengan la estrella de <strong>Destacada</strong> activada en el listado de productos.
              </span>
            </div>
          )}
        </div>

        {/* Sección 5: Paleta de Colores de la Tienda (Identidad Visual) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-amber-400" aria-hidden="true" />
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Paleta de Colores de la Tienda
              </h2>
              <p className="text-[11px] text-zinc-400">
                Personalizá la armonía visual de la tienda eligiendo una paleta curada o definiendo tus propios colores en RGB / Hex.
              </p>
            </div>
          </div>

          {/* Grilla de Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(THEME_PALETTES).map((p) => {
              const isSelected = themePalette === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
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

          {/* Controles de Color Personalizado con Selector y RGB */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-300">
                Ajuste de Color de Acento (RGB y Hexadecimal):
              </span>
              {themePalette !== "custom" && (
                <button
                  type="button"
                  onClick={() => setThemePalette("custom")}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  Personalizar valores manualmente
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl">
              {/* Color Picker Nativo */}
              <div className="flex items-center gap-2">
                <input
                  id="primaryColorPicker"
                  type="color"
                  value={themePrimaryColor.length === 7 ? themePrimaryColor : "#926a3c"}
                  onChange={(e) => {
                    setThemePrimaryColor(e.target.value);
                    setThemePalette("custom");
                  }}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                  aria-label="Selector visual de color"
                />
                <div>
                  <label htmlFor="primaryColorHexInput" className="block text-[10px] font-mono uppercase text-zinc-400">
                    Hex
                  </label>
                  <input
                    id="primaryColorHexInput"
                    type="text"
                    value={themePrimaryColor}
                    onChange={(e) => {
                      setThemePrimaryColor(e.target.value);
                      setThemePalette("custom");
                    }}
                    placeholder="#926a3c"
                    className="w-24 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Controles numéricos RGB */}
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

              {/* Vista Previa en Vivo */}
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60">
                <span className="text-[11px] text-zinc-400">Vista previa de acento:</span>
                <span
                  className="px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: themePrimaryColor }}
                >
                  Aura Studio
                </span>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div role="alert" className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {savedSuccess && (
          <div role="status" aria-live="polite" className="flex items-center gap-2 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
            <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
            <span>Configuración de la tienda guardada correctamente.</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || readingFile}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-200 text-zinc-950 font-bold text-xs hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-amber-950/30 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={16} aria-hidden="true" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
