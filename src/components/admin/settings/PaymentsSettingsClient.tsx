"use client";

import { useEffect, useState } from "react";
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
  // 1. Mercado Pago
  const [mercadopagoEnabled, setMercadopagoEnabled] = useState(
    initialSettings.mercadopagoEnabled ?? false
  );
  const [mercadopagoAccessToken, setMercadopagoAccessToken] = useState(
    initialSettings.mercadopagoAccessToken || ""
  );
  const [mercadopagoPublicKey, setMercadopagoPublicKey] = useState(
    initialSettings.mercadopagoPublicKey || ""
  );
  const [mercadopagoConnectedAccount, setMercadopagoConnectedAccount] = useState(
    initialSettings.mercadopagoConnectedAccount || ""
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
  const [paywayApiKey, setPaywayApiKey] = useState(
    initialSettings.paywayApiKey || ""
  );
  const [paywayMerchantId, setPaywayMerchantId] = useState(
    initialSettings.paywayMerchantId || ""
  );
  const [paywayEnvironment, setPaywayEnvironment] = useState<"sandbox" | "production">(
    initialSettings.paywayEnvironment || "sandbox"
  );
  const [paywayCuotaSimpleEnabled, setPaywayCuotaSimpleEnabled] = useState(
    initialSettings.paywayCuotaSimpleEnabled ?? true
  );

  // 4. Getnet (Santander)
  const [getnetEnabled, setGetnetEnabled] = useState(
    initialSettings.getnetEnabled ?? false
  );
  const [getnetClientId, setGetnetClientId] = useState(
    initialSettings.getnetClientId || ""
  );
  const [getnetClientSecret, setGetnetClientSecret] = useState(
    initialSettings.getnetClientSecret || ""
  );
  const [getnetSellerId, setGetnetSellerId] = useState(
    initialSettings.getnetSellerId || ""
  );
  const [getnetEnvironment, setGetnetEnvironment] = useState<"sandbox" | "production">(
    initialSettings.getnetEnvironment || "sandbox"
  );

  // 5. MODO (Billetera Bancaria)
  const [modoEnabled, setModoEnabled] = useState(
    initialSettings.modoEnabled ?? false
  );
  const [modoMerchantId, setModoMerchantId] = useState(
    initialSettings.modoMerchantId || ""
  );
  const [modoTerminalId, setModoTerminalId] = useState(
    initialSettings.modoTerminalId || ""
  );

  // 6. Google Pay
  const [googlePayEnabled, setGooglePayEnabled] = useState(
    initialSettings.googlePayEnabled ?? false
  );
  const [googlePayMerchantId, setGooglePayMerchantId] = useState(
    initialSettings.googlePayMerchantId || ""
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

  // Detectar respuesta de Mercado Pago OAuth al regresar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "mp_connected") {
      setFeedback({
        type: "ok",
        text: "¡Cuenta de Mercado Pago sincronizada exitosamente con tu tienda Aura!",
      });
      setMercadopagoEnabled(true);
      // Limpiar query param para evitar repetir aviso
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("error")) {
      setFeedback({
        type: "error",
        text: decodeURIComponent(params.get("error") || "Error en la conexión con Mercado Pago."),
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
          mercadopagoAccessToken: mercadopagoAccessToken.trim(),
          mercadopagoPublicKey: mercadopagoPublicKey.trim(),
          mercadopagoConnectedAccount: mercadopagoConnectedAccount.trim(),
          transferEnabled,
          transferBankName: transferBankName.trim(),
          transferAccountHolder: transferAccountHolder.trim(),
          transferCbu: transferCbu.trim(),
          transferAlias: transferAlias.trim(),
          transferCuit: transferCuit.trim(),
          transferDiscountPercent,
          paywayEnabled,
          paywayApiKey: paywayApiKey.trim(),
          paywayMerchantId: paywayMerchantId.trim(),
          paywayEnvironment,
          paywayCuotaSimpleEnabled,
          getnetEnabled,
          getnetClientId: getnetClientId.trim(),
          getnetClientSecret: getnetClientSecret.trim(),
          getnetSellerId: getnetSellerId.trim(),
          getnetEnvironment,
          modoEnabled,
          modoMerchantId: modoMerchantId.trim(),
          modoTerminalId: modoTerminalId.trim(),
          googlePayEnabled,
          googlePayMerchantId: googlePayMerchantId.trim(),
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
        text: "Medios de pago y procesadores actualizados correctamente. Ya impactan en el carrito y checkout.",
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
          Tienda › Medios de Pago & Pasarelas
        </span>
        <h1 className="text-xl sm:text-2xl font-serif font-light text-zinc-100 mt-1">
          Medios de Pago y Cobro
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configurá las formas de cobro para tus clientes con secciones colapsables dedicadas: Mercado Pago (con OAuth 2.0 y claves directas), Transferencia bancaria (con descuento automático), Payway (Prisma / Cuota Simple), Getnet (Santander), MODO (QR bancario interoperable), Google Pay y Efectivo.
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
          mercadopagoAccessToken={mercadopagoAccessToken}
          onMercadopagoAccessTokenChange={setMercadopagoAccessToken}
          mercadopagoPublicKey={mercadopagoPublicKey}
          onMercadopagoPublicKeyChange={setMercadopagoPublicKey}
          mercadopagoConnectedAccount={mercadopagoConnectedAccount}
          onDisconnectMercadoPago={() => setMercadopagoConnectedAccount("")}
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
          paywayApiKey={paywayApiKey}
          onPaywayApiKeyChange={setPaywayApiKey}
          paywayMerchantId={paywayMerchantId}
          onPaywayMerchantIdChange={setPaywayMerchantId}
          paywayEnvironment={paywayEnvironment}
          onPaywayEnvironmentChange={setPaywayEnvironment}
          paywayCuotaSimpleEnabled={paywayCuotaSimpleEnabled}
          onPaywayCuotaSimpleEnabledChange={setPaywayCuotaSimpleEnabled}
          getnetEnabled={getnetEnabled}
          onGetnetEnabledChange={setGetnetEnabled}
          getnetClientId={getnetClientId}
          onGetnetClientIdChange={setGetnetClientId}
          getnetClientSecret={getnetClientSecret}
          onGetnetClientSecretChange={setGetnetClientSecret}
          getnetSellerId={getnetSellerId}
          onGetnetSellerIdChange={setGetnetSellerId}
          getnetEnvironment={getnetEnvironment}
          onGetnetEnvironmentChange={setGetnetEnvironment}
          modoEnabled={modoEnabled}
          onModoEnabledChange={setModoEnabled}
          modoMerchantId={modoMerchantId}
          onModoMerchantIdChange={setModoMerchantId}
          modoTerminalId={modoTerminalId}
          onModoTerminalIdChange={setModoTerminalId}
          googlePayEnabled={googlePayEnabled}
          onGooglePayEnabledChange={setGooglePayEnabled}
          googlePayMerchantId={googlePayMerchantId}
          onGooglePayMerchantIdChange={setGooglePayMerchantId}
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
