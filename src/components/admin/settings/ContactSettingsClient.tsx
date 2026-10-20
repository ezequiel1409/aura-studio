"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Save,
} from "lucide-react";
import {
  DEFAULT_STORE_LOCATION,
  DEFAULT_STORE_SCHEDULE,
  StoreLocationConfig,
  StoreScheduleConfig,
} from "../../../lib/schedule/store-schedule";
import { ShowroomSettings } from "../../../services/settings.service";
import { FooterSettingsSection } from "./FooterSettingsSection";

interface ContactSettingsClientProps {
  initialSettings: ShowroomSettings;
}

export function ContactSettingsClient({ initialSettings }: ContactSettingsClientProps) {
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialSettings.whatsappNumber || ""
  );
  const [instagramHandle, setInstagramHandle] = useState(
    initialSettings.instagramHandle || ""
  );
  const [tiktokHandle, setTiktokHandle] = useState(
    initialSettings.tiktokHandle || ""
  );
  const [address, setAddress] = useState(initialSettings.address || "");
  const [dataFiscalUrl, setDataFiscalUrl] = useState(
    initialSettings.dataFiscalUrl || ""
  );
  const [storeLocation, setStoreLocation] = useState<StoreLocationConfig>(
    initialSettings.storeLocation || DEFAULT_STORE_LOCATION
  );
  const [storeSchedule, setStoreSchedule] = useState<StoreScheduleConfig>(
    initialSettings.storeSchedule || DEFAULT_STORE_SCHEDULE
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        whatsappNumber,
        instagramHandle,
        tiktokHandle,
        address,
        dataFiscalUrl,
        storeLocation,
        storeSchedule,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudieron guardar los datos de contacto.");
      }

      setFeedback({
        type: "ok",
        text: "¡Configuración de contacto, ubicación y horarios guardada con éxito!",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error inesperado al guardar.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Encabezado Principal y Guardado Rápido */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin size={22} className="text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
              Contacto, Showroom y Redes
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Gestioná el WhatsApp oficial de atención, la dirección física, los horarios de apertura y retiro, y las redes de la marca.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-300 transition-colors cursor-pointer disabled:opacity-50 shadow-sm shrink-0"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
        </button>
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

      {/* Formulario en 2 Columnas Balanceadas */}
      <form onSubmit={handleSave}>
        <FooterSettingsSection
          whatsappNumber={whatsappNumber}
          instagramHandle={instagramHandle}
          tiktokHandle={tiktokHandle}
          address={address}
          dataFiscalUrl={dataFiscalUrl}
          storeLocation={storeLocation}
          storeSchedule={storeSchedule}
          onWhatsappNumberChange={setWhatsappNumber}
          onInstagramHandleChange={setInstagramHandle}
          onTiktokHandleChange={setTiktokHandle}
          onAddressChange={setAddress}
          onDataFiscalUrlChange={setDataFiscalUrl}
          onStoreLocationChange={setStoreLocation}
          onStoreScheduleChange={setStoreSchedule}
        />
      </form>
    </div>
  );
}
