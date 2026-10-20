"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Save,
  Wallet,
} from "lucide-react";
import { ShowroomSettings } from "../../../services/settings.service";
import { PaymentsSettingsSection } from "./PaymentsSettingsSection";

interface PaymentsSettingsClientProps {
  initialSettings: ShowroomSettings;
}

export function PaymentsSettingsClient({
  initialSettings,
}: PaymentsSettingsClientProps) {
  const [mercadopagoEnabled, setMercadopagoEnabled] = useState(
    initialSettings.mercadopagoEnabled ?? false
  );
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
        method: "PUT",
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
        text: "Medios de pago actualizados correctamente. Ya impactan en el carrito y checkout.",
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
          Tienda › Medios de Pago
        </span>
        <h1 className="text-xl sm:text-2xl font-serif font-light text-zinc-100 mt-1">
          Medios de Pago y Cobro
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configurá las formas de pago que tus clientes verán al finalizar su pedido: Mercado Pago, Transferencia bancaria (con descuento automático) y Efectivo en showroom.
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
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
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
            cashEnabled={cashEnabled}
            onCashEnabledChange={setCashEnabled}
            cashNotes={cashNotes}
            onCashNotesChange={setCashNotes}
            whatsappPaymentEnabled={whatsappPaymentEnabled}
            onWhatsappPaymentEnabledChange={setWhatsappPaymentEnabled}
          />
        </div>

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

