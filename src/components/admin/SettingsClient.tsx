"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  Save,
  Store,
} from "lucide-react";
import { ShowroomSettings } from "../../services/settings.service";

interface SettingsClientProps {
  initialSettings: ShowroomSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();

  const [whatsappNumber, setWhatsappNumber] = useState(
    initialSettings.whatsappNumber
  );
  const [showroomName, setShowroomName] = useState(
    initialSettings.showroomName
  );
  const [reservationHours, setReservationHours] = useState(
    String(initialSettings.reservationHours)
  );

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
          reservationHours: parseInt(reservationHours, 10),
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
          Configuración Dinámica (BR-35)
        </span>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-zinc-100 mt-1">
          Configuración del Showroom
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Modificá números de contacto, nombre de la tienda y tiempos de reserva sin necesidad de hacer deploy.
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Nombre del Showroom */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Store size={16} className="text-amber-300" aria-hidden="true" />
            <label htmlFor="showroomNameInput" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
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
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-emerald-400" aria-hidden="true" />
            <label htmlFor="whatsappNumberInput" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              WhatsApp de Atención y Reservas (BR-13, BR-35)
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
            Número con código internacional (ej: +54911...). Es el destino al que van los mensajes pre-armados.
          </p>
        </div>

        {/* Horas de Reserva */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-400" aria-hidden="true" />
            <label htmlFor="reservationHoursInput" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Duración de Reservas en Horas (BR-30, BR-35)
            </label>
          </div>
          <input
            id="reservationHoursInput"
            type="number"
            min={1}
            max={720}
            required
            value={reservationHours}
            onChange={(e) => setReservationHours(e.target.value)}
            placeholder="48"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
          />
          <p className="text-[11px] text-zinc-500">
            Horas antes de que una prenda reservada vuelva automáticamente a Disponible.
          </p>
        </div>

        {errorMessage && (
          <div role="alert" className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {savedSuccess && (
          <div role="status" aria-live="polite" className="flex items-center gap-2 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
            <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
            <span>Configuración guardada en base de datos correctamente.</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
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
