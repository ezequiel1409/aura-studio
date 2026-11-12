"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Link2,
  Loader2,
  Save,
  Scale,
  Sparkles,
} from "lucide-react";
import {
  DEFAULT_SUGGESTED_TERMS,
  ShowroomSettings,
} from "../../../services/settings.service";
import { TermsContentRenderer } from "../../legal/TermsContentRenderer";

interface PoliciesSettingsClientProps {
  initialSettings: ShowroomSettings;
}

export function PoliciesSettingsClient({
  initialSettings,
}: PoliciesSettingsClientProps) {
  const [reservationHours, setReservationHours] = useState<number>(
    initialSettings.reservationHours || 48
  );
  const [customTermsText, setCustomTermsText] = useState<string>(
    initialSettings.customTermsText || ""
  );
  const [termsViewMode, setTermsViewMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const whatsappNumber = initialSettings.whatsappNumber || "";
  const showroomName = initialSettings.showroomName;

  const appendSnippet = (snippet: string) => {
    setCustomTermsText((prev) => (prev ? `${prev} ${snippet}` : snippet));
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
          reservationHours,
          customTermsText: customTermsText.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(
          data.error || "No se pudieron guardar las políticas y términos legales."
        );
      }

      setFeedback({
        type: "ok",
        text: "Políticas de venta y términos legales guardados correctamente.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Error inesperado al guardar las políticas.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Scale size={22} className="text-amber-300" aria-hidden="true" />
            <span>Políticas y Términos Legales</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configurá el texto publicado en /terminos y el plazo de vigencia de las reservas.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs ${
            feedback.type === "ok"
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-200"
              : "bg-rose-950/50 border-rose-800 text-rose-200"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" aria-hidden="true" />
          ) : (
            <AlertCircle size={16} className="shrink-0 text-rose-400" aria-hidden="true" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-400" aria-hidden="true" />
            <label
              htmlFor="reservation-hours-input"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-200"
            >
              Vigencia de Reserva de Stock (en horas)
            </label>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              id="reservation-hours-input"
              type="number"
              min={1}
              max={720}
              value={reservationHours}
              onChange={(e) =>
                setReservationHours(Math.max(1, Number(e.target.value) || 48))
              }
              className="w-full sm:w-40 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
            />
            <p className="text-xs text-zinc-400">
              Plazo máximo durante el cual una orden pendiente retiene inventario antes de liberarse.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" aria-hidden="true" />
                <span>Términos y Condiciones Generales (Página /terminos)</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Texto legal publicado para tus clientes con soporte completo de hipervínculos interactivos y cláusulas personalizadas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setTermsViewMode("edit")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    termsViewMode === "edit"
                      ? "bg-amber-400 text-zinc-950 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Edit3 size={13} aria-hidden="true" />
                  <span>Editar Texto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTermsViewMode("preview")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    termsViewMode === "preview"
                      ? "bg-amber-400 text-zinc-950 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Eye size={13} aria-hidden="true" />
                  <span>Vista Previa en Vivo</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCustomTermsText(DEFAULT_SUGGESTED_TERMS)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 text-xs font-semibold transition-colors cursor-pointer"
                title="Carga la plantilla legal completa con hipervínculos a Promociones Bancarias y Arrepentimiento"
              >
                <Sparkles size={13} aria-hidden="true" />
                <span>Cargar sugerencias legales</span>
              </button>
            </div>
          </div>

          {termsViewMode === "edit" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold px-1.5">
                  Insertar Hipervínculo:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    appendSnippet("[Promociones Bancarias](/promociones)")
                  }
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  + Promociones Bancarias
                </button>

                <button
                  type="button"
                  onClick={() =>
                    appendSnippet("[Botón de Arrepentimiento](/arrepentimiento)")
                  }
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  + Botón de Arrepentimiento
                </button>

                <button
                  type="button"
                  onClick={() => appendSnippet("[Catálogo de Piezas](/catalogo)")}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  + Catálogo
                </button>

                <button
                  type="button"
                  onClick={() =>
                    appendSnippet(
                      `[WhatsApp Oficial](${
                        whatsappNumber
                          ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
                          : "https://wa.me/5491100000000"
                      })`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  + WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() =>
                    appendSnippet("[Texto del enlace](https://tusitio.com)")
                  }
                  className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Link2 size={12} aria-hidden="true" />
                  <span>Enlace Libre [texto](url)</span>
                </button>

                <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold px-1.5 ml-auto">
                  Formato:
                </span>
                <button
                  type="button"
                  onClick={() => appendSnippet("**texto destacado**")}
                  className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-bold transition-colors cursor-pointer"
                  title="Negrita"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCustomTermsText((prev) =>
                      prev
                        ? `${prev}\n\n## N. Nombre de Cláusula\n`
                        : "## 1. Nombre de Cláusula\n"
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Título de Cláusula"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCustomTermsText((prev) =>
                      prev ? `${prev}\n- Ítem de lista` : "- Ítem de lista"
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Lista con viñetas"
                >
                  • Lista
                </button>
              </div>

              <label htmlFor="custom-terms-textarea" className="sr-only">
                Contenido de términos y condiciones
              </label>
              <textarea
                id="custom-terms-textarea"
                rows={14}
                value={customTermsText}
                onChange={(e) => setCustomTermsText(e.target.value)}
                placeholder="Redactá tus términos legales o usá el botón 'Cargar sugerencias legales' para comenzar con hipervínculos predefinidos..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400 leading-relaxed"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                <span>
                  Sintaxis compatible:{" "}
                  <code className="text-zinc-300">[Texto](https://...)</code>,{" "}
                  <code className="text-zinc-300">[Texto](/ruta-interna)</code>,{" "}
                  <code className="text-zinc-300">**negrita**</code> y{" "}
                  <code className="text-zinc-300">## Títulos</code>.
                </span>
                {customTermsText && (
                  <button
                    type="button"
                    onClick={() => setCustomTermsText("")}
                    className="text-zinc-400 hover:text-rose-400 underline cursor-pointer"
                  >
                    Restablecer al texto legal estándar
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Así verán y navegarán tus clientes las cláusulas e hipervínculos:
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                  Interactiva con clics activos
                </span>
              </div>

              <div className="rounded-2xl border border-[#e7e2da] bg-white p-6 sm:p-8 text-stone-900 shadow-md">
                <TermsContentRenderer
                  content={
                    customTermsText.trim()
                      ? customTermsText
                      : DEFAULT_SUGGESTED_TERMS
                  }
                  brandName={showroomName}
                />
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-300">
              Puntos clave recomendados en la legislación argentina:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-zinc-400">
              <li>
                <strong>Promociones Bancarias:</strong> Enlace a{" "}
                <code className="text-amber-300">/promociones</code> para detallar
                vigencias, topes de reintegro y entidades bancarias.
              </li>
              <li>
                <strong>Botón de Arrepentimiento:</strong> Enlace a{" "}
                <code className="text-amber-300">/arrepentimiento</code> conforme a Ley
                N° 24.240 y Res. 424/2020 SCI.
              </li>
              <li>
                <strong>Políticas de compra y entrega:</strong> Métodos de entrega,
                plazos y horarios del local.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-2 border-t border-zinc-800/80">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-200 text-zinc-950 font-bold text-xs hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-amber-950/30 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Save size={16} aria-hidden="true" />
            )}
            <span>{saving ? "Guardando..." : "Guardar Políticas"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
