"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Save,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import { ShowroomSettings } from "../../../services/settings.service";

interface BusinessSettingsClientProps {
  initialSettings: ShowroomSettings;
}

const BUSINESS_VERTICALS = [
  { id: "indumentaria", label: "Indumentaria / Moda / Accesorios" },
  { id: "calzado", label: "Calzado y Marroquinería" },
  { id: "gastronomia", label: "Gastronomía / Café / Restaurante" },
  { id: "ferreteria", label: "Ferretería / Herramientas / Construcción" },
  { id: "hogar", label: "Decoración / Hogar / Bazar" },
  { id: "otro", label: "Otro rubro comercial" },
];

export function BusinessSettingsClient({ initialSettings }: BusinessSettingsClientProps) {
  const [showroomName, setShowroomName] = useState(initialSettings.showroomName || "");
  const [businessVertical, setBusinessVertical] = useState(
    initialSettings.businessVertical || "indumentaria"
  );
  const [businessDescriptor, setBusinessDescriptor] = useState(
    initialSettings.businessDescriptor || ""
  );
  const [aboutText, setAboutText] = useState(initialSettings.aboutText || "");
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl || "");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const descriptorChars = businessDescriptor.length;
  const aboutChars = aboutText.length;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ type: "error", text: "La imagen no debe superar los 2 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showroomName.trim()) {
      setFeedback({ type: "error", text: "El nombre de la tienda es obligatorio." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showroomName: showroomName.trim(),
          businessVertical,
          businessDescriptor: businessDescriptor.trim() || "",
          aboutText: aboutText.trim() || "",
          logoUrl: logoUrl.trim() || "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar la configuración.");
      }

      setFeedback({
        type: "ok",
        text: "Configuración de negocio guardada con éxito. Ya impacta en la tienda pública.",
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
          Tienda › Negocio (ADM-05)
        </span>
        <h1 className="text-xl sm:text-2xl font-serif font-light text-zinc-100 mt-1">
          Identidad, Rubro y Pie de Página
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Definí el nombre de tu marca, el descriptor bajo el logo y el texto descriptivo del pie.
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
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Formulario (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Bloque 1: Identidad Principal */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Building2 size={15} className="text-amber-400" />
              <span>Nombre y Marca</span>
            </h2>

            <div>
              <label
                htmlFor="store-name-input"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Nombre público de la tienda <span className="text-rose-400">*</span>
              </label>
              <input
                id="store-name-input"
                type="text"
                required
                value={showroomName}
                onChange={(e) => setShowroomName(e.target.value)}
                placeholder="Ej: Aura Studio"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Logotipo (PNG transparente recomendado)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors">
                  <Upload size={14} />
                  <span>Subir imagen</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Quitar logo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bloque 2: ¿Qué comercio es? (Rubro y Descriptor) */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Store size={15} className="text-amber-400" />
              <span>¿Qué comercio es?</span>
            </h2>

            <div>
              <label
                htmlFor="vertical-select"
                className="block text-xs font-medium text-zinc-300 mb-1"
              >
                Rubro o tipo de negocio
              </label>
              <select
                id="vertical-select"
                value={businessVertical}
                onChange={(e) => setBusinessVertical(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none cursor-pointer"
              >
                {BUSINESS_VERTICALS.map((v) => (
                  <option key={v.id} value={v.id} className="bg-zinc-900">
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="descriptor-input"
                  className="block text-xs font-medium text-zinc-300"
                >
                  Descriptor bajo el logo (opcional)
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    descriptorChars >= 35 ? "text-amber-400 font-bold" : "text-zinc-500"
                  }`}
                >
                  {descriptorChars}/40 caracteres
                </span>
              </div>
              <input
                id="descriptor-input"
                type="text"
                maxLength={40}
                value={businessDescriptor}
                onChange={(e) => setBusinessDescriptor(e.target.value)}
                placeholder="Ej: Showroom & Archivo, Taller de cerámica..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Aparece en tipografía pequeña sobre o debajo del nombre en el header y pie. Si se deja vacío, no aparece nada.
              </p>
            </div>
          </div>

          {/* Bloque 3: Acerca de la tienda (Pie de página) */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <FileText size={15} className="text-amber-400" />
              <span>Acerca de la tienda (Texto del pie)</span>
            </h2>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="about-input"
                  className="block text-xs font-medium text-zinc-300"
                >
                  Descripción corta para el pie de página
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    aboutChars >= 140
                      ? "text-amber-400 font-bold"
                      : aboutChars >= 160
                      ? "text-rose-400 font-bold"
                      : "text-zinc-500"
                  }`}
                >
                  {aboutChars}/160 caracteres
                </span>
              </div>
              <textarea
                id="about-input"
                rows={3}
                maxLength={160}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                placeholder="Ej: Curaduría de prendas seleccionadas, atención personalizada y envíos a todo el país..."
                className={`w-full rounded-xl border bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-1 focus:outline-none resize-none ${
                  aboutChars >= 140
                    ? "border-amber-500/80 focus:border-amber-400 focus:ring-amber-400"
                    : "border-zinc-700 focus:border-amber-400 focus:ring-amber-400"
                }`}
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Si lo dejás vacío, el pie de página no mostrará ese párrafo (evita espacios en blanco).
              </p>
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
        </div>

        {/* Columna Derecha: Vista Previa de Impacto en Vivo (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Eye size={14} className="text-amber-400" />
                <span>Vista Previa de Impacto en el Pie</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                En vivo
              </span>
            </div>

            {/* Simulación del Bloque 1 de la Columna 1 del Footer de la Tienda */}
            <div className="rounded-xl border border-[#e7e2da] bg-white p-5 text-stone-700 shadow-sm space-y-3">
              <div className="border-b border-stone-200 pb-2">
                <span className="text-[10px] font-mono uppercase text-stone-500 block">
                  Columna de Marca en Footer:
                </span>
              </div>

              <div>
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={logoUrl}
                    alt={showroomName || "Logo"}
                    className="h-8 max-w-[150px] object-contain"
                  />
                ) : (
                  <div>
                    {businessDescriptor.trim() ? (
                      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.25em] text-[#926a3c] block">
                        {businessDescriptor.trim()}
                      </span>
                    ) : null}
                    <h3 className="font-serif text-lg font-normal text-stone-900 tracking-wider uppercase mt-0.5">
                      {showroomName || "Nombre de tu tienda"}
                    </h3>
                  </div>
                )}
              </div>

              {aboutText.trim() ? (
                <p className="text-xs text-stone-600 leading-relaxed pt-1">
                  {aboutText.trim()}
                </p>
              ) : (
                <div className="p-2.5 rounded-lg border border-dashed border-stone-200 text-stone-500 text-[11px] italic">
                  (El párrafo de descripción está vacío, no se mostrará nada aquí en el pie)
                </div>
              )}

              <div className="pt-2 text-[11px] text-stone-500 border-t border-stone-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Actualización reactiva sin recargar la página</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
