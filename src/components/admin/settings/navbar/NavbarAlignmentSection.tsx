"use client";

import { Menu, Palette } from "lucide-react";
import {
  NavbarAlignment,
  NavbarItemConfig,
} from "../../../../services/settings.service";
import { ALIGNMENT_OPTIONS } from "./navbar-settings.utils";

interface NavbarAlignmentSectionProps {
  isEnabled: boolean;
  alignment: NavbarAlignment;
  onAlignmentChange: (newAlignment: NavbarAlignment) => void;
  secondRowBgColor?: string | null;
  secondRowTextColor?: string | null;
  onSecondRowColorsChange: (bg: string | null, text: string | null) => void;
  items: NavbarItemConfig[];
}

export function NavbarAlignmentSection({
  isEnabled,
  alignment,
  onAlignmentChange,
  secondRowBgColor,
  secondRowTextColor,
  onSecondRowColorsChange,
  items,
}: NavbarAlignmentSectionProps) {
  return (
    <div
      className={`p-5 rounded-2xl border space-y-4 transition-all duration-200 ${
        !isEnabled
          ? "opacity-45 grayscale pointer-events-none select-none bg-zinc-950/40 border-zinc-800/60"
          : "bg-zinc-900/80 border-zinc-800"
      }`}
      aria-disabled={!isEnabled}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <Menu size={14} className="text-amber-300" aria-hidden="true" />
            <span>Posicionamiento y Alineación en la Cabecera</span>
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Definí dónde se ubican los enlaces en relación al logotipo y el buscador.
          </p>
        </div>
        {!isEnabled && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0 self-start sm:self-auto">
            Pausado (Navbar apagada)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ALIGNMENT_OPTIONS.map((opt) => {
          const isSelected = alignment === opt.id;
          const IconComponent = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={!isEnabled}
              onClick={() => onAlignmentChange(opt.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                !isEnabled
                  ? "cursor-not-allowed border-zinc-800 bg-zinc-950/40"
                  : isSelected
                  ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400 cursor-pointer"
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 cursor-pointer"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <IconComponent
                    size={18}
                    className={isSelected ? "text-amber-300" : "text-zinc-400"}
                    aria-hidden="true"
                  />
                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
                      Activo
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-zinc-100 mb-1">
                  {opt.label}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Personalización de colores para Segunda Fila Dedicada */}
      {isEnabled && alignment === "second_row" && (
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-400/30 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Palette size={15} className="text-amber-300" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Colores de la Segunda Fila Dedicada
            </h4>
          </div>
          <p className="text-[11px] text-zinc-400">
            Personalizá el color de fondo y el color de los enlaces de esta barra horizontal para que contraste armónicamente con tu marca.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Color de fondo */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-300">
                Color de fondo de la barra
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondRowBgColor || "#ffffff"}
                  onChange={(e) =>
                    onSecondRowColorsChange(e.target.value, secondRowTextColor || null)
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                  title="Elegir color de fondo"
                />
                <input
                  type="text"
                  value={secondRowBgColor || ""}
                  placeholder="#ffffff (por defecto)"
                  onChange={(e) =>
                    onSecondRowColorsChange(e.target.value.trim() || null, secondRowTextColor || null)
                  }
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none"
                />
                {secondRowBgColor && (
                  <button
                    type="button"
                    onClick={() => onSecondRowColorsChange(null, secondRowTextColor || null)}
                    className="px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    title="Restablecer color predeterminado"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Color de texto / enlaces */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-300">
                Color de texto y enlaces
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondRowTextColor || "#1c1917"}
                  onChange={(e) =>
                    onSecondRowColorsChange(secondRowBgColor || null, e.target.value)
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                  title="Elegir color de texto"
                />
                <input
                  type="text"
                  value={secondRowTextColor || ""}
                  placeholder="#1c1917 (por defecto)"
                  onChange={(e) =>
                    onSecondRowColorsChange(secondRowBgColor || null, e.target.value.trim() || null)
                  }
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none"
                />
                {secondRowTextColor && (
                  <button
                    type="button"
                    onClick={() => onSecondRowColorsChange(secondRowBgColor || null, null)}
                    className="px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    title="Restablecer color predeterminado"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Presets rápidos */}
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Combinaciones rápidas:</span>
            <button
              type="button"
              onClick={() => onSecondRowColorsChange("#ffffff", "#1c1917")}
              className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] text-zinc-200 transition-colors cursor-pointer"
            >
              Blanco y Carbón
            </button>
            <button
              type="button"
              onClick={() => onSecondRowColorsChange("#18181b", "#ffffff")}
              className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] text-zinc-200 transition-colors cursor-pointer"
            >
              Ébano Oscuro
            </button>
            <button
              type="button"
              onClick={() => onSecondRowColorsChange("#f5f0eb", "#451a03")}
              className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] text-zinc-200 transition-colors cursor-pointer"
            >
              Lino / Arena
            </button>
            <button
              type="button"
              onClick={() => onSecondRowColorsChange("#fef3c7", "#78350f")}
              className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] text-zinc-200 transition-colors cursor-pointer"
            >
              Ámbar Cálido
            </button>
          </div>
        </div>
      )}

      {/* Esquema visual en vivo de la cabecera */}
      {isEnabled && (
        <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
            <span className="font-mono text-zinc-300 text-[10px] uppercase tracking-wider">
              Previsualización de estructura en tienda:
            </span>
            <span className="text-amber-300 text-[10px] font-bold">
              {alignment === "left" && "Junto al Logo (Izquierda)"}
              {alignment === "center" && "Centrado en barra principal"}
              {alignment === "right" && "A la derecha junto al buscador"}
              {alignment === "second_row" && "Segunda fila horizontal exclusiva"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              {/* Logo */}
              <div className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-300 shrink-0">
                MARCA
              </div>

              {/* Enlaces Izquierda */}
              {alignment === "left" && (
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                    ENLACES
                  </span>
                  <span className="text-[10px] text-zinc-500">···</span>
                </div>
              )}

              {/* Enlaces Centro */}
              {alignment === "center" && (
                <div className="flex items-center gap-1.5 mx-auto">
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                    ENLACES CENTRADOS
                  </span>
                </div>
              )}

              {/* Espaciador flexible para derecha */}
              {alignment !== "center" && <div className="flex-1" />}

              {/* Enlaces Derecha */}
              {alignment === "right" && (
                <div className="flex items-center gap-1.5 mr-1">
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                    ENLACES
                  </span>
                </div>
              )}

              {/* Buscador + Acciones */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[9px] text-zinc-400">
                  🔍 Buscar...
                </div>
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px]">
                  🛍️
                </div>
              </div>
            </div>

            {/* Fila 2 si es second_row */}
            {alignment === "second_row" && (
              <div
                className="pt-2 px-2 py-1.5 rounded border border-zinc-800 flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: secondRowBgColor || "rgba(24, 24, 27, 0.8)",
                }}
              >
                <span
                  className="text-[10px] font-mono opacity-80"
                  style={{ color: secondRowTextColor || "#fbbf24" }}
                >
                  ↳ Fila 2:
                </span>
                <div className="flex items-center gap-1.5">
                  {items.slice(0, 5).map((item) => (
                    <span
                      key={item.id}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.isSale
                          ? "bg-rose-900/40 text-rose-300 border border-rose-800/50"
                          : ""
                      }`}
                      style={
                        !item.isSale
                          ? {
                              color: secondRowTextColor || "#fde68a",
                              backgroundColor: secondRowBgColor
                                ? "rgba(0,0,0,0.08)"
                                : "rgba(251, 191, 36, 0.15)",
                              border: "1px solid rgba(251, 191, 36, 0.3)",
                            }
                          : undefined
                      }
                    >
                      {item.label}
                    </span>
                  ))}
                  {items.length > 5 && (
                    <span
                      className="text-[9px] opacity-70"
                      style={{ color: secondRowTextColor || "#a1a1aa" }}
                    >
                      +{items.length - 5} más
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

