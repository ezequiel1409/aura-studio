"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock, RefreshCw, AlertTriangle, CheckCircle2, X } from "lucide-react";

export function AdminSessionMonitor() {
  const pathname = usePathname();
  const router = useRouter();

  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [renewing, setRenewing] = useState(false);
  const [renewedSuccess, setRenewedSuccess] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Umbrales de advertencia en segundos
  const WARNING_THRESHOLD = 15 * 60; // 15 minutos (900 segundos)
  const URGENT_THRESHOLD = 5 * 60; // 5 minutos (300 segundos)

  // Consulta el estado de la sesión al servidor
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      if (!res.ok) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (typeof data.expiresInSeconds === "number") {
        setExpiresInSeconds(data.expiresInSeconds);
      }
    } catch {
      // En caso de fallo de red puntual, no forzar estado de error
    }
  }, []);

  // Verificar sesión en montaje y cada 60 segundos
  useEffect(() => {
    if (
      pathname === "/admin/login" ||
      pathname === "/admin/recuperar" ||
      pathname.startsWith("/admin/restablecer")
    ) {
      return;
    }

    checkSession();
    const interval = setInterval(checkSession, 60 * 1000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pathname, checkSession]);

  // Temporizador local por segundo para conteo fluido
  useEffect(() => {
    if (expiresInSeconds === null || expiresInSeconds <= 0) return;

    const tick = setInterval(() => {
      setExpiresInSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(tick);
  }, [expiresInSeconds]);

  // Si el tiempo cae por debajo del umbral urgente (5 min), reactivar el banner si había sido descartado
  useEffect(() => {
    if (expiresInSeconds !== null && expiresInSeconds <= URGENT_THRESHOLD && isDismissed) {
      setIsDismissed(false);
    }
  }, [expiresInSeconds, isDismissed]);

  // Manejo de renovación en 1 clic
  const handleRefresh = async () => {
    if (renewing) return;
    setRenewing(true);
    try {
      const res = await fetch("/api/admin/session/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setExpiresInSeconds(data.expiresInSeconds || 7200);
        setIsAuthenticated(true);
        setIsDismissed(false);
        setRenewedSuccess(true);
        setTimeout(() => setRenewedSuccess(false), 4500);
      } else {
        setIsAuthenticated(false);
        setExpiresInSeconds(0);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setRenewing(false);
    }
  };

  // No renderizar en páginas de login / recuperación
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/recuperar" ||
    pathname.startsWith("/admin/restablecer")
  ) {
    return null;
  }

  // Toast de confirmación de renovación exitosa
  if (renewedSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-950/90 dark:bg-emerald-950/90 border border-emerald-700 text-emerald-200 shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2"
      >
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" aria-hidden="true" />
        <span>Sesión administrativa extendida con éxito por 2 horas más.</span>
      </div>
    );
  }

  // Estado: Sesión expirada o desautenticada
  const isExpired = expiresInSeconds !== null && expiresInSeconds <= 0;
  if (!isAuthenticated || isExpired) {
    return (
      <aside
        role="alert"
        aria-live="assertive"
        className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-md z-50 p-4 rounded-2xl bg-rose-950/95 border border-rose-800 text-rose-100 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-900/60 text-rose-300 shrink-0 mt-0.5">
            <AlertTriangle size={18} aria-hidden="true" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Sesión Expirada por Inactividad
            </h3>
            <p className="text-xs text-rose-200 leading-relaxed">
              La sesión de administración ha vencido (2 horas de inactividad). Por favor volvé a identificarte para guardar cambios y continuar.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/admin/login")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-200 text-rose-950 text-xs font-bold hover:bg-rose-100 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
              >
                Iniciar sesión nuevamente
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Estado: Advertencia de sesión por expirar (< 15 minutos)
  const isExpiringSoon = expiresInSeconds !== null && expiresInSeconds <= WARNING_THRESHOLD;
  if (isExpiringSoon && !isDismissed) {
    const minutes = Math.floor(expiresInSeconds / 60);
    const seconds = expiresInSeconds % 60;
    const timeFormatted = `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;

    return (
      <aside
        role="alert"
        aria-live="polite"
        className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-md z-50 p-4 rounded-2xl bg-zinc-900/95 dark:bg-zinc-900/95 border border-amber-500/80 text-zinc-100 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <Clock size={18} aria-hidden="true" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Tu sesión está por vencer
              </h3>
              <span className="font-mono text-xs font-bold text-amber-300 px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/40">
                {timeFormatted}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Por inactividad se cerrará tu sesión en {minutes > 0 ? `${minutes} min` : `${seconds} seg`}. Podés renovarla en un clic para no perder tu trabajo.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={renewing}
                aria-label="Renovar sesión administrativa por 2 horas más"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none shadow-md shadow-amber-950/20"
              >
                <RefreshCw size={14} className={renewing ? "animate-spin" : ""} aria-hidden="true" />
                <span>{renewing ? "Renovando..." : "Renovar 2 horas más"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                aria-label="Descartar aviso temporalmente"
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
                title="Descartar aviso"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return null;
}

