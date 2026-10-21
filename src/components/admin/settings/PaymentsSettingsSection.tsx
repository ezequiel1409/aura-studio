"use client";

import { useState } from "react";
import {
  Building2,
  CreditCard,
  Banknote,
  MessageCircle,
  ShieldCheck,
  Percent,
  Info,
  ChevronDown,
  ChevronUp,
  QrCode,
  Wallet,
  ExternalLink,
  CheckCircle2,
  Link2,
  Unlink,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export const ARGENTINE_POPULAR_BANKS = [
  "Banco Galicia",
  "Banco Santander",
  "BBVA Francés",
  "Banco Macro",
  "Banco Nación",
  "Banco Provincia",
  "Banco Ciudad",
  "Brubank",
  "Mercado Pago / CVU",
  "Ualá",
  "Reba",
  "Naranja X",
  "Otro (Personalizado)",
];

export interface PaymentsSettingsSectionProps {
  // Mercado Pago
  mercadopagoEnabled: boolean;
  onMercadopagoEnabledChange: (val: boolean) => void;
  mercadopagoAccessToken?: string;
  onMercadopagoAccessTokenChange?: (val: string) => void;
  mercadopagoPublicKey?: string;
  onMercadopagoPublicKeyChange?: (val: string) => void;
  mercadopagoConnectedAccount?: string;
  onDisconnectMercadoPago?: () => void;
  // Transferencia Bancaria
  transferEnabled: boolean;
  onTransferEnabledChange: (val: boolean) => void;
  transferBankName: string;
  onTransferBankNameChange: (val: string) => void;
  transferAccountHolder: string;
  onTransferAccountHolderChange: (val: string) => void;
  transferCbu: string;
  onTransferCbuChange: (val: string) => void;
  transferAlias: string;
  onTransferAliasChange: (val: string) => void;
  transferCuit: string;
  onTransferCuitChange: (val: string) => void;
  transferDiscountPercent: number;
  onTransferDiscountPercentChange: (val: number) => void;
  // Payway (Prisma)
  paywayEnabled?: boolean;
  onPaywayEnabledChange?: (val: boolean) => void;
  paywayApiKey?: string;
  onPaywayApiKeyChange?: (val: string) => void;
  paywayMerchantId?: string;
  onPaywayMerchantIdChange?: (val: string) => void;
  paywayEnvironment?: "sandbox" | "production";
  onPaywayEnvironmentChange?: (val: "sandbox" | "production") => void;
  paywayCuotaSimpleEnabled?: boolean;
  onPaywayCuotaSimpleEnabledChange?: (val: boolean) => void;
  // Getnet (Santander)
  getnetEnabled?: boolean;
  onGetnetEnabledChange?: (val: boolean) => void;
  getnetClientId?: string;
  onGetnetClientIdChange?: (val: string) => void;
  getnetClientSecret?: string;
  onGetnetClientSecretChange?: (val: string) => void;
  getnetSellerId?: string;
  onGetnetSellerIdChange?: (val: string) => void;
  getnetEnvironment?: "sandbox" | "production";
  onGetnetEnvironmentChange?: (val: "sandbox" | "production") => void;
  // MODO (Billetera Bancaria)
  modoEnabled?: boolean;
  onModoEnabledChange?: (val: boolean) => void;
  modoMerchantId?: string;
  onModoMerchantIdChange?: (val: string) => void;
  modoTerminalId?: string;
  onModoTerminalIdChange?: (val: string) => void;
  // Google Pay
  googlePayEnabled?: boolean;
  onGooglePayEnabledChange?: (val: boolean) => void;
  googlePayMerchantId?: string;
  onGooglePayMerchantIdChange?: (val: string) => void;
  // Efectivo
  cashEnabled: boolean;
  onCashEnabledChange: (val: boolean) => void;
  cashNotes: string;
  onCashNotesChange: (val: string) => void;
  // WhatsApp
  whatsappPaymentEnabled: boolean;
  onWhatsappPaymentEnabledChange: (val: boolean) => void;
}

export function PaymentsSettingsSection({
  mercadopagoEnabled,
  onMercadopagoEnabledChange,
  mercadopagoAccessToken = "",
  onMercadopagoAccessTokenChange = () => {},
  mercadopagoPublicKey = "",
  onMercadopagoPublicKeyChange = () => {},
  mercadopagoConnectedAccount = "",
  onDisconnectMercadoPago,
  transferEnabled,
  onTransferEnabledChange,
  transferBankName,
  onTransferBankNameChange,
  transferAccountHolder,
  onTransferAccountHolderChange,
  transferCbu,
  onTransferCbuChange,
  transferAlias,
  onTransferAliasChange,
  transferCuit,
  onTransferCuitChange,
  transferDiscountPercent,
  onTransferDiscountPercentChange,
  paywayEnabled = false,
  onPaywayEnabledChange = () => {},
  paywayApiKey = "",
  onPaywayApiKeyChange = () => {},
  paywayMerchantId = "",
  onPaywayMerchantIdChange = () => {},
  paywayEnvironment = "sandbox",
  onPaywayEnvironmentChange = () => {},
  paywayCuotaSimpleEnabled = true,
  onPaywayCuotaSimpleEnabledChange = () => {},
  getnetEnabled = false,
  onGetnetEnabledChange = () => {},
  getnetClientId = "",
  onGetnetClientIdChange = () => {},
  getnetClientSecret = "",
  onGetnetClientSecretChange = () => {},
  getnetSellerId = "",
  onGetnetSellerIdChange = () => {},
  getnetEnvironment = "sandbox",
  onGetnetEnvironmentChange = () => {},
  modoEnabled = false,
  onModoEnabledChange = () => {},
  modoMerchantId = "",
  onModoMerchantIdChange = () => {},
  modoTerminalId = "",
  onModoTerminalIdChange = () => {},
  googlePayEnabled = false,
  onGooglePayEnabledChange = () => {},
  googlePayMerchantId = "",
  onGooglePayMerchantIdChange = () => {},
  cashEnabled,
  onCashEnabledChange,
  cashNotes,
  onCashNotesChange,
  whatsappPaymentEnabled,
  onWhatsappPaymentEnabledChange,
}: PaymentsSettingsSectionProps) {
  // Estado de secciones colapsables (acordeón individual o múltiple)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    transfer: true,
    mercadopago: false,
    payway: false,
    getnet: false,
    modo: false,
    googlepay: false,
    cash: false,
    whatsapp: false,
  });

  const [showMpToken, setShowMpToken] = useState(false);
  const [connectingMp, setConnectingMp] = useState(false);
  const [disconnectingMp, setDisconnectingMp] = useState(false);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartMercadoPagoOAuth = async () => {
    setConnectingMp(true);
    try {
      const res = await fetch("/api/admin/payments/mercadopago/connect");
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo iniciar la conexión con Mercado Pago.");
      }
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al conectar con Mercado Pago");
      setConnectingMp(false);
    }
  };

  const handleDisconnectMp = async () => {
    if (!confirm("¿Seguro que deseás desvincular la cuenta de Mercado Pago de tu tienda?")) {
      return;
    }
    setDisconnectingMp(true);
    try {
      const res = await fetch("/api/admin/payments/mercadopago/disconnect", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al desvincular");
      }
      if (onDisconnectMercadoPago) {
        onDisconnectMercadoPago();
      }
      onMercadopagoEnabledChange(false);
      onMercadopagoAccessTokenChange("");
      onMercadopagoPublicKeyChange("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al desvincular");
    } finally {
      setDisconnectingMp(false);
    }
  };

  return (
    <div
      id="settings-panel-payments"
      role="tabpanel"
      aria-labelledby="settings-tab-payments"
      className="space-y-4"
    >
      {/* 1. TRANSFERENCIA BANCARIA INMEDIATA (ACORDEÓN COLAPSABLE) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">Transferencia Bancaria</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  Recomendado
                </span>
                {transferDiscountPercent > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                    {transferDiscountPercent}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">
                CBU/CVU o Alias con bonificación automática por pago directo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={transferEnabled}
                onChange={(e) => onTransferEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-200">
                {transferEnabled ? "Habilitado" : "Deshabilitado"}
              </span>
            </label>

            <button
              type="button"
              onClick={() => toggleSection("transfer")}
              aria-expanded={openSections.transfer}
              className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
              title={openSections.transfer ? "Colapsar detalles" : "Expandir para configurar"}
            >
              {openSections.transfer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.transfer && (
          <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Descuento Automático */}
              <div className="space-y-1 sm:col-span-2">
                <label
                  htmlFor="transferDiscountInput"
                  className="text-xs font-medium text-zinc-300 flex items-center gap-1.5"
                >
                  <Percent size={14} className="text-amber-300" />
                  <span>Descuento automático por pago por transferencia (% OFF)</span>
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    id="transferDiscountInput"
                    type="number"
                    min={0}
                    max={100}
                    value={transferDiscountPercent}
                    onChange={(e) =>
                      onTransferDiscountPercentChange(
                        Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0))
                      )
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs font-bold text-zinc-400">%</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Se calcula e informa automáticamente en la bolsa y el checkout (ej. 10% OFF).
                </p>
              </div>

              {/* Selector de Bancos Populares */}
              <div className="space-y-1">
                <label htmlFor="transferBankSelect" className="text-xs font-medium text-zinc-300">
                  Banco o Billetera Receptora
                </label>
                <div className="space-y-2">
                  <select
                    id="transferBankSelect"
                    value={
                      ARGENTINE_POPULAR_BANKS.includes(transferBankName)
                        ? transferBankName
                        : transferBankName
                        ? "Otro (Personalizado)"
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Otro (Personalizado)") {
                        if (ARGENTINE_POPULAR_BANKS.includes(transferBankName)) {
                          onTransferBankNameChange("");
                        }
                      } else {
                        onTransferBankNameChange(val);
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="">Seleccionar entidad bancaria...</option>
                    {ARGENTINE_POPULAR_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Nombre del banco o entidad..."
                    value={transferBankName}
                    onChange={(e) => onTransferBankNameChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Titular de la Cuenta */}
              <div className="space-y-1">
                <label htmlFor="transferAccountHolderInput" className="text-xs font-medium text-zinc-300">
                  Titular de la cuenta
                </label>
                <input
                  id="transferAccountHolderInput"
                  type="text"
                  placeholder="Ej. Aura Studio SRL o Martina Gómez"
                  value={transferAccountHolder}
                  onChange={(e) => onTransferAccountHolderChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Alias */}
              <div className="space-y-1">
                <label htmlFor="transferAliasInput" className="text-xs font-medium text-zinc-300">
                  Alias bancario
                </label>
                <input
                  id="transferAliasInput"
                  type="text"
                  placeholder="Ej. AURA.STUDIO.PAGO"
                  value={transferAlias}
                  onChange={(e) => onTransferAliasChange(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* CUIT / CUIL */}
              <div className="space-y-1">
                <label htmlFor="transferCuitInput" className="text-xs font-medium text-zinc-300">
                  CUIT / CUIL
                </label>
                <input
                  id="transferCuitInput"
                  type="text"
                  placeholder="Ej. 30-12345678-9"
                  value={transferCuit}
                  onChange={(e) => onTransferCuitChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* CBU / CVU */}
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="transferCbuInput" className="text-xs font-medium text-zinc-300">
                  CBU / CVU (22 dígitos)
                </label>
                <input
                  id="transferCbuInput"
                  type="text"
                  maxLength={22}
                  placeholder="Ej. 0720123400000012345678"
                  value={transferCbu}
                  onChange={(e) => onTransferCbuChange(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                />
                {transferCbu && transferCbu.length !== 22 && (
                  <p className="text-[11px] text-amber-400">
                    Atención: Un CBU/CVU válido tiene exactamente 22 dígitos (actual: {transferCbu.length}).
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MERCADO PAGO GATEWAY CON OAUTH 2.0 & CREDENCIALES (COLAPSABLE) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
              <CreditCard size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">Mercado Pago</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-950 text-sky-400 border border-sky-800/60 px-2 py-0.5 rounded-full">
                  Checkout Pro
                </span>
                {mercadopagoConnectedAccount && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>Conectado</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Tarjetas de crédito, débito, dinero en cuenta y cuotas bancarias.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={mercadopagoEnabled}
                onChange={(e) => onMercadopagoEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-sky-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-200">
                {mercadopagoEnabled ? "Habilitado" : "Deshabilitado"}
              </span>
            </label>

            <button
              type="button"
              onClick={() => toggleSection("mercadopago")}
              aria-expanded={openSections.mercadopago}
              className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
              title={openSections.mercadopago ? "Colapsar detalles" : "Expandir para configurar"}
            >
              {openSections.mercadopago ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.mercadopago && (
          <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950/40">
            {/* OPCIÓN A: VINCULACIÓN OAUTH 2.0 (MERCADO PAGO CONNECT) */}
            <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-200">
                    <Link2 size={15} className="text-sky-400" />
                    <span>Sincronización Rápida con Mercado Pago (OAuth)</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Iniciá sesión en Mercado Pago para autorizar los cobros en tu tienda en 1 clic.
                    No necesitás copiar ni pegar claves ni tokens privados manualmente.
                  </p>
                </div>

                {mercadopagoConnectedAccount ? (
                  <button
                    type="button"
                    onClick={handleDisconnectMp}
                    disabled={disconnectingMp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold shrink-0 cursor-pointer transition-all"
                  >
                    <Unlink size={13} />
                    <span>{disconnectingMp ? "Desvinculando..." : "Desconectar"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartMercadoPagoOAuth}
                    disabled={connectingMp}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold shrink-0 cursor-pointer transition-all shadow-sm"
                  >
                    <ExternalLink size={13} />
                    <span>{connectingMp ? "Conectando..." : "Conectar con Mercado Pago"}</span>
                  </button>
                )}
              </div>

              {mercadopagoConnectedAccount && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span className="text-zinc-200 font-mono text-[11px]">
                    Cuenta vinculada: <strong>{mercadopagoConnectedAccount}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* OPCIÓN B: CREDENCIALES MANUALES (ACCESO DIRECTO / DEVS) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-amber-400" />
                <span>O ingresá tus credenciales manualmente (Access Token & Public Key)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="mpAccessTokenInput" className="text-xs font-medium text-zinc-300">
                      Access Token de Producción
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMpToken(!showMpToken)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1"
                    >
                      {showMpToken ? <EyeOff size={12} /> : <Eye size={12} />}
                      <span>{showMpToken ? "Ocultar" : "Mostrar"}</span>
                    </button>
                  </div>
                  <input
                    id="mpAccessTokenInput"
                    type={showMpToken ? "text" : "password"}
                    placeholder="APP_USR-0000000000000000-000000-..."
                    value={mercadopagoAccessToken}
                    onChange={(e) => onMercadopagoAccessTokenChange(e.target.value.trim())}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="mpPublicKeyInput" className="text-xs font-medium text-zinc-300">
                    Public Key
                  </label>
                  <input
                    id="mpPublicKeyInput"
                    type="text"
                    placeholder="APP_USR-00000000-0000-0000-..."
                    value={mercadopagoPublicKey}
                    onChange={(e) => onMercadopagoPublicKeyChange(e.target.value.trim())}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Webhook de notificaciones de cobro automático:</span>
                <code className="text-zinc-200 font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded">
                  /api/payments/webhook/mercadopago
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. PAYWAY (PRISMA MEDIOS DE PAGO) (COLAPSABLE) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <CreditCard size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">Payway (Prisma Medios de Pago)</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800/60 px-2 py-0.5 rounded-full">
                  Cuota Simple & Tarjetas
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Procesador oficial de Visa, Mastercard y Cabal en Argentina con planes de cuotas bancarias.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={paywayEnabled}
                onChange={(e) => onPaywayEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-200">
                {paywayEnabled ? "Habilitado" : "Deshabilitado"}
              </span>
            </label>

            <button
              type="button"
              onClick={() => toggleSection("payway")}
              aria-expanded={openSections.payway}
              className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
              title={openSections.payway ? "Colapsar detalles" : "Expandir para configurar"}
            >
              {openSections.payway ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.payway && (
          <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="paywayApiKeyInput" className="text-xs font-medium text-zinc-300">
                  Public API Key / Token de Comercio
                </label>
                <input
                  id="paywayApiKeyInput"
                  type="text"
                  placeholder="Ej. live_pk_..."
                  value={paywayApiKey}
                  onChange={(e) => onPaywayApiKeyChange(e.target.value.trim())}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="paywayMerchantIdInput" className="text-xs font-medium text-zinc-300">
                  N° de Establecimiento (Merchant ID)
                </label>
                <input
                  id="paywayMerchantIdInput"
                  type="text"
                  placeholder="Ej. 15002498"
                  value={paywayMerchantId}
                  onChange={(e) => onPaywayMerchantIdChange(e.target.value.trim())}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="paywayEnvironmentSelect" className="text-xs font-medium text-zinc-300">
                  Entorno de Operación
                </label>
                <select
                  id="paywayEnvironmentSelect"
                  value={paywayEnvironment}
                  onChange={(e) => onPaywayEnvironmentChange(e.target.value as "sandbox" | "production")}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  <option value="sandbox">Sandbox (Pruebas / Homologación)</option>
                  <option value="production">Producción (Cobro real en pesos)</option>
                </select>
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <input
                    type="checkbox"
                    checked={paywayCuotaSimpleEnabled}
                    onChange={(e) => onPaywayCuotaSimpleEnabledChange(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-400"
                  />
                  <span className="text-xs font-semibold text-zinc-200">
                    Habilitar Cuota Simple (Ahora 12)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. GETNET (SANTANDER) (COLAPSABLE) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
              <CreditCard size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">Getnet (Santander)</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800/60 px-2 py-0.5 rounded-full">
                  Santander Adquirencia
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Adquirencia oficial del Banco Santander con acreditación directa y tasas diferenciales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={getnetEnabled}
                onChange={(e) => onGetnetEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-rose-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-200">
                {getnetEnabled ? "Habilitado" : "Deshabilitado"}
              </span>
            </label>

            <button
              type="button"
              onClick={() => toggleSection("getnet")}
              aria-expanded={openSections.getnet}
              className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
              title={openSections.getnet ? "Colapsar detalles" : "Expandir para configurar"}
            >
              {openSections.getnet ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.getnet && (
          <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="getnetClientIdInput" className="text-xs font-medium text-zinc-300">
                  Client ID de Getnet
                </label>
                <input
                  id="getnetClientIdInput"
                  type="text"
                  placeholder="Ej. getnet_client_..."
                  value={getnetClientId}
                  onChange={(e) => onGetnetClientIdChange(e.target.value.trim())}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="getnetSellerIdInput" className="text-xs font-medium text-zinc-300">
                  Seller ID / Identificador de Comercio
                </label>
                <input
                  id="getnetSellerIdInput"
                  type="text"
                  placeholder="Ej. 7001452"
                  value={getnetSellerId}
                  onChange={(e) => onGetnetSellerIdChange(e.target.value.trim())}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="getnetClientSecretInput" className="text-xs font-medium text-zinc-300">
                  Client Secret
                </label>
                <input
                  id="getnetClientSecretInput"
                  type="password"
                  placeholder="••••••••••••••••"
                  value={getnetClientSecret}
                  onChange={(e) => onGetnetClientSecretChange(e.target.value.trim())}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="getnetEnvironmentSelect" className="text-xs font-medium text-zinc-300">
                  Entorno de Operación
                </label>
                <select
                  id="getnetEnvironmentSelect"
                  value={getnetEnvironment}
                  onChange={(e) => onGetnetEnvironmentChange(e.target.value as "sandbox" | "production")}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-400 cursor-pointer"
                >
                  <option value="sandbox">Sandbox (Pruebas)</option>
                  <option value="production">Producción (Cobro real)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODO (BILLETERA BANCARIA NACIONAL) (COLAPSABLE) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
              <QrCode size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">MODO (App Bancaria & QR)</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-950 text-teal-400 border border-teal-800/60 px-2 py-0.5 rounded-full">
                  QR Interoperable
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Cobros con QR interoperable desde apps de +35 bancos (Galicia, BBVA, Santander, Macro).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={modoEnabled}
                onChange={(e) => onModoEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-teal-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-200">
                {modoEnabled ? "Habilitado" : "Deshabilitado"}
              </span>
            </label>

            <button
              type="button"
              onClick={() => toggleSection("modo")}
              aria-expanded={openSections.modo}
              className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
              title={openSections.modo ? "Colapsar detalles" : "Expandir para configurar"}
            >
              {openSections.modo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.modo && (
          <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="modoMerchantIdInput" className="text-xs font-medium text-zinc-300">
                  Merchant ID de MODO
                </label>
                <input
                  id="modoMerchantIdInput"
                  type="text"
                  placeholder="Ej. modo_merch_001"
                  value={modoMerchantId}
                  onChange={(e) => onModoMerchantIdChange(e.target.value.trim())}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="modoTerminalIdInput" className="text-xs font-medium text-zinc-300">
                  Terminal ID (QR)
                </label>
                <input
                  id="modoTerminalIdInput"
                  type="text"
                  placeholder="Ej. TERM-01"
                  value={modoTerminalId}
                  onChange={(e) => onModoTerminalIdChange(e.target.value.trim())}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              Al escanear con la app del banco, los clientes acceden a las promociones y reintegros automáticos vigentes del consorcio MODO.
            </p>
          </div>
        )}
      </div>

      {/* 6. GOOGLE PAY & WALLETS (COLAPSABLE) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Wallet size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">Google Pay</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-full">
                  Billeteras Digitales 1-Clic
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Pago instantáneo con autenticación biométrica y tarjetas asociadas a la cuenta Google.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={googlePayEnabled}
                onChange={(e) => onGooglePayEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-200">
                {googlePayEnabled ? "Habilitado" : "Deshabilitado"}
              </span>
            </label>

            <button
              type="button"
              onClick={() => toggleSection("googlepay")}
              aria-expanded={openSections.googlepay}
              className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
              title={openSections.googlepay ? "Colapsar detalles" : "Expandir para configurar"}
            >
              {openSections.googlepay ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.googlepay && (
          <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950/40">
            <div className="space-y-1 max-w-md">
              <label htmlFor="googlePayMerchantIdInput" className="text-xs font-medium text-zinc-300">
                Google Pay Merchant ID (Opcional en sandbox)
              </label>
              <input
                id="googlePayMerchantIdInput"
                type="text"
                placeholder="Ej. BCR2DN6T..."
                value={googlePayMerchantId}
                onChange={(e) => onGooglePayMerchantIdChange(e.target.value.trim())}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Google Pay se liquida a través de la pasarela de pagos activa (Mercado Pago / Payway / Stripe) mediante la API W3C Payment Request, garantizando tokenización segura sin almacenar datos de tarjeta en el servidor.
            </p>
          </div>
        )}
      </div>

      {/* 7. EFECTIVO / RETIRO EN SHOWROOM (COLAPSABLE) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Banknote size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-zinc-100">Pago en Efectivo</h2>
              <p className="text-xs text-zinc-400 truncate">
                Permitir pago al retirar en el local o contra entrega.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={cashEnabled}
                onChange={(e) => onCashEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-200">
                {cashEnabled ? "Habilitado" : "Deshabilitado"}
              </span>
            </label>

            <button
              type="button"
              onClick={() => toggleSection("cash")}
              aria-expanded={openSections.cash}
              className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
              title={openSections.cash ? "Colapsar detalles" : "Expandir para configurar"}
            >
              {openSections.cash ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.cash && (
          <div className="p-5 border-t border-zinc-800 space-y-2 bg-zinc-950/40">
            <label htmlFor="cashNotesInput" className="text-xs font-medium text-zinc-300">
              Instrucciones / Notas para el cliente
            </label>
            <input
              id="cashNotesInput"
              type="text"
              placeholder="Ej. Pago exacto al retirar en showroom dentro de las 48hs."
              value={cashNotes}
              onChange={(e) => onCashNotesChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-400"
            />
          </div>
        )}
      </div>

      {/* 8. COORDINACIÓN POR WHATSAPP (COLAPSABLE) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-zinc-100">Coordinar por WhatsApp</h2>
              <p className="text-xs text-zinc-400 truncate">
                Asistencia directa por chat para coordinar el pago o convenir medios alternativos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={whatsappPaymentEnabled}
                onChange={(e) => onWhatsappPaymentEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-green-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-200">
                {whatsappPaymentEnabled ? "Habilitado" : "Deshabilitado"}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
