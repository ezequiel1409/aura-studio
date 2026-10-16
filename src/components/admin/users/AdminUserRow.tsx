"use client";

import {
  Crown,
  Loader2,
  Mail,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { SafeAdminUser } from "../../../domain/auth/types";

interface AdminUserRowProps {
  user: SafeAdminUser;
  isBusy: boolean;
  onToggleStatus: (user: SafeAdminUser) => void;
}

export function AdminUserRow({ user, isBusy, onToggleStatus }: AdminUserRowProps) {
  const isSuper = user.role === "SUPER_ADMIN";
  const isSuspended = user.status === "SUSPENDED";

  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/60 transition-colors">
      <div className="flex items-start gap-3.5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isSuper
              ? "bg-amber-950/40 border-amber-700/60 text-amber-300"
              : isSuspended
              ? "bg-zinc-900 border-zinc-800 text-zinc-600"
              : "bg-zinc-800/80 border-zinc-700 text-zinc-300"
          }`}
        >
          {isSuper ? <Crown size={18} /> : <Shield size={18} />}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-zinc-100">{user.name}</span>
            {isSuper ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <Crown size={10} />
                Super Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                Admin
              </span>
            )}

            {isSuspended ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-800/80">
                <UserX size={10} />
                Suspendido
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-800/60">
                <UserCheck size={10} />
                Activo
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
            <span className="flex items-center gap-1">
              <Mail size={12} className="text-zinc-500" />
              {user.email}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] text-zinc-500">
              Alta: {new Date(user.createdAt).toLocaleDateString("es-AR")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {isSuper ? (
          <span className="text-xs text-zinc-500 italic px-2">Cuenta principal</span>
        ) : (
          <button
            onClick={() => onToggleStatus(user)}
            disabled={isBusy}
            aria-label={
              isSuspended
                ? `Reactivar acceso al administrador ${user.name}`
                : `Suspender acceso al administrador ${user.name}`
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              isSuspended
                ? "bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800"
                : "bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800"
            } disabled:opacity-50`}
            title={
              isSuspended
                ? "Reactivar acceso a este administrador"
                : "Dar de baja o suspender a este administrador"
            }
          >
            {isBusy ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : isSuspended ? (
              <>
                <ShieldCheck size={13} aria-hidden="true" />
                <span>Reactivar</span>
              </>
            ) : (
              <>
                <UserX size={13} aria-hidden="true" />
                <span>Suspender</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

