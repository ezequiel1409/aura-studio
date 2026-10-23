import Link from "next/link";
import { PlusCircle } from "lucide-react";

interface DashboardWelcomeHeaderProps {
  storeType: string;
}

export function DashboardWelcomeHeader({ storeType }: DashboardWelcomeHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xs">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
          Resumen General
        </span>
        <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 mt-1">
          Panel de {storeType}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Visualizá contadores en tiempo real, alertas de stock y métricas de catálogo.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link prefetch={false}
          href="/admin/productos/nuevo"
          aria-label="Cargar nuevo producto al catálogo"
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-200 text-zinc-950 font-bold text-sm hover:bg-amber-100 active:scale-[0.98] transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        >
          <PlusCircle size={18} aria-hidden="true" />
          <span>+ Cargar Producto</span>
        </Link>
      </div>
    </div>
  );
}
