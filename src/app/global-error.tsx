"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Critical root error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-[#faf8f5] text-[#1c1917] font-sans flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-stone-300 bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-bold text-stone-900">
            Error crítico de la aplicación
          </h1>
          <p className="mt-2 text-xs text-stone-600">
            Ocurrió una falla imprevista al cargar el sitio.
          </p>
          {error.digest && (
            <p className="mt-2 text-[10px] font-mono text-stone-400">
              Ref: {error.digest}
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="rounded-xl bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 cursor-pointer"
            >
              Reintentar
            </button>
            <a
              href="/"
              className="rounded-xl border border-stone-300 px-5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Ir al Inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

