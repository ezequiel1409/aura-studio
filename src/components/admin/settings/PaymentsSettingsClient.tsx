"use client";

import { useState } from "react";
import { CreditCard, Save } from "lucide-react";
import { ShowroomSettings } from "../../../services/settings.service";
import { AdminPageHeader } from "../ui/AdminPageHeader";
import { AdminFeedbackBanner } from "../ui/AdminFeedbackBanner";
import { AdminButton } from "../ui/AdminButton";
import { PaymentsSettingsSection } from "./PaymentsSettingsSection";

interface PaymentsSettingsClientProps {
  initialSettings: ShowroomSettings;
}

export function PaymentsSettingsClient({
  initialSettings,
}: PaymentsSettingsClientProps) {
  // 1. Mercado Pago
  const [mercadopagoEnabled, setMercadopagoEnabled] = useState(
    initialSettings.mercadopagoEnabled ?? false
  );
  const [mercadopagoBinaryMode, setMercadopagoBinaryMode] = useState(
    initialSettings.mercadopagoBinaryMode ?? false
  );
  const [mercadopagoMaxInstallments, setMercadopagoMaxInstallments] = useState<string>(
    initialSettings.mercadopagoMaxInstallments ? String(initialSettings.mercadopagoMaxInstallments) : ""
  );
  const [mercadopagoOfflineExpirationDays, setMercadopagoOfflineExpirationDays] = useState<string>(
    initialSettings.mercadopagoOfflineExpirationDays
      ? String(initialSettings.mercadopagoOfflineExpirationDays)
      : ""
  );

  // 2. Transferencia Bancaria
  const [transferEnabled, setTransferEnabled] = useState(
    initialSettings.transferEnabled ?? true
  );
  const [transferBankName, setTransferBankName] = useState(
    initialSettings.transferBankName || ""
  );
  const [transferAccountHolder, setTransferAccountHolder] = useState(
    initialSettings.transferAccountHolder || ""
  );
  const [transferCbu, setTransferCbu] = useState(
    initialSettings.transferCbu || ""
  );
  const [transferAlias, setTransferAlias] = useState(
    initialSettings.transferAlias || ""
  );
  const [transferCuit, setTransferCuit] = useState(
    initialSettings.transferCuit || ""
  );
  const [transferDiscountPercent, setTransferDiscountPercent] = useState(
    initialSettings.transferDiscountPercent ?? 10
  );

  // 3. Payway (Prisma)
  const [paywayEnabled, setPaywayEnabled] = useState(
    initialSettings.paywayEnabled ?? false
  );

  // 4. Getnet (Santander)
  const [getnetEnabled, setGetnetEnabled] = useState(
    initialSettings.getnetEnabled ?? false
  );

  // 5. MODO (Billetera Bancaria)
  const [modoEnabled, setModoEnabled] = useState(
    initialSettings.modoEnabled ?? false
  );

  // 6. Google Pay
  const [googlePayEnabled, setGooglePayEnabled] = useState(
    initialSettings.googlePayEnabled ?? false
  );

  // 7. Efectivo & WhatsApp
  const [cashEnabled, setCashEnabled] = useState(
    initialSettings.cashEnabled ?? true
  );
  const [cashNotes, setCashNotes] = useState(initialSettings.cashNotes || "");
  const [whatsappPaymentEnabled, setWhatsappPaymentEnabled] = useState(
    initialSettings.whatsappPaymentEnabled ?? true
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
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mercadopagoEnabled,
          mercadopagoBinaryMode,
          mercadopagoMaxInstallments: mercadopagoMaxInstallments
            ? Number(mercadopagoMaxInstallments)
            : null,
          mercadopagoOfflineExpirationDays: mercadopagoOfflineExpirationDays
            ? Number(mercadopagoOfflineExpirationDays)
            : null,
          transferEnabled,
          transferBankName: transferBankName.trim(),
          transferAccountHolder: transferAccountHolder.trim(),
          transferCbu: transferCbu.trim(),
          transferAlias: transferAlias.trim(),
          transferCuit: transferCuit.trim(),
          transferDiscountPercent,
          paywayEnabled,
          getnetEnabled,
          modoEnabled,
          googlePayEnabled,
          cashEnabled,
          cashNotes: cashNotes.trim(),
          whatsappPaymentEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar la configuración.");
      }

      setFeedback({
        type: "ok",
        text: "Medios de pago y opciones comerciales actualizadas correctamente. Ya impactan en el carrito y checkout.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Error al guardar medios de pago",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl pb-16">
      <AdminPageHeader
        eyebrow="Tienda › Formas de Cobro"
        title="Medios de Pago y Cobro"
        description="Elegí y configurá las formas de pago que verán tus clientes al finalizar su compra."
        icon={<CreditCard size={22} aria-hidden="true" />}
        actions={
          <AdminButton
            type="submit"
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

      <div className="space-y-6">
        <PaymentsSettingsSection
          mercadopagoEnabled={mercadopagoEnabled}
          onMercadopagoEnabledChange={setMercadopagoEnabled}
          mercadopagoBinaryMode={mercadopagoBinaryMode}
          onMercadopagoBinaryModeChange={setMercadopagoBinaryMode}
          mercadopagoMaxInstallments={mercadopagoMaxInstallments}
          onMercadopagoMaxInstallmentsChange={setMercadopagoMaxInstallments}
          mercadopagoOfflineExpirationDays={mercadopagoOfflineExpirationDays}
          onMercadopagoOfflineExpirationDaysChange={setMercadopagoOfflineExpirationDays}
          transferEnabled={transferEnabled}
          onTransferEnabledChange={setTransferEnabled}
          transferBankName={transferBankName}
          onTransferBankNameChange={setTransferBankName}
          transferAccountHolder={transferAccountHolder}
          onTransferAccountHolderChange={setTransferAccountHolder}
          transferCbu={transferCbu}
          onTransferCbuChange={setTransferCbu}
          transferAlias={transferAlias}
          onTransferAliasChange={setTransferAlias}
          transferCuit={transferCuit}
          onTransferCuitChange={setTransferCuit}
          transferDiscountPercent={transferDiscountPercent}
          onTransferDiscountPercentChange={setTransferDiscountPercent}
          paywayEnabled={paywayEnabled}
          onPaywayEnabledChange={setPaywayEnabled}
          getnetEnabled={getnetEnabled}
          onGetnetEnabledChange={setGetnetEnabled}
          modoEnabled={modoEnabled}
          onModoEnabledChange={setModoEnabled}
          googlePayEnabled={googlePayEnabled}
          onGooglePayEnabledChange={setGooglePayEnabled}
          cashEnabled={cashEnabled}
          onCashEnabledChange={setCashEnabled}
          cashNotes={cashNotes}
          onCashNotesChange={setCashNotes}
          whatsappPaymentEnabled={whatsappPaymentEnabled}
          onWhatsappPaymentEnabledChange={setWhatsappPaymentEnabled}
        />

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <AdminButton
            type="submit"
            loading={saving}
            loadingLabel="Guardando..."
            icon={<Save size={15} aria-hidden="true" />}
          >
            Guardar cambios
          </AdminButton>
        </div>
      </div>
    </form>
  );
}
