"use client";

import { useEffect, useState } from "react";
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
  CheckCircle2,
  AlertCircle,
  Server,
  RefreshCw,
  Lock,
  Terminal,
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
  paywayEnvironment?: "sandbox" | "production";
  onPaywayEnvironmentChange?: (val: "sandbox" | "production") => void;
  paywayCuotaSimpleEnabled?: boolean;
  onPaywayCuotaSimpleEnabledChange?: (val: boolean) => void;
  // Getnet (Santander)
  getnetEnabled?: boolean;
  onGetnetEnabledChange?: (val: boolean) => void;
  getnetEnvironment?: "sandbox" | "production";
  onGetnetEnvironmentChange?: (val: "sandbox" | "production") => void;
  // MODO (Billetera Bancaria)
  modoEnabled?: boolean;
  onModoEnabledChange?: (val: boolean) => void;
  // Google Pay
  googlePayEnabled?: boolean;
  onGooglePayEnabledChange?: (val: boolean) => void;
  // Efectivo
  cashEnabled: boolean;
  onCashEnabledChange: (val: boolean) => void;
  cashNotes: string;
  onCashNotesChange: (val: string) => void;
  // WhatsApp
  whatsappPaymentEnabled: boolean;
  onWhatsappPaymentEnabledChange: (val: boolean) => void;
}

interface ServerPaymentStatus {
  configured: boolean;
  tokenMasked: string | null;
  publicKeyConfigured: boolean;
  publicKey: string | null;
  webhookSecretConfigured: boolean;
  environment: string;
}

interface DiagnosticResult {
  ok: boolean;
  status?: string;
  message?: string;
  error?: string;
  collectorId?: number;
  nickname?: string;
  email?: string;
  siteId?: string;
}

