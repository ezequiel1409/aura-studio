"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react";
import { ShowroomSettings } from "../../../services/settings.service";
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
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Encabezado */}
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
          Tienda › Formas de Cobro
        </span>
        <h1 className="text-xl sm:text-2xl font-serif font-light text-zinc-100 mt-1">
          Medios de Pago y Cobro
        </h1>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Elegí y configurá las formas de pago que verán tus clientes al momento de finalizar su compra en la tienda.
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

      <form onSubmit={handleSave} className="space-y-6">
        <PaymentsSettingsSection
          mercadopagoEnabled={mercadopagoEnabled}
          onMercadopagoEnabledChange={setMercadopagoEnabled}
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

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            <span>{saving ? "Guardando..." : "Guardar medios de pago"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
