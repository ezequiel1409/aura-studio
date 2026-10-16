"use client";

import { MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "../../icons/SocialIcons";

interface FooterSettingsSectionProps {
  whatsappNumber: string;
  instagramHandle: string;
  tiktokHandle: string;
  address: string;
  dataFiscalUrl: string;
  onWhatsappNumberChange: (val: string) => void;
  onInstagramHandleChange: (val: string) => void;
  onTiktokHandleChange: (val: string) => void;
  onAddressChange: (val: string) => void;
  onDataFiscalUrlChange: (val: string) => void;
}

export function FooterSettingsSection({
  whatsappNumber,
  instagramHandle,
  tiktokHandle,
  address,
  dataFiscalUrl,
  onWhatsappNumberChange,
  onInstagramHandleChange,
  onTiktokHandleChange,
  onAddressChange,
  onDataFiscalUrlChange,
}: FooterSettingsSectionProps) {
  return (
    <div
      id="settings-panel-footer"
      role="tabpanel"
      aria-labelledby="settings-tab-footer"
      className="space-y-5"
    >
      {/* Bloque 1: WhatsApp Oficial de Atención y Pedidos */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Canal de Atención Directa y Pie de Página
        </h2>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <MessageCircle size={15} className="text-emerald-400" aria-hidden="true" />
            <label htmlFor="whatsappNumberInput" className="text-xs font-medium text-zinc-300">
              WhatsApp Oficial de Atención
            </label>
          </div>
          <input
            id="whatsappNumberInput"
            type="text"
            required
            value={whatsappNumber}
            onChange={(e) => onWhatsappNumberChange(e.target.value)}
            placeholder="+5491100000000"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
          />
          <p className="text-[11px] text-zinc-500">
            Número con código internacional (ej: +54911...). Se muestra en el pie de página y recibe
            los pedidos y consultas del catálogo.
          </p>
        </div>
      </div>

      {/* Bloque 2: Redes Sociales, Dirección y Legales */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Pie de Página: Redes Sociales, Ubicación y AFIP (Opcionales)
          </h2>
          <p className="text-[11px] text-zinc-400 mt-1">
            Los campos que completes se mostrarán elegantemente en el pie de página de la tienda
            pública.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <InstagramIcon size={14} className="text-[#E4405F]" />
              <label htmlFor="instagramInput" className="text-xs text-zinc-300">
                Instagram
              </label>
            </div>
            <input
              id="instagramInput"
              type="text"
              value={instagramHandle}
              onChange={(e) => onInstagramHandleChange(e.target.value)}
              placeholder="@aurastudio o URL"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <TikTokIcon size={14} className="text-zinc-400" />
              <label htmlFor="tiktokInput" className="text-xs text-zinc-300">
                TikTok (opcional)
              </label>
            </div>
            <input
              id="tiktokInput"
              type="text"
              value={tiktokHandle}
              onChange={(e) => onTiktokHandleChange(e.target.value)}
              placeholder="@aurastudio o URL"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-amber-400" aria-hidden="true" />
              <label htmlFor="addressInput" className="text-xs text-zinc-300">
                Dirección física del Showroom (opcional)
              </label>
            </div>
            <input
              id="addressInput"
              type="text"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="Ej: Honduras 4800, Palermo Soho, CABA"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-400" aria-hidden="true" />
              <label htmlFor="dataFiscalInput" className="text-xs text-zinc-300">
                Data Fiscal / AFIP Formulario 960 (opcional)
              </label>
            </div>
            <input
              id="dataFiscalInput"
              type="url"
              value={dataFiscalUrl}
              onChange={(e) => onDataFiscalUrlChange(e.target.value)}
              placeholder="https://serviciosweb.afip.gob.ar/clavefiscal/qr/default.aspx?..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
            />
            <p className="text-[11px] text-zinc-500">
              Si tu comercio cuenta con código QR o constancia de Data Fiscal de AFIP, ingresá el
              enlace para mostrar la insignia oficial en el pie de página.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

