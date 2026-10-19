"use client";

import {
  Building2,
  CreditCard,
  Banknote,
  MessageCircle,
  ShieldCheck,
  Percent,
  Info,
} from "lucide-react";

interface PaymentsSettingsSectionProps {
  mercadopagoEnabled: boolean;
  onMercadopagoEnabledChange: (val: boolean) => void;
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
  cashEnabled: boolean;
  onCashEnabledChange: (val: boolean) => void;
  cashNotes: string;
  onCashNotesChange: (val: string) => void;
  whatsappPaymentEnabled: boolean;
  onWhatsappPaymentEnabledChange: (val: boolean) => void;
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
  return (
    <div
      id="settings-panel-payments"
      role="tabpanel"
      aria-labelledby="settings-tab-payments"
      className="space-y-5"
    >
      {/* 1. TRANSFERENCIA BANCARIA (BR-47) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Transferencia Bancaria
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  Recomendado
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Mostrá tus datos de CBU/CVU o Alias al cliente con cálculo automático de descuento.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={transferEnabled}
              onChange={(e) => onTransferEnabledChange(e.target.checked)}
              className="h-4 w-4 rounded accent-amber-400"
            />
            <span className="text-xs font-semibold text-zinc-200">Habilitar en Checkout</span>
          </label>
        </div>

        {transferEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="transferDiscountInput" className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Percent size={14} className="text-amber-300" />
                Descuento automático por pago por transferencia (% OFF)
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                />
                <span className="text-xs font-bold text-zinc-400">%</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Se descuenta automáticamente en el checkout al elegir este método (ej. 10% OFF).
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="transferBankNameInput" className="text-xs font-medium text-zinc-300">
                Banco / Entidad
              </label>
              <input
                id="transferBankNameInput"
                type="text"
                placeholder="Ej. Santander / Mercado Pago / Galicia"
                value={transferBankName}
                onChange={(e) => onTransferBankNameChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="transferAccountHolderInput" className="text-xs font-medium text-zinc-300">
                Titular de la cuenta
              </label>
              <input
                id="transferAccountHolderInput"
                type="text"
                placeholder="Ej. Aura Studio SRL"
                value={transferAccountHolder}
                onChange={(e) => onTransferAccountHolderChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="transferAliasInput" className="text-xs font-medium text-zinc-300">
                Alias
              </label>
              <input
                id="transferAliasInput"
                type="text"
                placeholder="Ej. AURA.STUDIO.PAGO"
                value={transferAlias}
                onChange={(e) => onTransferAliasChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>

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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>

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
                onChange={(e) => onTransferCbuChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. MERCADO PAGO GATEWAY (INSTANCIA DEDICADA) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Mercado Pago
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-950 text-sky-400 border border-sky-800/60 px-2 py-0.5 rounded-full">
                  Checkout Pro
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Permite a tus clientes pagar con tarjetas de crédito, débito y dinero en cuenta.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={mercadopagoEnabled}
              onChange={(e) => onMercadopagoEnabledChange(e.target.checked)}
              className="h-4 w-4 rounded accent-sky-400"
            />
            <span className="text-xs font-semibold text-zinc-200">Habilitar en Checkout</span>
          </label>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <ShieldCheck size={16} className="text-sky-400" />
            <span>Seguridad de Credenciales — Instancia Dedicada Cloudflare</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Por arquitectura de seguridad de Comercio Dedicado, las credenciales privadas (
            <code className="text-amber-300 font-mono text-[11px]">MP_ACCESS_TOKEN</code>,{" "}
            <code className="text-amber-300 font-mono text-[11px]">MP_PUBLIC_KEY</code> y{" "}
            <code className="text-amber-300 font-mono text-[11px]">MP_WEBHOOK_SECRET</code>) se
            almacenan en las Variables de Entorno Encriptadas de Cloudflare Workers/Pages (via{" "}
            <code className="text-zinc-300 font-mono text-[11px]">wrangler secret put</code>) y nunca
            quedan expuestas en la base de datos ni en el frontend.
          </p>
          <div className="pt-1 flex items-center gap-2 text-[11px] text-zinc-500">
            <Info size={13} className="text-zinc-400 shrink-0" />
            <span>
              URL del Webhook de cobro:{" "}
              <code className="text-zinc-300 font-mono">/api/payments/webhook/mercadopago</code>
            </span>
          </div>
        </div>
      </div>

      {/* 3. EFECTIVO / RETIRO EN SHOWROOM */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Banknote size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Pago en Efectivo</h2>
              <p className="text-xs text-zinc-400">
                Permitir pago al momento de retirar en el showroom o contra entrega.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={cashEnabled}
              onChange={(e) => onCashEnabledChange(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-400"
            />
            <span className="text-xs font-semibold text-zinc-200">Habilitar en Checkout</span>
          </label>
        </div>

        {cashEnabled && (
          <div className="space-y-1">
            <label htmlFor="cashNotesInput" className="text-xs font-medium text-zinc-300">
              Instrucciones / Notas para el cliente
            </label>
            <input
              id="cashNotesInput"
              type="text"
              placeholder="Ej. Pago exacto al retirar en showroom dentro de las 48hs."
              value={cashNotes}
              onChange={(e) => onCashNotesChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-400"
            />
          </div>
        )}
      </div>

      {/* 4. COORDINACIÓN POR WHATSAPP */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
              <MessageCircle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Coordinar por WhatsApp</h2>
              <p className="text-xs text-zinc-400">
                Opción de asistencia humana para coordinar el medio de pago directamente por chat.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={whatsappPaymentEnabled}
              onChange={(e) => onWhatsappPaymentEnabledChange(e.target.checked)}
              className="h-4 w-4 rounded accent-green-400"
            />
            <span className="text-xs font-semibold text-zinc-200">Habilitar en Checkout</span>
          </label>
        </div>
      </div>
    </div>
  );
}
