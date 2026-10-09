"use client";

import { useEffect, useState } from "react";
import { RotateCcw, X } from "lucide-react";

export interface UndoAction {
  id: string;
  productId: number;
  productCode: number;
  fromStatus: string;
  toStatus: string;
  message: string;
}

interface UndoToastProps {
  action: UndoAction | null;
  onUndo: (action: UndoAction) => Promise<void>;
  onDismiss: () => void;
  durationMs?: number;
}

export function UndoToast({
  action,
  onUndo,
  onDismiss,
  durationMs = 8000,
}: UndoToastProps) {
  const [progress, setProgress] = useState(100);
  const [prevActionId, setPrevActionId] = useState(action?.id);
  const [undoing, setUndoing] = useState(false);

  if (action && action.id !== prevActionId) {
    setPrevActionId(action.id);
    setProgress(100);
  }

  useEffect(() => {
    if (!action) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [action, durationMs, onDismiss]);

  if (!action) return null;

  const handleUndoClick = async () => {
    if (undoing) return;
    setUndoing(true);
    try {
      await onUndo(action);
    } finally {
      setUndoing(false);
      onDismiss();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
          <p className="text-xs sm:text-sm text-zinc-100 font-medium truncate">
            {action.message}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUndoClick}
            disabled={undoing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-300 text-zinc-950 font-bold text-xs hover:bg-amber-200 active:scale-[0.96] transition-all shadow-sm"
          >
            <RotateCcw size={12} className={undoing ? "animate-spin" : ""} />
            <span>{undoing ? "Revirtiendo..." : "Deshacer"}</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Cerrar aviso"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Barra de progreso de tiempo restante para deshacer */}
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
