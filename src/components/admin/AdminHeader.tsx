"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LogOut, Package, PlusCircle, LayoutDashboard } from "lucide-react";
import { useState } from "react";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // No renderizar barra en la página de login
  if (pathname === "/admin/login") {
    return null;
  }

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { href: "/admin", label: "Resumen", icon: LayoutDashboard },
    { href: "/admin/productos", label: "Prendas", icon: Package },
    { href: "/admin/productos/nuevo", label: "Cargar", icon: PlusCircle },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Marca */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="font-serif text-xl tracking-wider text-amber-100 font-semibold hover:opacity-90">
            Aura Studio
          </Link>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
            Admin
          </span>
        </div>

        {/* Navegación Desktop / Tablet */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-amber-200"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Enlaces de Acción */}
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
            title="Ver catálogo público en una nueva pestaña"
          >
            <span className="hidden md:inline">Ver tienda</span>
            <ArrowUpRight size={14} />
          </a>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
            <span className="hidden md:inline">{loggingOut ? "Saliendo..." : "Salir"}</span>
          </button>
        </div>
      </div>

      {/* Navegación Móvil Inferior Táctil (Mobile-First) */}
      <nav className="sm:hidden flex items-center justify-around border-t border-zinc-800/80 bg-zinc-950 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-4 text-xs font-medium transition-colors ${
                isActive ? "text-amber-300 font-semibold" : "text-zinc-400"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
