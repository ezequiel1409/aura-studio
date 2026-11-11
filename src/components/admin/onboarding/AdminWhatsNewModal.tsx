"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  X,
  History,
  Layers,
  Check,
} from "lucide-react";
import {
  ADMIN_CHANGELOG_RELEASES,
  AdminReleaseItem,
  getAcknowledgedReleaseIds,
  acknowledgeRelease,
  acknowledgeAllReleases,
} from "../../../lib/changelog/releases";
import { useAdminNav } from "../navigation/AdminNavContext";

interface AdminWhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number | string | null;
  initialReleaseId?: string;
}

export function AdminWhatsNewModal({
  isOpen,
  onClose,
  userId: propUserId,
  initialReleaseId,
}: AdminWhatsNewModalProps) {
  const { userId: navUserId } = useAdminNav();
  const userId = propUserId ?? navUserId;

  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>(() => {
    return getAcknowledgedReleaseIds(userId);
  });
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>(
    initialReleaseId || ADMIN_CHANGELOG_RELEASES[0]?.id || ""
  );

  const refreshState = useCallback(() => {
    setAcknowledgedIds(getAcknowledgedReleaseIds(userId));
  }, [userId]);

  useEffect(() => {
    refreshState();
    const handleUpdate = () => refreshState();
    window.addEventListener("app_changelog_updated", handleUpdate);
    return () => window.removeEventListener("app_changelog_updated", handleUpdate);
  }, [refreshState]);

  useEffect(() => {
    if (initialReleaseId) {
      setSelectedReleaseId(initialReleaseId);
    } else if (ADMIN_CHANGELOG_RELEASES.length > 0) {
      // Priorizar seleccionar una que no esté leída
      const unread = ADMIN_CHANGELOG_RELEASES.find((r) => !acknowledgedIds.includes(r.id));
      if (unread) {
        setSelectedReleaseId(unread.id);
      }
    }
  }, [initialReleaseId, acknowledgedIds]);

  if (!isOpen) return null;

  const currentRelease: AdminReleaseItem =
    ADMIN_CHANGELOG_RELEASES.find((r) => r.id === selectedReleaseId) ||
    ADMIN_CHANGELOG_RELEASES[0];

  const isCurrentAcknowledged = currentRelease
    ? acknowledgedIds.includes(currentRelease.id)
    : false;

  const handleAcknowledgeCurrent = () => {
    if (currentRelease) {
      acknowledgeRelease(currentRelease.id, userId);
      refreshState();
    }
  };

  const handleAcknowledgeAll = () => {
    acknowledgeAllReleases(userId);
    refreshState();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-300">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="whats-new-modal-title" className="text-base sm:text-lg font-bold text-zinc-100">
                  Centro de Novedades e Integraciones
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {ADMIN_CHANGELOG_RELEASES.length} actualizaciones
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Conocé qué cambió, cómo se utiliza ahora y marcá como leído para mantenerte al día.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de novedades"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido dividido: Lista lateral + Detalle comparativo */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Barra lateral de versiones/novedades */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-zinc-800/80 bg-zinc-950/50 p-3 overflow-y-auto space-y-1.5 shrink-0">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Historial de Cambios
            </div>
            {ADMIN_CHANGELOG_RELEASES.map((item) => {
              const isSelected = item.id === selectedReleaseId;
              const isAck = acknowledgedIds.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedReleaseId(item.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-zinc-900 border-amber-400/50 shadow-md"
                      : "bg-zinc-900/30 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-amber-300 font-semibold">
                      {item.version}
                    </span>
                    {isAck ? (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <Check size={12} className="text-emerald-400" />
                        <span>Entendido</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold line-clamp-2 ${isSelected ? "text-zinc-100" : "text-zinc-300"}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] text-zinc-400">{item.date}</span>
                </button>
              );
            })}
          </div>

          {/* Área principal: Vista comparativa Antes vs Ahora */}
          {currentRelease && (
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Encabezado de la novedad actual */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    {currentRelease.category}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {currentRelease.version} • {currentRelease.date}
                  </span>
                  {currentRelease.badge && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                      {currentRelease.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-zinc-100">
                  {currentRelease.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {currentRelease.summary}
                </p>
              </div>

              {/* Comparativa Cara a Cara: Antes vs Ahora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tarjeta: Anteriormente (Antes) */}
                <div className="bg-zinc-900/40 border border-zinc-800/90 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <History size={16} className="text-zinc-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      {currentRelease.before.title}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {currentRelease.before.description}
                  </p>
                  {currentRelease.before.points && (
                    <ul className="space-y-2 pt-1">
                      {currentRelease.before.points.map((pt, i) => (
                        <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                          <span className="leading-snug">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Tarjeta: Cómo funciona hoy (Ahora) */}
                <div className="bg-zinc-900 border border-amber-400/30 rounded-2xl p-4.5 space-y-3 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-2 text-amber-300">
                    <Layers size={16} className="text-amber-300" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      {currentRelease.now.title}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                    {currentRelease.now.description}
                  </p>
                  {currentRelease.now.points && (
                    <ul className="space-y-2 pt-1">
                      {currentRelease.now.points.map((pt, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                          <span className="leading-snug">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Botones de Acción de la novedad */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAcknowledgeCurrent}
                    disabled={isCurrentAcknowledged}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrentAcknowledged
                        ? "bg-zinc-900 border border-zinc-800 text-emerald-400 opacity-80 cursor-default"
                        : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20"
                    }`}
                  >
                    <CheckCircle2 size={15} />
                    <span>{isCurrentAcknowledged ? "Ya comprendiste este cambio" : "Ya lo entendí (No volver a mostrar)"}</span>
                  </button>
                </div>

                {currentRelease.actionHref && (
                  <Link
                    href={currentRelease.actionHref}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-colors shadow-md shadow-amber-400/20"
                  >
                    <span>{currentRelease.actionLabel || "Probar función ahora"}</span>
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>
              {acknowledgedIds.length} de {ADMIN_CHANGELOG_RELEASES.length} novedades comprendidas
            </span>
          </div>
          <div className="flex items-center gap-3">
            {acknowledgedIds.length < ADMIN_CHANGELOG_RELEASES.length && (
              <button
                type="button"
                onClick={handleAcknowledgeAll}
                className="text-xs text-zinc-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
              >
                Marcar todas como entendidas
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold cursor-pointer transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
