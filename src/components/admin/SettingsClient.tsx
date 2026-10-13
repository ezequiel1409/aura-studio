"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import { InstagramIcon, TikTokIcon } from "../icons/SocialIcons";
import { ShowroomSettings } from "../../services/settings.service";

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

  const [saving, setSaving] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