export function PaymentsSettingsSection({
  mercadopagoEnabled,
  onMercadopagoEnabledChange,
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
  paywayEnvironment = "sandbox",
  onPaywayEnvironmentChange = () => {},
  paywayCuotaSimpleEnabled = true,
  onPaywayCuotaSimpleEnabledChange = () => {},
  getnetEnabled = false,
  onGetnetEnabledChange = () => {},
  getnetEnvironment = "sandbox",
  onGetnetEnvironmentChange = () => {},
  modoEnabled = false,
  onModoEnabledChange = () => {},
  googlePayEnabled = false,
  onGooglePayEnabledChange = () => {},
  cashEnabled,
  onCashEnabledChange,
  cashNotes,
  onCashNotesChange,
  whatsappPaymentEnabled,
  onWhatsappPaymentEnabledChange,
}: PaymentsSettingsSectionProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    transfer: true,
    mercadopago: true,
    payway: false,
    getnet: false,
    modo: false,
    googlepay: false,
    cash: false,
    whatsapp: false,
  });

  const [serverStatus, setServerStatus] = useState<ServerPaymentStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Cargar estado de credenciales de servidor
  useEffect(() => {
    let mounted = true;
    async function loadServerStatus() {
      setLoadingStatus(true);
      try {
        const res = await fetch("/api/admin/payments/status");
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.ok && data.mercadopago) {
            setServerStatus(data.mercadopago);
          }
        }
      } catch (err) {
        console.error("Error al cargar estado de pagos:", err);
      } finally {
        if (mounted) setLoadingStatus(false);
      }
    }
    loadServerStatus();
    return () => {
      mounted = false;
    };
  }, []);

  // Diagnóstico Server-to-Server en vivo contra Mercado Pago
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setDiagnostic(null);
    try {
      const res = await fetch("/api/admin/payments/status", { method: "POST" });
      const data = await res.json();
      setDiagnostic(data);
    } catch (err: unknown) {
      setDiagnostic({
        ok: false,
        error: err instanceof Error ? err.message : "Error al conectar con el servidor",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TRANSFERENCIA BANCARIA (DIRECTA / CBU / MANUAL) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">Transferencia Bancaria</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-full">
                  Sin comisión · Directo
                </span>
                {transferDiscountPercent > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    {transferDiscountPercent}% OFF activo
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Cobro directo por CBU/CVU o Alias. Los datos bancarios son visibles públicamente en checkout para que el cliente transfiera.
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
              {/* Banco o Billetera emisora */}
              <div className="space-y-1">
                <label htmlFor="transferBankSelect" className="text-xs font-medium text-zinc-300">
                  Banco o Billetera
                </label>
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="">Seleccionar banco...</option>
                  {ARGENTINE_POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                {(!ARGENTINE_POPULAR_BANKS.includes(transferBankName) ||
                  transferBankName === "Otro (Personalizado)") && (
                  <input
                    type="text"
                    placeholder="Escribí el nombre de tu entidad..."
                    value={transferBankName === "Otro (Personalizado)" ? "" : transferBankName}
                    onChange={(e) => onTransferBankNameChange(e.target.value)}
                    className="w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                )}
              </div>

              {/* % Descuento por Transferencia */}
              <div className="space-y-1">
                <label htmlFor="transferDiscountInput" className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Descuento por abonar por transferencia</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">
                    {transferDiscountPercent}% OFF
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="transferDiscountInput"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={transferDiscountPercent}
                    onChange={(e) => onTransferDiscountPercentChange(Number(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-3.5 pr-8 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                  <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                </div>
              </div>

              {/* Titular */}
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

      {/* 2. MERCADO PAGO - ARQUITECTURA SEGURA SERVER-SIDE (ENCRIPTADA EN CLOUDFLARE) */}
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
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock size={10} />
                  <span>Server Secrets</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Tarjetas de crédito, débito, dinero en cuenta y cuotas bancarias vía API M2M en servidor seguro.
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
            {/* PANEL DE SEGURIDAD Y DIAGNÓSTICO DE SERVIDOR */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <Server size={15} className="text-sky-400" />
                    <span>Estado de Infraestructura y Credenciales de Servidor</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Por normativas de seguridad financiera y PCI-DSS, tus credenciales privadas nunca se almacenan en tablas de base de datos ni viajan en formularios de navegador. Se cargan encriptadas en la memoria del runtime (Cloudflare KMS / <code className="text-zinc-200">.env.local</code>).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold shrink-0 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw size={13} className={testingConnection ? "animate-spin" : ""} />
                  <span>{testingConnection ? "Verificando..." : "Diagnóstico de Servidor"}</span>
                </button>
              </div>

              {/* Badges de variables de entorno de servidor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    Access Token (MP_ACCESS_TOKEN)
                  </span>
                  <div className="flex items-center gap-2">
                    {serverStatus?.configured ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span className="font-mono text-[11px] text-zinc-200 truncate">
                          {serverStatus.tokenMasked || "Configurado"}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} className="text-amber-400 shrink-0" />
                        <span className="text-[11px] text-amber-400">
                          {loadingStatus ? "Consultando..." : "No detectado"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    Webhook Secret (Conciliación)
                  </span>
                  <div className="flex items-center gap-2">
                    {serverStatus?.webhookSecretConfigured ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span className="font-mono text-[11px] text-emerald-300">
                          Firma criptográfica activa
                        </span>
                      </>
                    ) : (
                      <>
                        <Info size={14} className="text-zinc-500 shrink-0" />
                        <span className="text-[11px] text-zinc-400">
                          Opcional / Por defecto
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    Entorno de Ejecución
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] uppercase text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                      {serverStatus?.environment || "production"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resultado del diagnóstico en vivo */}
              {diagnostic && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    diagnostic.ok
                      ? "bg-emerald-950/50 border border-emerald-800 text-emerald-300"
                      : "bg-rose-950/50 border border-rose-800 text-rose-300"
                  }`}
                >
                  {diagnostic.ok ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <strong className="block font-semibold">
                      {diagnostic.ok
                        ? diagnostic.status === "SIMULATED"
                          ? "Modo Simulación de Desarrollo"
                          : "Conexión Exitosa con Mercado Pago (200 OK)"
                        : "Error en Conexión de Servidor"}
                    </strong>
                    <p className="text-[11px] opacity-90">
                      {diagnostic.ok ? (
                        diagnostic.status === "SIMULATED" ? (
                          diagnostic.message
                        ) : (
                          <>
                            Cuenta vinculada: <strong>{diagnostic.nickname || "Comercio"}</strong> (Collector ID: {diagnostic.collectorId || "—"}) {diagnostic.email ? `· ${diagnostic.email}` : ""}
                          </>
                        )
                      ) : (
                        diagnostic.error
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Guía de aprovisionamiento en servidor */}
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                  <Terminal size={13} className="text-amber-400" />
                  <span>Aprovisionamiento Seguro de Credenciales (Sin exposición en front)</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Para actualizar tus credenciales de cobro, configúralas directamente en el entorno seguro de Cloudflare o en tu archivo de variables del servidor:
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-300">
                  <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
                    npx wrangler secret put MP_ACCESS_TOKEN
                  </span>
                  <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
                    npx wrangler secret put MP_WEBHOOK_SECRET
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Webhook URL oficial para conciliación automática de pagos:</span>
                <code className="text-zinc-200 font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded">
                  /api/payments/webhook/mercadopago
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. PAYWAY (PRISMA MEDIOS DE PAGO) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
              <CreditCard size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">Payway (Prisma)</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-950 text-orange-400 border border-orange-800/60 px-2 py-0.5 rounded-full">
                  Prisma Red
                </span>
                {paywayCuotaSimpleEnabled && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    Cuota Simple Activa
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Adquirencia oficial Prisma para Visa, Mastercard y Cabal con soporte de cuotas bancarias.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={paywayEnabled}
                onChange={(e) => onPaywayEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-orange-400 cursor-pointer"
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
            >
              {openSections.payway ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.payway && (
          <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Entorno de Operación
                </label>
                <select
                  value={paywayEnvironment}
                  onChange={(e) => onPaywayEnvironmentChange(e.target.value as "sandbox" | "production")}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-400"
                >
                  <option value="sandbox">Sandbox (Pruebas Prisma)</option>
                  <option value="production">Producción (Cobros Reales)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Planes de Financiación
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paywayCuotaSimpleEnabled}
                    onChange={(e) => onPaywayCuotaSimpleEnabledChange(e.target.checked)}
                    className="h-4 w-4 rounded accent-orange-400 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-200">
                    Habilitar Cuota Simple (3 y 6 cuotas con tasa subsidiada)
                  </span>
                </label>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400">
              * Las credenciales de comercio Payway (Merchant ID y API Key) se inyectan a nivel de variables de servidor para máxima protección.
            </p>
          </div>
        )}
      </div>

      {/* 4. GETNET (GRUPO SANTANDER) */}
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
                  Santander
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Plataforma de adquirencia directa con acreditación en cuenta bancaria Santander.
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
            >
              {openSections.getnet ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.getnet && (
          <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950/40">
            <div className="space-y-1 max-w-sm">
              <label className="text-xs font-medium text-zinc-300">
                Entorno Getnet
              </label>
              <select
                value={getnetEnvironment}
                onChange={(e) => onGetnetEnvironmentChange(e.target.value as "sandbox" | "production")}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-400"
              >
                <option value="sandbox">Sandbox (Pruebas)</option>
                <option value="production">Producción Santander</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODO (BILLETERA BANCARIA NACIONAL & QR) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <QrCode size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">MODO (App Bancaria & QR)</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  +35 Bancos
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Cobro con QR interoperable directo a cuentas bancarias con reintegros oficiales MODO.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={modoEnabled}
                onChange={(e) => onModoEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-200">
                {modoEnabled ? "Habilitado" : "Deshabilitado"}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 6. GOOGLE PAY (BILLETERAS DIGITALES 1-CLIC) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <Wallet size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">Google Pay</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800/60 px-2 py-0.5 rounded-full">
                  1 Clic Biometría
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Pago exprés y seguro sin tipeo de datos desde Chrome o dispositivos Android.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={googlePayEnabled}
                onChange={(e) => onGooglePayEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-200">
                {googlePayEnabled ? "Habilitado" : "Deshabilitado"}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 7. EFECTIVO AL RETIRAR O RECIBIR */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-lime-500/10 border border-lime-500/20 text-lime-400 shrink-0">
              <Banknote size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">Efectivo</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-lime-950 text-lime-400 border border-lime-800/60 px-2 py-0.5 rounded-full">
                  Contra entrega
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Abono físico al momento de retirar en el showroom o recibir por cadetería local.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={cashEnabled}
                onChange={(e) => onCashEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-lime-400 cursor-pointer"
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
            >
              {openSections.cash ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.cash && (
          <div className="p-5 border-t border-zinc-800 space-y-3 bg-zinc-950/40">
            <label htmlFor="cashNotesInput" className="text-xs font-medium text-zinc-300 block">
              Instrucciones para el cliente
            </label>
            <textarea
              id="cashNotesInput"
              rows={2}
              placeholder="Ej. Abonás al retirar en nuestro local de Palermo. Tené el importe exacto si es posible."
              value={cashNotes}
              onChange={(e) => onCashNotesChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-lime-400"
            />
          </div>
        )}
      </div>

      {/* 8. COORDINAR POR WHATSAPP */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">Coordinar por WhatsApp</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  Atención Personalizada
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Permite al cliente finalizar el pedido y coordinar el pago directo con una asesora.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={whatsappPaymentEnabled}
                onChange={(e) => onWhatsappPaymentEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-400 cursor-pointer"
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
