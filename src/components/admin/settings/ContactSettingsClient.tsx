"use client";

import { useState } from "react";
import { MapPin, Save } from "lucide-react";
import {
  DEFAULT_STORE_LOCATION,
  DEFAULT_STORE_SCHEDULE,
  StoreLocationConfig,
  StoreScheduleConfig,
} from "../../../lib/schedule/store-schedule";
import { ShowroomSettings } from "../../../services/settings.service";
import { AdminPageHeader } from "../ui/AdminPageHeader";
import { AdminFeedbackBanner } from "../ui/AdminFeedbackBanner";
import { AdminButton } from "../ui/AdminButton";
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
    <div className="space-y-6 max-w-6xl w-full min-w-0">
      <AdminPageHeader
        eyebrow="Tienda › Contacto"
        title="Contacto, Showroom y Redes"
        description="Gestioná el WhatsApp de atención, la dirección física, horarios de retiro y redes sociales."
        icon={<MapPin size={22} aria-hidden="true" />}
        actions={
          <AdminButton
            type="button"
            onClick={handleSave}
            loading={saving}
            loadingLabel="Guardando..."
            icon={<Save size={15} aria-hidden="true" />}
          >
            Guardar cambios
          </AdminButton>
        }
      />

      {feedback && (
        <AdminFeedbackBanner
          type={feedback.type}
          message={feedback.text}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Formulario en 2 Columnas Balanceadas */}
      <form onSubmit={handleSave} className="w-full min-w-0 space-y-6">
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

        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <AdminButton
            type="submit"
            loading={saving}
            loadingLabel="Guardando..."
            icon={<Save size={15} aria-hidden="true" />}
          >
            Guardar cambios
          </AdminButton>
        </div>
      </form>
    </div>
  );
}

