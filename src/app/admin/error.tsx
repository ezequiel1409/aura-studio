"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, LayoutDashboard, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("Error en panel de administración:", error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === "function") {
      retry();
    } else if (typeof reset === "function") {
      reset();
    }
  };

  return (
    <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center">
      <div className="w-full max-w-lg rounded-2xl border border-rose-900/60 bg-zinc-900/90 p-8 sm:p-12 shadow-xl backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/70 text-rose-400 border border-rose-800/80">
          <AlertOctagon className="h-8 w-8" aria-hidden="true" />
        </div>

        <span className="mt-5 inline-block font-mono text-xs font-bold uppercase tracking-wider text-rose-400">
          Error en Backoffice
        </span>

        <h1 className="mt-2 text-xl sm:text-2xl font-bold font-serif text-zinc-100">
          Ocurrió un error en el panel
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
          No se pudo completar la operación solicitada. Esto puede deberse a un problema de conexión temporal o datos desactualizados.
        </p>

        {error.message && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-left font-mono text-xs text-rose-300 break-words">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Detalle técnico:</span>
            {error.message}
          </div>
        )}

        {error.digest && (
          <p className="mt-2 text-[10px] font-mono text-zinc-500">
            Digest: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Reintentar</span>
          </button>

          <Link prefetch={false}
            href="/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            <span>Ir al Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

