"use client";

import { useEffect, useState } from "react";
import { Clock, History, Loader2, X, Globe, Send, Cpu } from "lucide-react";
import { StatusHistoryEntry } from "../../domain/product/types";

interface StatusHistoryModalProps {
  productId: number | null;
  productCode: number | null;
  productTitle: string | null;
  onClose: () => void;
}

export function StatusHistoryModal({
  productId,
  productCode,
  productTitle,
  onClose,
}: StatusHistoryModalProps) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/products/history?productId=${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.ok) {
          setHistory(data.history);
        } else {
          setError(data.error || "No se pudo cargar el historial.");
        }
      })
      .catch(() => {
        if (isMounted) setError("Error de conexión al obtener el historial.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (!productId) return null;

  const codeFormatted = productCode ? `#${String(productCode).padStart(3, "0")}` : "";

  const renderSourceIcon = (source: string) => {
    switch (source) {
      case "telegram":
        return <Send size={12} className="text-sky-400" />;
      case "system":
        return <Cpu size={12} className="text-purple-400" />;
      default:
        return <Globe size={12} className="text-amber-400" />;
    }
  };

  const statusLabel = (st: string | null) => {
    switch (st) {
      case "AVAILABLE":
        return "Disponible";
      case "RESERVED":
        return "Reservada";
      case "SOLD_OUT":
        return "Agotada";
      default:
        return "Creación inicial";
    }
  };

  const statusBadge = (st: string) => {
    switch (st) {
      case "AVAILABLE":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/80";
      case "RESERVED":
        return "bg-amber-950/60 text-amber-300 border-amber-800/80";
      case "SOLD_OUT":
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Cabecera */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-amber-300" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Historial de Estados {codeFormatted}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-xs">
                {productTitle || "Prenda"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido / Timeline */}
        <div className="p-4 overflow-y-auto space-y-4">
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
              <Loader2 size={24} className="animate-spin text-amber-300" />
              <span>Cargando auditoría...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs">
              {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <p className="text-center text-xs text-zinc-500 py-6">
              No hay cambios de estado registrados para esta prenda.
            </p>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
              {history.map((entry, idx) => {
                const date = new Date(entry.at);
                const formattedDate = date.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={entry.id || idx} className="relative group">
                    {/* Punto del timeline */}
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-zinc-700 border-2 border-zinc-900 group-first:bg-amber-400" />

                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={11} />
                          {formattedDate}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {renderSourceIcon(entry.source)}
                          {entry.source}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium">
                        {entry.fromStatus ? (
                          <>
                            <span className="text-zinc-400 line-through">
                              {statusLabel(entry.fromStatus)}
                            </span>
                            <span className="text-zinc-600">→</span>
                          </>
                        ) : null}
                        <span
                          className={`px-2 py-0.5 rounded-lg border text-xs font-semibold ${statusBadge(
                            entry.toStatus
                          )}`}
                        >
                          {statusLabel(entry.toStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
