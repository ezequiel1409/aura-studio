"use client";

import { useState } from "react";
import {
  AlertCircle,
  Bike,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  Save,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import {
  DEFAULT_SHIPPING_HOME_ZONES,
  DEFAULT_SHIPPING_MOTO_ZONES,
  DEFAULT_STORE_LOCATION,
  ShippingZoneConfig,
  StoreLocationConfig,
} from "../../../lib/schedule/store-schedule";
import { ShowroomSettings } from "../../../services/settings.service";

interface ShippingSettingsClientProps {
  initialSettings: ShowroomSettings;
}

export function ShippingSettingsClient({ initialSettings }: ShippingSettingsClientProps) {
  const [storeLocation, setStoreLocation] = useState<StoreLocationConfig>(() => {
    const loc = initialSettings.storeLocation || DEFAULT_STORE_LOCATION;
    return {
      ...DEFAULT_STORE_LOCATION,
      ...loc,
      homeDeliveryZones:
        loc.homeDeliveryZones && loc.homeDeliveryZones.length > 0
          ? loc.homeDeliveryZones
          : DEFAULT_SHIPPING_HOME_ZONES,
      motorcycleZones:
        loc.motorcycleZones && loc.motorcycleZones.length > 0
          ? loc.motorcycleZones
          : DEFAULT_SHIPPING_MOTO_ZONES,
    };
  });

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
          storeLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al guardar la configuración de envíos.");
      }

      setFeedback({
        type: "ok",
        text: "Configuración de envíos y métodos de entrega actualizada con éxito.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al guardar.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  // Helper para agregar zona a homeDelivery
  const handleAddHomeZone = () => {
    const newZone: ShippingZoneConfig = {
      id: `home_zone_${Date.now()}`,
      name: "Nueva Región / Zona",
      costCents: 450000,
      estimatedDelivery: "3 a 5 días hábiles",
      enabled: true,
    };
    setStoreLocation((prev) => ({
      ...prev,
      homeDeliveryZones: [...(prev.homeDeliveryZones || []), newZone],
    }));
  };

  const handleUpdateHomeZone = (index: number, patch: Partial<ShippingZoneConfig>) => {
    setStoreLocation((prev) => {
      const updated = [...(prev.homeDeliveryZones || [])];
      updated[index] = { ...updated[index], ...patch };
      return { ...prev, homeDeliveryZones: updated };
    });
  };

  const handleDeleteHomeZone = (index: number) => {
    setStoreLocation((prev) => {
      const updated = (prev.homeDeliveryZones || []).filter((_, i) => i !== index);
      return { ...prev, homeDeliveryZones: updated };
    });
  };

  // Helper para agregar zona a motorcycleDelivery
  const handleAddMotoZone = () => {
    const newZone: ShippingZoneConfig = {
      id: `moto_zone_${Date.now()}`,
      name: "Nueva Zona de Moto",
      costCents: 350000,
      estimatedDelivery: "En el día",
      enabled: true,
    };
    setStoreLocation((prev) => ({
      ...prev,
      motorcycleZones: [...(prev.motorcycleZones || []), newZone],
    }));
  };

  const handleUpdateMotoZone = (index: number, patch: Partial<ShippingZoneConfig>) => {
    setStoreLocation((prev) => {
      const updated = [...(prev.motorcycleZones || [])];
      updated[index] = { ...updated[index], ...patch };
      return { ...prev, motorcycleZones: updated };
    });
  };

  const handleDeleteMotoZone = (index: number) => {
    setStoreLocation((prev) => {
      const updated = (prev.motorcycleZones || []).filter((_, i) => i !== index);
      return { ...prev, motorcycleZones: updated };
    });
  };

  const isPickupActive = storeLocation.pickupEnabled !== false;
  const isHomeActive = Boolean(storeLocation.homeDeliveryEnabled);
  const isMotoActive = Boolean(storeLocation.motorcycleDeliveryEnabled);

  const hasStoreAddress = Boolean(storeLocation.streetAddress && storeLocation.streetAddress.trim().length > 0);
  const isHomeDeliveryConfigured = hasStoreAddress && (storeLocation.homeDeliveryZones?.length ?? 0) > 0;
  const isMotoDeliveryConfigured = hasStoreAddress && (storeLocation.motorcycleZones?.length ?? 0) > 0;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <Truck className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100">
              Envíos y Métodos de Entrega
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Activá y configurá las opciones de entrega que verán los compradores en el checkout, sus costos y zonas de cobertura.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-sm"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Guardar cambios</span>
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
            feedback.type === "ok"
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              : "bg-rose-950/40 border-rose-800/60 text-rose-300"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* MÉTODO 1: Retiro en Showroom / Sucursal */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-800/80 text-amber-400">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-100">
                  Retiro en Sucursal / Showroom
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                  Gratis
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                El comprador retira su pedido en el local físico.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPickupActive}
              onChange={(e) =>
                setStoreLocation((prev) => ({
                  ...prev,
                  pickupEnabled: e.target.checked,
                }))
              }
              className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 h-4 w-4 accent-amber-400"
            />
            <span className="ml-2 text-xs font-semibold text-zinc-200">
              {isPickupActive ? "Habilitado" : "Deshabilitado"}
            </span>
          </label>
        </div>

        {isPickupActive && (
          <div className="space-y-4 pt-1 animate-in fade-in-50">
            {/* Visibilidad de la Dirección */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Visibilidad de la Dirección en el Checkout:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    (storeLocation.pickupAddressVisibility || "PUBLIC") === "PUBLIC"
                      ? "bg-amber-400/10 border-amber-400/50 text-zinc-100"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="pickupAddressVisibility"
                    value="PUBLIC"
                    checked={(storeLocation.pickupAddressVisibility || "PUBLIC") === "PUBLIC"}
                    onChange={() =>
                      setStoreLocation((prev) => ({
                        ...prev,
                        pickupAddressVisibility: "PUBLIC",
                      }))
                    }
                    className="mt-0.5 accent-amber-400"
                  />
                  <div>
                    <span className="font-semibold block text-zinc-200">Publicar dirección exacta</span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5 leading-relaxed">
                      Muestra calle, localidad y botón "Cómo llegar" de Google Maps en la confirmación.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    storeLocation.pickupAddressVisibility === "COORDINATE_WHATSAPP"
                      ? "bg-amber-400/10 border-amber-400/50 text-zinc-100"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="pickupAddressVisibility"
                    value="COORDINATE_WHATSAPP"
                    checked={storeLocation.pickupAddressVisibility === "COORDINATE_WHATSAPP"}
                    onChange={() =>
                      setStoreLocation((prev) => ({
                        ...prev,
                        pickupAddressVisibility: "COORDINATE_WHATSAPP",
                      }))
                    }
                    className="mt-0.5 accent-amber-400"
                  />
                  <div>
                    <span className="font-semibold block text-zinc-200">Coordinar por WhatsApp</span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5 leading-relaxed">
                      Showroom privado / cita previa. Oculta la calle exacta hasta coordinar con el comprador.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Dirección configurada actualmente */}
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  Ubicación actual:{" "}
                  <strong className="text-zinc-100">
                    {[storeLocation.streetAddress, storeLocation.locality, storeLocation.province]
                      .filter(Boolean)
                      .join(", ") || "No configurada"}
                  </strong>
                </span>
              </div>
              <a
                href="/admin/tienda/contacto"
                className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Editar dirección en Contacto</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* MÉTODO 2: Envío a Domicilio por Correo */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-800/80 text-sky-400">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">
                  Envío a Domicilio por Correo (Nacional / Regional)
                </h2>
                {isHomeDeliveryConfigured ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                    Configurado
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/50 border border-amber-800/50 px-2 py-0.5 rounded-full">
                    Requiere configuración técnica
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Despacho por Correo Argentino, Andreani, OCA u otro operador logístico.
              </p>
            </div>
          </div>

          <label className={`relative inline-flex items-center ${!isHomeDeliveryConfigured ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              disabled={!isHomeDeliveryConfigured}
              checked={isHomeActive && isHomeDeliveryConfigured}
              onChange={(e) =>
                setStoreLocation((prev) => ({
                  ...prev,
                  homeDeliveryEnabled: e.target.checked,
                }))
              }
              className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 h-4 w-4 accent-amber-400 disabled:cursor-not-allowed"
            />
            <span className="ml-2 text-xs font-semibold text-zinc-200">
              {isHomeActive && isHomeDeliveryConfigured ? "Habilitado" : "Deshabilitado"}
            </span>
          </label>
        </div>

        {!isHomeDeliveryConfigured && (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300 flex items-center gap-2.5">
            <Info size={16} className="shrink-0 text-amber-400" />
            <span>
              Para activar este método en la tienda, asegurate de tener definida la dirección del local y al menos una zona de entrega con costo.
            </span>
          </div>
        )}

        {(isHomeActive || !isHomeDeliveryConfigured) && (
          <div className="space-y-4 pt-1 animate-in fade-in-50">
            {/* Parámetros Generales de Correo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Costo base general (ARS):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-zinc-500 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={Math.round((storeLocation.homeDeliveryCostCents ?? 450000) / 100)}
                    onChange={(e) =>
                      setStoreLocation((prev) => ({
                        ...prev,
                        homeDeliveryCostCents: Math.round(Number(e.target.value || 0) * 100),
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Plazo estimado de entrega:
                </label>
                <input
                  type="text"
                  placeholder="ej: 3 a 5 días hábiles"
                  value={storeLocation.homeDeliveryEstimatedDays || "3 a 5 días hábiles"}
                  onChange={(e) =>
                    setStoreLocation((prev) => ({
                      ...prev,
                      homeDeliveryEstimatedDays: e.target.value,
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Envío gratis a partir de (ARS):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-zinc-500 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Sin límite de envío gratis"
                    value={
                      storeLocation.homeDeliveryFreeThresholdCents
                        ? Math.round(storeLocation.homeDeliveryFreeThresholdCents / 100)
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value ? Math.round(Number(e.target.value) * 100) : null;
                      setStoreLocation((prev) => ({
                        ...prev,
                        homeDeliveryFreeThresholdCents: val,
                      }));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-400 focus:outline-none placeholder-zinc-600"
                  />
                </div>
              </div>
            </div>

            {/* Secciones / Zonas de Cobertura por Correo */}
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Zonas y Regiones de Cobertura por Correo:
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Habilitá qué regiones ofrecés y personalizá el costo de envío según la distancia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddHomeZone}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-xs text-zinc-200 font-semibold cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-amber-400" />
                  <span>Agregar Zona</span>
                </button>
              </div>

              <div className="space-y-2">
                {(storeLocation.homeDeliveryZones || []).map((zone, idx) => (
                  <div
                    key={zone.id || idx}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={zone.enabled}
                        onChange={(e) =>
                          handleUpdateHomeZone(idx, { enabled: e.target.checked })
                        }
                        className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 h-4 w-4 accent-amber-400 shrink-0"
                      />
                      <input
                        type="text"
                        value={zone.name}
                        onChange={(e) => handleUpdateHomeZone(idx, { name: e.target.value })}
                        className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-medium flex-1 focus:outline-none focus:border-amber-400"
                        placeholder="Nombre de la zona"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-xs text-zinc-500 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={Math.round(zone.costCents / 100)}
                          onChange={(e) =>
                            handleUpdateHomeZone(idx, {
                              costCents: Math.round(Number(e.target.value || 0) * 100),
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-6 pr-2 py-1 text-xs text-zinc-100 font-mono text-right focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <input
                        type="text"
                        value={zone.estimatedDelivery || ""}
                        onChange={(e) =>
                          handleUpdateHomeZone(idx, { estimatedDelivery: e.target.value })
                        }
                        placeholder="Plazo estimado"
                        className="w-32 bg-zinc-900 border border-zinc-700/80 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                      />

                      <button
                        type="button"
                        onClick={() => handleDeleteHomeZone(idx)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Eliminar zona"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MÉTODO 3: Moto Mensajería Express */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-800/80 text-emerald-400">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-100">
                  Moto Mensajería Express (Entrega en el día / CABA y AMBA)
                </h2>
                {isMotoDeliveryConfigured ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                    Configurado
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/50 border border-amber-800/50 px-2 py-0.5 rounded-full">
                    Requiere configuración técnica
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cadetería rápida en moto para entregas urgentes o del mismo día.
              </p>
            </div>
          </div>

          <label className={`relative inline-flex items-center ${!isMotoDeliveryConfigured ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              disabled={!isMotoDeliveryConfigured}
              checked={isMotoActive && isMotoDeliveryConfigured}
              onChange={(e) =>
                setStoreLocation((prev) => ({
                  ...prev,
                  motorcycleDeliveryEnabled: e.target.checked,
                }))
              }
              className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 h-4 w-4 accent-amber-400 disabled:cursor-not-allowed"
            />
            <span className="ml-2 text-xs font-semibold text-zinc-200">
              {isMotoActive && isMotoDeliveryConfigured ? "Habilitado" : "Deshabilitado"}
            </span>
          </label>
        </div>

        {!isMotoDeliveryConfigured && (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300 flex items-center gap-2.5">
            <Info size={16} className="shrink-0 text-amber-400" />
            <span>
              Para activar moto mensajería en la tienda, asegurate de tener definida la dirección del local y al menos una zona de moto con costo.
            </span>
          </div>
        )}

        {(isMotoActive || !isMotoDeliveryConfigured) && (
          <div className="space-y-4 pt-1 animate-in fade-in-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Costo base de moto (ARS):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-zinc-500 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={Math.round((storeLocation.motorcycleDeliveryCostCents ?? 350000) / 100)}
                    onChange={(e) =>
                      setStoreLocation((prev) => ({
                        ...prev,
                        motorcycleDeliveryCostCents: Math.round(Number(e.target.value || 0) * 100),
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Plazo de entrega de mensajería:
                </label>
                <input
                  type="text"
                  placeholder="ej: En el día (compras antes de las 14:00)"
                  value={storeLocation.motorcycleDeliveryEstimatedDays || "En el día"}
                  onChange={(e) =>
                    setStoreLocation((prev) => ({
                      ...prev,
                      motorcycleDeliveryEstimatedDays: e.target.value,
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Zonas de Moto */}
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Zonas de Cobertura de Moto Express:
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Habilitá a qué localidades o zonas enviás en moto y establecé la tarifa para cada una.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMotoZone}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-xs text-zinc-200 font-semibold cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-amber-400" />
                  <span>Agregar Zona de Moto</span>
                </button>
              </div>

              <div className="space-y-2">
                {(storeLocation.motorcycleZones || []).map((zone, idx) => (
                  <div
                    key={zone.id || idx}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={zone.enabled}
                        onChange={(e) =>
                          handleUpdateMotoZone(idx, { enabled: e.target.checked })
                        }
                        className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 h-4 w-4 accent-amber-400 shrink-0"
                      />
                      <input
                        type="text"
                        value={zone.name}
                        onChange={(e) => handleUpdateMotoZone(idx, { name: e.target.value })}
                        className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-medium flex-1 focus:outline-none focus:border-amber-400"
                        placeholder="Nombre de la zona de moto"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-xs text-zinc-500 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={Math.round(zone.costCents / 100)}
                          onChange={(e) =>
                            handleUpdateMotoZone(idx, {
                              costCents: Math.round(Number(e.target.value || 0) * 100),
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-6 pr-2 py-1 text-xs text-zinc-100 font-mono text-right focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <input
                        type="text"
                        value={zone.estimatedDelivery || ""}
                        onChange={(e) =>
                          handleUpdateMotoZone(idx, { estimatedDelivery: e.target.value })
                        }
                        placeholder="Plazo estimado"
                        className="w-32 bg-zinc-900 border border-zinc-700/80 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                      />

                      <button
                        type="button"
                        onClick={() => handleDeleteMotoZone(idx)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Eliminar zona"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón flotante o inferior para guardar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Guardar configuración de envíos</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
