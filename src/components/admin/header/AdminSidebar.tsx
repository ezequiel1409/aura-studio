"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  HelpCircle,
  LogOut,
  PlusCircle,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import {
  ADMIN_PRIMARY_NAV_ITEMS,
  isAdminNavItemActive,
} from "./nav-items";

interface SessionUser {
  userId?: number;
  email?: string;
  role?: string;
}

interface AdminSidebarProps {
  pathname: string;
  brandName: string;
  user: SessionUser | null;
  userInitial: string;
  userRoleDisplay: string;
  loggingOut: boolean;
  onLogout: () => void;
  pendingOrdersCount?: number;
}

export function AdminSidebar({
  pathname,
  brandName,
  user,
  userInitial,
  userRoleDisplay,
  loggingOut,
  onLogout,
  pendingOrdersCount = 0,
}: AdminSidebarProps) {
  return (
    <aside
      aria-label="Barra lateral de administración"
      className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-50 bg-zinc-950 border-r border-zinc-800 text-zinc-100 select-none"
    >
      {/* 1. Encabezado de Marca y Estado de Tienda */}
      <div className="h-16 px-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <Link
          href="/admin"
          aria-label={`${brandName}, ir al panel de administración`}
          className="font-serif text-lg tracking-wider text-zinc-100 font-bold hover:opacity-90 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-lg px-1 py-0.5 truncate"
        >
          {brandName}
        </Link>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-[11px] font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Publicada</span>
        </div>
      </div>

      {/* 2. Navegación Principal Vertical */}
      <nav
        aria-label="Navegación principal de administración"
        className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto"
      >
        {ADMIN_PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isAdminNavItemActive(pathname, item);
          const isOrders = item.id === "orders";

          return (
            <div key={item.id} className="space-y-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  isActive
                    ? "bg-amber-300 text-zinc-950 font-bold shadow-xs admin-nav-active"
                    : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 admin-nav-inactive"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
                {isOrders && pendingOrdersCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-zinc-950 text-amber-300"
                        : "bg-amber-400/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {pendingOrdersCount}
                  </span>
                )}
              </Link>

              {/* Sub-items si la sección está activa */}
              {isActive && item.subItems && (
                <div className="pl-6 pr-2 py-1 space-y-1 border-l-2 border-zinc-800 ml-4">
                  {item.subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                          isSubActive
                            ? "text-amber-300 font-bold bg-zinc-900"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                        }`}
                      >
                        <SubIcon size={13} aria-hidden="true" />
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Separador de acción rápida */}
        <div className="pt-3 pb-1">
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-amber-300/10 hover:bg-amber-300/20 border border-amber-400/30 text-amber-300 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
          >
            <PlusCircle size={15} aria-hidden="true" />
            <span>+ Cargar Producto</span>
          </Link>
        </div>
      </nav>

      {/* 3. Pie de Barra Lateral: Soporte, Usuario y Salir */}
      <div className="p-3 border-t border-zinc-800 shrink-0 space-y-2.5 bg-zinc-950/80">
        {/* Enlace de soporte WhatsApp para comerciantes */}
        <a
          href="https://wa.me/5491112345678?text=Hola,%20necesito%20ayuda%20con%20el%20panel%20de%20mi%20tienda"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          title="Escribir a soporte humano por WhatsApp"
        >
          <span className="flex items-center gap-2">
            <HelpCircle size={14} className="text-emerald-400" aria-hidden="true" />
            <span>Ayuda y Soporte</span>
          </span>
          <ArrowUpRight size={13} className="text-zinc-500" aria-hidden="true" />
        </a>

        {/* Tarjeta de Usuario */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">
                {user?.email || "Administrador"}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-amber-300/90 font-medium">
                <ShieldCheck size={11} aria-hidden="true" />
                <span className="truncate">{userRoleDisplay}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            aria-label={loggingOut ? "Cerrando sesión..." : "Cerrar sesión de administración"}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none disabled:opacity-50 cursor-pointer shrink-0"
            title="Cerrar sesión"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}

