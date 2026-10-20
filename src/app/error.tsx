"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function GlobalErrorPage({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    // Loguear error para monitoreo con código de referencia
    console.error(
      "Error global en tienda:",
      error?.message || error,
      error?.digest ? `(Digest: ${error.digest})` : ""
    );
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === "function") {
      retry();
    } else if (typeof reset === "function") {
      reset();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] px-4 py-16 text-[#1c1917] sm:px-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-lg rounded-3xl border border-[#e7e2da] bg-white p-8 sm:p-12 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="h-8 w-8 stroke-[1.5]" aria-hidden="true" />
        </div>

        <span className="mt-6 inline-block font-mono text-xs font-bold uppercase tracking-widest text-rose-700">
          Error en la aplicación
        </span>

        <h1 className="mt-2 font-serif text-2xl sm:text-3xl font-light text-stone-900">
          Algo no salió como esperábamos
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-xs sm:text-sm leading-relaxed text-stone-600">
          Ocurrió un problema temporal al procesar tu solicitud. Podés intentar recargar la página o volver al catálogo principal.
        </p>

        {error.digest && (
          <p className="mt-3 text-[11px] font-mono text-stone-400">
            Código de referencia: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-stone-800 cursor-pointer focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reintentar</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-2.5 text-xs font-semibold tracking-wider text-stone-700 uppercase transition-colors hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Ir al catálogo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
