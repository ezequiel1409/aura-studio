import Link from "next/link";
import { ArrowLeft, FileQuestion, LayoutDashboard, Package, ShoppingBag } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 sm:p-12 shadow-xl backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 text-amber-400 border border-zinc-700/80">
          <FileQuestion className="h-8 w-8" aria-hidden="true" />
        </div>

        <span className="mt-5 inline-block font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
          Error 404 · Backoffice
        </span>

        <h1 className="mt-2 text-xl sm:text-2xl font-bold font-serif text-zinc-100">
          Recurso o página no encontrada
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
          La orden, producto, categoría o sección solicitada no existe, fue eliminada o el enlace es incorrecto.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/admin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            <span>Panel General</span>
          </Link>

          <Link
            href="/admin/ordenes"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-750 hover:text-white transition-colors"
          >
            <ShoppingBag className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>Ir a Pedidos</span>
          </Link>

          <Link
            href="/admin/productos"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-750 hover:text-white transition-colors"
          >
            <Package className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <span>Catálogo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

