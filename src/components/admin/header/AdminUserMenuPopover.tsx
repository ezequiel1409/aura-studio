"use client";

import Link from "next/link";
import { ArrowUpRight, Clock, LogOut, RefreshCw, Shield, User } from "lucide-react";

interface AdminUserMenuPopoverProps {
  isOpen: boolean;
  brandName: string;
  userEmail?: string;
  userInitial: string;
  userRoleDisplay: string;
  expiresInSeconds: number | null;
  renewingSession: boolean;
  loggingOut: boolean;
  onToggle: () => void;
  onClose: () => void;
  onRenewSession: () => void;
  onLogout: () => void;
}

export function AdminUserMenuPopover({
  isOpen,
  brandName,
  userEmail,
  userInitial,
  userRoleDisplay,
  expiresInSeconds,
  renewingSession,
  loggingOut,
  onToggle,
  onClose,
  onRenewSession,
  onLogout,
}: AdminUserMenuPopoverProps) {
  return (
    <div className="relative">
      <button
        type="button"
        id="admin-user-menu-button"
        onClick={onToggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={
          userEmail
            ? `Cuenta de ${userEmail} (${userRoleDisplay}). Administrar cuenta y sesión.`
            : `Cuenta de administración de ${brandName}`
        }
        title={userEmail ? `${userEmail} (${userRoleDisplay})` : "Cuenta de Administradora"}
        className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-amber-400/60 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-all group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center shadow-xs border border-amber-300/40 select-none">
          {userInitial}
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-labelledby="user-dialog-title"
            aria-modal="true"
            className="absolute right-0 top-full mt-2 w-72 sm:w-80 z-50 rounded-2xl bg-zinc-900 border border-zinc-700/80 p-4 shadow-2xl backdrop-blur-xl text-zinc-100 animate-in fade-in slide-in-from-top-2 space-y-4"
          >
            {/* Encabezado: Avatar grande, email y rol */}
            <div className="flex flex-col items-center text-center space-y-1.5 pb-3 border-b border-zinc-800">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-zinc-950 font-extrabold text-xl flex items-center justify-center shadow-md border-2 border-amber-300/60 select-none">
                {userInitial}
              </div>
              <div className="space-y-0.5">
                <h3
                  id="user-dialog-title"
                  className="text-sm font-bold text-zinc-100 truncate max-w-[240px]"
                >
                  {userEmail || "Administradora Aura"}
                </h3>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] uppercase font-bold tracking-wider text-amber-300">
                  <Shield size={10} aria-hidden="true" />
                  <span>{userRoleDisplay}</span>
                </div>
              </div>
            </div>

            {/* Estado de la Sesión */}
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sesión Activa</span>
                </div>
                {expiresInSeconds !== null && (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                    <Clock size={11} aria-hidden="true" />
                    <span>~{Math.max(1, Math.floor(expiresInSeconds / 60))} min</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Autenticación segura por 2 horas de inactividad (BR-37).
              </p>
              <button
                type="button"
                onClick={onRenewSession}
                disabled={renewingSession}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-200 text-xs font-semibold transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <RefreshCw
                  size={12}
                  className={renewingSession ? "animate-spin" : ""}
                  aria-hidden="true"
                />
                <span>{renewingSession ? "Renovando..." : "Renovar 2 horas más"}</span>
              </button>
            </div>

            {/* Enlace a gestión de equipo y perfil */}
            <div className="space-y-1">
              <Link
                href="/admin/usuarios"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <User size={14} className="text-zinc-400" />
                  <span>Gestionar equipo y accesos</span>
                </span>
                <ArrowUpRight size={13} className="text-zinc-500" />
              </Link>
            </div>

            {/* Botón de Cerrar Sesión */}
            <div className="pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={onLogout}
                disabled={loggingOut}
                aria-label={loggingOut ? "Cerrando sesión..." : "Cerrar sesión de administración"}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-rose-950/70 border border-zinc-700/80 hover:border-rose-700 text-zinc-300 hover:text-rose-200 font-semibold text-xs transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none disabled:opacity-50"
              >
                <LogOut size={14} aria-hidden="true" />
                <span>{loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

