export default function AdminLoading() {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Cargando sección de administración"
    >
      {/* Cabecera skeleton */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-3 w-28 rounded bg-zinc-800" />
          <div className="h-7 w-56 rounded-lg bg-zinc-800" />
          <div className="h-3.5 w-72 rounded bg-zinc-800/70" />
        </div>
        <div className="h-11 w-40 rounded-xl bg-zinc-800" />
      </div>

      {/* Grilla de tarjetas skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-zinc-900/50 border border-zinc-800/70 p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-zinc-800" />
              <div className="h-8 w-8 rounded-xl bg-zinc-800" />
            </div>
            <div className="h-8 w-14 rounded bg-zinc-800" />
            <div className="h-2.5 w-32 rounded bg-zinc-800/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

