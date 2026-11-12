"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type AdminFeedbackVariant = "ok" | "error" | "warning" | "info";

export interface AdminFeedbackBannerProps {
  type: AdminFeedbackVariant;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_CLASSES: Record<
  AdminFeedbackVariant,
  { container: string; iconColor: string }
> = {
  ok: {
    container: "bg-emerald-950/60 border-emerald-800/80 text-emerald-200",
    iconColor: "text-emerald-400",
  },
  error: {
    container: "bg-rose-950/60 border-rose-800/80 text-rose-200",
    iconColor: "text-rose-400",
  },
  warning: {
    container: "bg-amber-950/50 border-amber-700/70 text-amber-200",
    iconColor: "text-amber-400",
  },
  info: {
    container: "bg-sky-950/50 border-sky-800/70 text-sky-200",
    iconColor: "text-sky-400",
  },
};

function renderFeedbackIcon(type: AdminFeedbackVariant, className: string) {
  switch (type) {
    case "ok":
      return <CheckCircle2 size={16} className={className} />;
    case "error":
      return <AlertCircle size={16} className={className} />;
    case "warning":
      return <AlertTriangle size={16} className={className} />;
    case "info":
      return <Info size={16} className={className} />;
  }
}

/**
 * Banner de notificación accesible para confirmaciones y errores en línea
 * en reemplazo de `window.alert()`.
 */
export function AdminFeedbackBanner({
  type,
  message,
  onDismiss,
  className = "",
}: AdminFeedbackBannerProps) {
  const styles = VARIANT_CLASSES[type];
  const isAlert = type === "error" || type === "warning";

  return (
    <div
      role={isAlert ? "alert" : "status"}
      aria-live="polite"
      className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${styles.container} ${className}`.trim()}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {renderFeedbackIcon(type, `shrink-0 ${styles.iconColor}`)}
        <span className="leading-relaxed break-words">{message}</span>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar notificación"
          className="p-1.5 rounded-lg text-current/70 hover:text-current hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
