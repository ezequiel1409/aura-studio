"use client";

import { Clock, MapPin, MessageCircle, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "../../icons/SocialIcons";
import {
  DAY_LABELS,
  DAY_ORDER,
  DEFAULT_STORE_LOCATION,
  DEFAULT_STORE_SCHEDULE,
  DayOfWeek,
  DaySchedule,
  StoreLocationConfig,
  StoreScheduleConfig,
} from "../../../lib/schedule/store-schedule";

interface FooterSettingsSectionProps {
  whatsappNumber: string;
  instagramHandle: string;
  tiktokHandle: string;
  address: string;
  dataFiscalUrl: string;
  storeLocation?: StoreLocationConfig;
  storeSchedule?: StoreScheduleConfig;
  onWhatsappNumberChange: (val: string) => void;
  onInstagramHandleChange: (val: string) => void;
  onTiktokHandleChange: (val: string) => void;
  onAddressChange: (val: string) => void;
  onDataFiscalUrlChange: (val: string) => void;
  onStoreLocationChange?: (val: StoreLocationConfig) => void;
  onStoreScheduleChange?: (val: StoreScheduleConfig) => void;
}

export function FooterSettingsSection({
  whatsappNumber,
  instagramHandle,
  tiktokHandle,
  address,
  dataFiscalUrl,
  storeLocation = DEFAULT_STORE_LOCATION,
  storeSchedule = DEFAULT_STORE_SCHEDULE,
  onWhatsappNumberChange,
  onInstagramHandleChange,
  onTiktokHandleChange,
  onAddressChange,
  onDataFiscalUrlChange,
  onStoreLocationChange,
  onStoreScheduleChange,
}: FooterSettingsSectionProps) {
  const handleUpdateDay = (
    target: "openingHours" | "pickupHours",
    day: DayOfWeek,
    updater: (prev: DaySchedule) => DaySchedule
  ) => {
    if (!onStoreScheduleChange) return;
    const list = storeSchedule[target] || DEFAULT_STORE_SCHEDULE.openingHours;
    const nextList = list.map((item) => (item.day === day ? updater(item) : item));
    onStoreScheduleChange({
      ...storeSchedule,
      [target]: nextList,
    });
  };

  const renderScheduleGrid = (target: "openingHours" | "pickupHours") => {
    const sourceList = storeSchedule[target] || DEFAULT_STORE_SCHEDULE.openingHours;
    return (
      <div className="space-y-2">
        {DAY_ORDER.map((dayKey) => {
          const item =
            sourceList.find((d) => d.day === dayKey) || {
              day: dayKey,
              isOpen: false,
              ranges: [{ open: "10:00", close: "19:00" }],
            };

          return (
            <div
              key={`${target}-${dayKey}`}
              className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/60 border border-zinc-800/80 rounded-xl px-3 py-2"
            >
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-200 min-w-[115px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isOpen}
                  onChange={(e) =>
                    handleUpdateDay(target, dayKey, (prev) => ({
                      ...prev,
                      isOpen: e.target.checked,
                      ranges:
                        prev.ranges.length > 0
                          ? prev.ranges
                          : [{ open: "10:00", close: "19:00" }],
                    }))
                  }
                  className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
                />
                <span>{DAY_LABELS[dayKey]}</span>
              </label>

              {!item.isOpen ? (
                <span className="text-[11px] text-zinc-500 italic">Cerrado</span>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {item.ranges.map((r, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-1.5 text-xs">
                      <input
                        type="time"
                        value={r.open}
                        aria-label={`${DAY_LABELS[dayKey]} apertura ${rIdx + 1}`}
                        onChange={(e) =>
                          handleUpdateDay(target, dayKey, (prev) => {
                            const nextRanges = [...prev.ranges];
                            nextRanges[rIdx] = { ...r, open: e.target.value };
                            return { ...prev, ranges: nextRanges };
                          })
                        }
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono text-zinc-100"
                      />
                      <span className="text-zinc-500">a</span>
                      <input
                        type="time"
                        value={r.close}
                        aria-label={`${DAY_LABELS[dayKey]} cierre ${rIdx + 1}`}
                        onChange={(e) =>
                          handleUpdateDay(target, dayKey, (prev) => {
                            const nextRanges = [...prev.ranges];
                            nextRanges[rIdx] = { ...r, close: e.target.value };
                            return { ...prev, ranges: nextRanges };
                          })
                        }
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono text-zinc-100"
                      />
                      {item.ranges.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateDay(target, dayKey, (prev) => ({
                              ...prev,
                              ranges: prev.ranges.filter((_, idx) => idx !== rIdx),
                            }))
                          }
                          aria-label={`Quitar segunda franja de ${DAY_LABELS[dayKey]}`}
                          className="p-1 text-zinc-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {item.ranges.length < 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateDay(target, dayKey, (prev) => ({
                          ...prev,
                          ranges: [...prev.ranges, { open: "16:00", close: "20:00" }],
                        }))
                      }
                      className="text-[11px] font-semibold text-amber-300 hover:underline px-1.5 py-0.5 cursor-pointer"
                    >
                      + 2da franja
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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

      {/* Bloque 2: Ubicación y Mapa del Local (Etapa 1 sin API de Google) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-amber-400" aria-hidden="true" />
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Ubicación del Local y Enlace a Google Maps
              </h2>
              <p className="text-[11px] text-zinc-400">
                Si sólo vendés online, desactivá la opción para ocultar dirección, mapa y horarios del footer.
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-200 cursor-pointer">
            <input
              type="checkbox"
              checked={storeLocation.attendsPublic}
              onChange={(e) =>
                onStoreLocationChange?.({
                  ...storeLocation,
                  attendsPublic: e.target.checked,
                })
              }
              className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
            />
            <span>¿Atiende al público?</span>
          </label>
        </div>

        {storeLocation.attendsPublic && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="addressInput" className="text-xs text-zinc-300">
                Calle y número (Dirección del local)
              </label>
              <input
                id="addressInput"
                type="text"
                value={storeLocation.streetAddress || address}
                onChange={(e) => {
                  const val = e.target.value;
                  onAddressChange(val);
                  onStoreLocationChange?.({
                    ...storeLocation,
                    streetAddress: val,
                  });
                }}
                placeholder="Ej: Gurruchaga 1680, Palermo Soho"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="localityInput" className="text-xs text-zinc-300">
                Localidad / Barrio
              </label>
              <input
                id="localityInput"
                type="text"
                value={storeLocation.locality}
                onChange={(e) =>
                  onStoreLocationChange?.({ ...storeLocation, locality: e.target.value })
                }
                placeholder="Palermo Soho"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label htmlFor="provinceInput" className="text-xs text-zinc-300">
                  Provincia
                </label>
                <input
                  id="provinceInput"
                  type="text"
                  value={storeLocation.province}
                  onChange={(e) =>
                    onStoreLocationChange?.({ ...storeLocation, province: e.target.value })
                  }
                  placeholder="CABA"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="postalCodeStoreInput" className="text-xs text-zinc-300">
                  Código Postal
                </label>
                <input
                  id="postalCodeStoreInput"
                  type="text"
                  value={storeLocation.postalCode}
                  onChange={(e) =>
                    onStoreLocationChange?.({ ...storeLocation, postalCode: e.target.value })
                  }
                  placeholder="C1414"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="googleMapsUrlInput" className="text-xs text-zinc-300">
                Enlace a Google Maps (opcional — si se deja vacío se arma automáticamente)
              </label>
              <input
                id="googleMapsUrlInput"
                type="url"
                value={storeLocation.googleMapsUrl || ""}
                onChange={(e) =>
                  onStoreLocationChange?.({
                    ...storeLocation,
                    googleMapsUrl: e.target.value || null,
                  })
                }
                placeholder="https://maps.google.com/..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bloque 3: Horarios de Atención y Retiro */}
      {storeLocation.attendsPublic && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-400" aria-hidden="true" />
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Horarios de Atención y de Retiro
              </h2>
              <p className="text-[11px] text-zinc-400">
                Calcula en vivo si el local está &ldquo;Abierto ahora&rdquo; o &ldquo;Cerrado&rdquo; y resalta el día actual.
              </p>
            </div>
          </div>

          {renderScheduleGrid("openingHours")}

          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={storeSchedule.separatePickupHours}
                onChange={(e) =>
                  onStoreScheduleChange?.({
                    ...storeSchedule,
                    separatePickupHours: e.target.checked,
                  })
                }
                className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
              />
              <span>¿El horario de retiro de compras online es distinto al de atención?</span>
            </label>

            {storeSchedule.separatePickupHours && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-amber-300">
                  Grilla de Horarios de Retiro en el Local:
                </p>
                {renderScheduleGrid("pickupHours")}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="space-y-1">
              <label htmlFor="scheduleNoteInput" className="text-xs text-zinc-300">
                Nota aclaratoria (ej: &ldquo;Con cita previa los sábados&rdquo;)
              </label>
              <input
                id="scheduleNoteInput"
                type="text"
                value={storeSchedule.note || ""}
                onChange={(e) =>
                  onStoreScheduleChange?.({
                    ...storeSchedule,
                    note: e.target.value || null,
                  })
                }
                placeholder="Sábados atención personalizada y retiros inmediatos."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Excepciones / Feriados */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">
                  Excepciones por fecha o feriados (opcional):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextExceptions = [
                      ...(storeSchedule.exceptions || []),
                      {
                        date: new Date().toISOString().slice(0, 10),
                        label: "Cerrado por feriado",
                        isOpen: false,
                      },
                    ];
                    onStoreScheduleChange?.({
                      ...storeSchedule,
                      exceptions: nextExceptions,
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:underline cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Agregar fecha especial</span>
                </button>
              </div>

              {(storeSchedule.exceptions || []).map((exc, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2 bg-zinc-950/60 border border-zinc-800 rounded-xl p-2.5 text-xs"
                >
                  <input
                    type="date"
                    value={exc.date}
                    onChange={(e) => {
                      const next = [...(storeSchedule.exceptions || [])];
                      next[idx] = { ...exc, date: e.target.value };
                      onStoreScheduleChange?.({ ...storeSchedule, exceptions: next });
                    }}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-100"
                  />
                  <input
                    type="text"
                    value={exc.label}
                    onChange={(e) => {
                      const next = [...(storeSchedule.exceptions || [])];
                      next[idx] = { ...exc, label: e.target.value };
                      onStoreScheduleChange?.({ ...storeSchedule, exceptions: next });
                    }}
                    placeholder="Ej: Cerrado por feriado"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (storeSchedule.exceptions || []).filter((_, i) => i !== idx);
                      onStoreScheduleChange?.({ ...storeSchedule, exceptions: next });
                    }}
                    className="p-1 text-zinc-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bloque 4: Redes Sociales y Legales */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Redes Sociales y Legales AFIP (Opcionales)
          </h2>
          <p className="text-[11px] text-zinc-400 mt-1">
            Los campos que completes se mostrarán en el pie de página de la tienda pública.
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
