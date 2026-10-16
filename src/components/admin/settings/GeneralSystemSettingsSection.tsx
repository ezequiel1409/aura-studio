"use client";

import Link from "next/link";
import { ArrowRight, Clock, FolderTree, Users } from "lucide-react";

interface GeneralSystemSettingsSectionProps {
  reservationHours: number;
  onReservationHoursChange: (val: number) => void;
}

export function GeneralSystemSettingsSection({
  reservationHours,
  onReservationHoursChange,
}: GeneralSystemSettingsSectionProps) {
  return (
    <div
      id="settings-panel-general"
      role="tabpanel"
      aria-labelledby="settings-tab-general"
      className="space-y-5"
    >
      {/* Bloque 1: Reglas Operativas del Catálogo */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-300" aria-hidden="true" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Reglas de Reserva e Inventario
            </h2>
            <p className="text-[11px] text-zinc-400">
              Configurá el tiempo predeterminado cuando marcás una prenda como reservada.
            </p>
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <label htmlFor="reservationHoursInput" className="text-xs font-medium text-zinc-300">
            Duración de Reserva Temporal (en horas)
          </label>
          <input
            id="reservationHoursInput"
            type="number"
            min={1}
            max={720}
            value={reservationHours}
            onChange={(e) =>
              onReservationHoursChange(Math.max(1, parseInt(e.target.value, 10) || 48))
            }
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-400"
          />
          <p className="text-[11px] text-zinc-500">
            Valor por defecto: 48 horas. Al cumplirse el plazo, la prenda vuelve a estar
            Disponible automáticamente.
          </p>
        </div>
      </div>

      {/* Bloque 2: Accesos a Módulos de Sistema (Equipo y Categorías) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Administración de Equipo y Estructura
          </h2>
          <p className="text-[11px] text-zinc-400 mt-1">
            Gestioná los permisos de tu equipo de trabajo y la jerarquía de categorías del
            catálogo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/usuarios"
            className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-amber-400/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-300">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-100">Equipo y Administradoras</p>
                <p className="text-[11px] text-zinc-400">Crear cuentas y gestionar accesos</p>
              </div>
            </div>
            <ArrowRight
              size={15}
              className="text-zinc-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all"
            />
          </Link>

          <Link
            href="/admin/categorias"
            className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-amber-400/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-800 text-amber-200">
                <FolderTree size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-100">Árbol de Categorías</p>
                <p className="text-[11px] text-zinc-400">Ordenar rubros y subcategorías</p>
              </div>
            </div>
            <ArrowRight
              size={15}
              className="text-zinc-500 group-hover:text-amber-200 group-hover:translate-x-0.5 transition-all"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

