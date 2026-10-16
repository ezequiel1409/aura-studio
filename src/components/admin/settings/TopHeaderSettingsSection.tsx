"use client";

import { Image as ImageIcon, Loader2, Store, Trash2, Upload } from "lucide-react";

interface TopHeaderSettingsSectionProps {
  showroomName: string;
  storeType: string;
  logoUrl: string;
  readingFile: boolean;
  onShowroomNameChange: (val: string) => void;
  onStoreTypeChange: (val: string) => void;
  onLogoUrlChange: (val: string) => void;
  onLogoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
}

export function TopHeaderSettingsSection({
  showroomName,
  storeType,
  logoUrl,
  readingFile,
  onShowroomNameChange,
  onStoreTypeChange,
  onLogoUrlChange,
  onLogoFileChange,
  onRemoveLogo,
}: TopHeaderSettingsSectionProps) {
  return (
    <div
      id="settings-panel-top"
      role="tabpanel"
      aria-labelledby="settings-tab-top"
      className="space-y-5"
    >
      {/* Bloque 1: Logotipo de la Tienda (PNG preferentemente) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-amber-300" aria-hidden="true" />
            <label
              htmlFor="logoFileInput"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Logotipo de la Tienda (PNG preferentemente)
            </label>
          </div>
          {logoUrl && (
            <button
              type="button"
              onClick={onRemoveLogo}
              aria-label="Quitar logotipo y usar nombre en texto"
              className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors p-1"
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>Quitar logo</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Podés subir un archivo PNG (con fondo transparente recomendado) o indicar una URL
          externa. Si no se define un logo, se mostrará el nombre de la tienda en tipografía
          editorial.
        </p>

        {logoUrl ? (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Vista previa en cabecera
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            Actualmente se muestra el nombre &ldquo;{showroomName}&rdquo; en texto tipográfico
            serif.
          </div>
        )}

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
              onChange={onLogoFileChange}
              disabled={readingFile}
              className="sr-only"
            />
          </label>

          <div className="flex-1">
            <input
              id="logoUrlInput"
              type="url"
              value={logoUrl.startsWith("data:") ? "" : logoUrl}
              onChange={(e) => onLogoUrlChange(e.target.value)}
              placeholder="O pegar URL https://..."
              aria-label="URL del logotipo de la tienda"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Bloque 2: Identidad de la Parte Superior */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Identidad en Cabecera (Parte Superior)
        </h2>

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
            onChange={(e) => onShowroomNameChange(e.target.value)}
            placeholder="Aura Studio"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
          />
          <p className="text-[11px] text-zinc-500">
            Nombre visible en la barra superior, títulos y mensajes de la tienda.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Store size={15} className="text-amber-300" aria-hidden="true" />
            <label htmlFor="storeTypeInput" className="text-xs font-medium text-zinc-300">
              Tipo de Tienda / Negocio
            </label>
          </div>
          <input
            id="storeTypeInput"
            type="text"
            required
            value={storeType}
            onChange={(e) => onStoreTypeChange(e.target.value)}
            placeholder="Showroom (o Tienda de Ropa, Boutique, etc.)"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
          />
          <p className="text-[11px] text-zinc-500">
            Subtítulo descriptivo del formato comercial de tu negocio.
          </p>
        </div>
      </div>
    </div>
  );
}

