"use client";

import { Compass } from "lucide-react";

interface NavbarMasterSwitchProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export function NavbarMasterSwitch({
  isEnabled,
  onToggle,
}: NavbarMasterSwitchProps) {
  return (
    <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-amber-300" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Barra de Navegación en Tienda (Navbar)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl">
            Activá o desactivá la barra de enlaces en la cabecera. Si la apagás, la tienda
            adopta un diseño minimalista y compacto con logo, buscador y bolsa de compras.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            role="switch"
            id="navbar-visibility-switch"
            aria-checked={isEnabled}
            aria-label={
              isEnabled
                ? "Desactivar barra de navegación"
                : "Activar barra de navegación"
            }
            onClick={onToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
              isEnabled
                ? "bg-emerald-500 shadow-sm shadow-emerald-500/25"
                : "bg-rose-600 shadow-sm shadow-rose-600/25"
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-xs font-bold uppercase tracking-wider select-none ${
              isEnabled ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isEnabled ? "Navbar Visible" : "Navbar Oculta (Apagada)"}
          </span>
        </div>
      </div>

      {!isEnabled && (
        <div className="pt-2 border-t border-zinc-800/80 text-xs text-amber-300/80 flex items-center gap-1.5">
          <span>
            ℹ️ La barra de navegación está apagada. Las secciones de alineación y enlaces a continuación aparecen grisadas.
          </span>
        </div>
      )}
    </div>
  );
}

