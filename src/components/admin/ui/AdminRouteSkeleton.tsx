interface AdminRouteSkeletonProps {
  variant?: "list" | "detail" | "form" | "cards";
  label?: string;
  contentOnly?: boolean;
}

/**
 * Esqueleto de carga reutilizable para subrutas de administración.
 * En layouts con tabs persistentes (`contentOnly`), omite la cabecera falsa
 * para reemplazar únicamente el cuerpo interno de `<section>`.
 */
export function AdminRouteSkeleton({
  variant = "list",
  label = "Cargando contenido del panel...",
  contentOnly = false,
}: AdminRouteSkeletonProps) {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label={label}
    >
      {/* Cabecera solo en rutas sin shell de sección padre */}
      {!contentOnly && (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2.5">
            <div className="h-3 w-24 rounded bg-zinc-800" />
            <div className="h-7 w-60 rounded-lg bg-zinc-800" />
            <div className="h-3.5 w-72 rounded bg-zinc-800/70" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-zinc-800" />
        </div>
      )}

      {variant === "list" && (
        <div className="space-y-3">
          <div className="h-11 w-full rounded-xl bg-zinc-900/60 border border-zinc-800/70" />
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/70 px-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-zinc-800 shrink-0" />
                <div className="space-y-2">
                  <div className="h-3.5 w-44 rounded bg-zinc-800" />
                  <div className="h-2.5 w-28 rounded bg-zinc-800/60" />
                </div>
              </div>
              <div className="h-7 w-24 rounded-lg bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {variant === "detail" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-44 rounded-2xl bg-zinc-900/50 border border-zinc-800/70" />
            <div className="h-60 rounded-2xl bg-zinc-900/50 border border-zinc-800/70" />
          </div>
          <div className="space-y-4">
            <div className="h-48 rounded-2xl bg-zinc-900/50 border border-zinc-800/70" />
            <div className="h-36 rounded-2xl bg-zinc-900/50 border border-zinc-800/70" />
          </div>
        </div>
      )}

      {variant === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((card) => (
            <div
              key={card}
              className="h-36 rounded-2xl bg-zinc-900/50 border border-zinc-800/70 p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="h-4 w-32 rounded bg-zinc-800" />
                <div className="h-5 w-16 rounded-full bg-zinc-800/80" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-48 rounded bg-zinc-800" />
                <div className="h-3 w-40 rounded bg-zinc-800/60" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === "form" && (
        <div className="space-y-4 bg-zinc-900/50 border border-zinc-800/70 rounded-2xl p-6">
          {[1, 2, 3, 4].map((field) => (
            <div key={field} className="space-y-2">
              <div className="h-3 w-32 rounded bg-zinc-800" />
              <div className="h-11 w-full rounded-xl bg-zinc-800/70" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
