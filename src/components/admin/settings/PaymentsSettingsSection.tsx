"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  Banknote,
  MessageCircle,
  Percent,
  ChevronDown,
  ChevronUp,
  QrCode,
  Wallet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  HelpCircle,
} from "lucide-react";

/**
 * =========================================================================================
 * NOTA PARA EL DESARROLLADOR: APROVISIONAMIENTO SEGURO DE PASARELAS DE PAGO (FINTECH / PCI-DSS)
 * =========================================================================================
 * Por directiva de arquitectura y seguridad financiera, las credenciales privadas (Access Tokens,
 * Client Secrets, API Keys y Webhook Secrets) NUNCA se exponen en la interfaz del cliente final
 * ni se almacenan en tablas de la base de datos pública.
 *
 * Para activar pasarelas de pago de forma segura en producción (Cloudflare Edge Workers):
 * 1. Mercado Pago:
 *    npx wrangler secret put MP_ACCESS_TOKEN
 *    npx wrangler secret put MP_WEBHOOK_SECRET
 *    (Para entorno de desarrollo local, definirlas en .env.local)
 *
 * 2. Payway / Prisma Medios de Pago:
 *    npx wrangler secret put PAYWAY_API_KEY
 *    npx wrangler secret put PAYWAY_MERCHANT_ID
 *
 * 3. Getnet / Santander:
 *    npx wrangler secret put GETNET_CLIENT_ID
 *    npx wrangler secret put GETNET_CLIENT_SECRET
 *
 * 4. MODO & Google Pay:
 *    npx wrangler secret put MODO_API_KEY / GOOGLEPAY_MERCHANT_ID
 * =========================================================================================
 */

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
  // Efectivo
  cashEnabled: boolean;
  onCashEnabledChange: (val: boolean) => void;
  cashNotes: string;
  onCashNotesChange: (val: string) => void;
  // WhatsApp
  whatsappPaymentEnabled: boolean;
  onWhatsappPaymentEnabledChange: (val: boolean) => void;
  // Opciones comerciales adicionales (opcionales)
  paywayEnabled?: boolean;
  onPaywayEnabledChange?: (val: boolean) => void;
  getnetEnabled?: boolean;
  onGetnetEnabledChange?: (val: boolean) => void;
  modoEnabled?: boolean;
  onModoEnabledChange?: (val: boolean) => void;
  googlePayEnabled?: boolean;
  onGooglePayEnabledChange?: (val: boolean) => void;
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
    cash: false,
    whatsapp: false,
    otherGateways: false,
  });

  const [serverStatus, setServerStatus] = useState<ServerPaymentStatus | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Consultar disponibilidad de Mercado Pago en el servidor
  useEffect(() => {
    let mounted = true;
    async function loadServerStatus() {
      try {
        const res = await fetch("/api/admin/payments/status");
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.ok && data.mercadopago) {
            setServerStatus(data.mercadopago);
          }
        }
      } catch (err) {
        console.error("Error al consultar estado de cobro:", err);
      }
    }
    loadServerStatus();
    return () => {
      mounted = false;
    };
  }, []);

  // Comprobar la conexión con la cuenta de Mercado Pago
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
        error: err instanceof Error ? err.message : "No se pudo conectar con el servidor",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const isMpReady = Boolean(serverStatus?.configured);

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
                  Sin comisión
                </span>
                {transferDiscountPercent > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                    {transferDiscountPercent}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Cobrá directo por CBU/CVU o Alias a tu cuenta bancaria.
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
              title={openSections.transfer ? "Ocultar datos" : "Ver datos"}
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
                  <span>Descuento por transferir</span>
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
                    Atención: Un CBU/CVU válido tiene 22 dígitos (actual: {transferCbu.length}).
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MERCADO PAGO - ESTADO SIMPLE PARA EL USUARIO */}
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
                {isMpReady ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>Conectado</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>Requiere activación</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Tarjetas de crédito, débito, dinero en cuenta y cuotas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <label
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-zinc-950/70 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
            >
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
            >
              {openSections.mercadopago ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {openSections.mercadopago && (
          <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950/40">
            {isMpReady ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 size={15} />
                    <span>Tu cuenta de Mercado Pago está lista para recibir pagos</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Las compras en tu tienda se procesarán directamente a través de tu cuenta de Mercado Pago de forma automática y segura.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold shrink-0 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw size={13} className={testingConnection ? "animate-spin" : ""} />
                  <span>{testingConnection ? "Comprobando..." : "Comprobar estado"}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                  <HelpCircle size={15} className="text-amber-400" />
                  <span>Configuración de Mercado Pago en el servidor</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Para procesar cobros reales con Mercado Pago, configurá la credencial <code className="text-amber-300 font-mono text-[11px] bg-zinc-950 px-1 py-0.5 rounded">MP_ACCESS_TOKEN</code> en el servidor. Podés prender o apagar este medio de cobro en tu tienda cuando lo desees con el switch superior.
                </p>
              </div>
            )}

            {/* Mensaje de comprobación amigable */}
            {diagnostic && (
              <div
                role="status"
                aria-live="polite"
                className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                  diagnostic.ok
                    ? "bg-emerald-950/40 border border-emerald-800 text-emerald-300"
                    : "bg-rose-950/40 border border-rose-800 text-rose-300"
                }`}
              >
                {diagnostic.ok ? (
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle size={15} className="shrink-0 text-rose-400" />
                )}
                <span>
                  {diagnostic.ok
                    ? `Conexión verificada con éxito ${diagnostic.nickname ? `(${diagnostic.nickname})` : ""}.`
                    : diagnostic.error || "No se pudo verificar la conexión."}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. EFECTIVO AL RETIRAR O RECIBIR */}
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
                  En el showroom
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Abono físico al momento de retirar en el local o recibir tu pedido.
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

      {/* 4. COORDINAR POR WHATSAPP */}
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

      {/* 5. OTRAS PASARELAS DISPONIBLES (PAYWAY, GETNET, MODO, GOOGLE PAY) */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Otras Pasarelas y Billeteras Digitales
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Podés sumar procesadoras bancarias adicionales para ofrecer cuotas sin interés y billeteras digitales.
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleSection("otherGateways")}
            aria-expanded={openSections.otherGateways}
            className="p-2 rounded-xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 transition-colors cursor-pointer"
          >
            {openSections.otherGateways ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {openSections.otherGateways && (
          <div className="p-5 border-t border-zinc-800/60 space-y-3 bg-zinc-950/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Payway */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={15} className="text-orange-400" />
                    <span className="text-xs font-bold text-zinc-200">Payway (Prisma)</span>
                  </div>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                    Requiere activación técnica
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Adquirencia bancaria para Visa, Mastercard y Cabal con soporte del programa Cuota Simple.
                </p>
              </div>

              {/* Getnet */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={15} className="text-rose-400" />
                    <span className="text-xs font-bold text-zinc-200">Getnet (Santander)</span>
                  </div>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                    Requiere activación técnica
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Acreditación directa en cuenta bancaria Santander con aranceles preferenciales.
                </p>
              </div>

              {/* MODO */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode size={15} className="text-emerald-400" />
                    <span className="text-xs font-bold text-zinc-200">MODO (App & QR)</span>
                  </div>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                    Requiere activación técnica
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  QR bancario interoperable con reintegros para clientes de más de 35 bancos argentinos.
                </p>
              </div>

              {/* Google Pay */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet size={15} className="text-indigo-400" />
                    <span className="text-xs font-bold text-zinc-200">Google Pay</span>
                  </div>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                    Requiere activación técnica
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Pago seguro en 1 clic con biometría desde el navegador Chrome o teléfonos Android.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 pt-1">
              * Para sumar cualquiera de estas pasarelas a tu checkout, contactá a tu equipo de desarrollo para conectar la cuenta en el servidor de forma segura.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
