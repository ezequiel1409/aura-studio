"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogOut,
  Plus,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import {
  ADMIN_PRIMARY_NAV_ITEMS,
  isAdminNavItemActive,
} from "../header/nav-items";
import { useAdminNav } from "./AdminNavContext";

interface SessionUser {
  userId?: number;
  email?: string;
  role?: string;
}

interface AdminMainSidebarProps {
  pathname: string;
  brandName: string;
  user: SessionUser | null;
  userInitial: string;
  userRoleDisplay: string;
  loggingOut: boolean;
  onLogout: () => void;
}

export function AdminMainSidebar({
  pathname,
  brandName,
  user,
  userInitial,
  userRoleDisplay,
  loggingOut,
  onLogout,
}: AdminMainSidebarProps) {
  const {
    isCollapsed,
    toggleCollapse,
    pendingOrdersCount,
    isTooltipDismissed,
  } = useAdminNav();

  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  return (
    <aside
      aria-label="Barra principal de navegación"
      className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-50 bg-zinc-950 border-r border-zinc-800 text-zinc-100 select-none transition-all duration-200 ease-in-out ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* 1. Encabezado de Marca y Botón de Colapso */}
      <div className="h-16 px-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full min-w-0 pr-1">
            <Link prefetch={false}
              href="/admin"
              aria-label={`${brandName}, ir al panel de administración`}
              className="font-serif text-lg tracking-wider text-zinc-100 font-bold hover:opacity-90 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-lg px-1 py-0.5 truncate"
            >
              {brandName}
            </Link>
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Colapsar barra lateral"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-all cursor-pointer shrink-0"
              title="Colapsar barra lateral (240px a 64px)"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Expandir barra lateral"
              className="p-2 rounded-lg text-zinc-300 hover:text-amber-300 hover:bg-zinc-900 border border-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-all cursor-pointer"
              title="Expandir barra lateral"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Lista de Áreas Principales */}
      <nav
        aria-label="Navegación principal de administración"
        className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-none"
      >
        {ADMIN_PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isAdminNavItemActive(pathname, item);
          const isOrders = item.id === "orders";
          const showOrdersBadge = isOrders && pendingOrdersCount > 0;
          const isTooltipVisible =
            isCollapsed &&
            hoveredItemId === item.id &&
            !isTooltipDismissed;
          const itemAriaLabel =
            item.id === "dashboard"
              ? "Inicio (Resumen)"
              : isCollapsed
              ? item.label
              : undefined;

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <Link prefetch={false}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={itemAriaLabel}
                title={item.id === "dashboard" ? "Resumen del negocio" : undefined}
                onFocus={() => setHoveredItemId(item.id)}
                onBlur={() => setHoveredItemId(null)}
                className={`relative flex items-center rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  isCollapsed
                    ? "justify-center p-3"
                    : "justify-between px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-amber-300 text-zinc-950 font-bold shadow-xs admin-nav-active"
                    : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 admin-nav-inactive"
                }`}
              >
                <div
                  className={`flex items-center ${
                    isCollapsed ? "justify-center" : "gap-2.5"
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon size={18} aria-hidden="true" />
                    {/* Badge en modo colapsado posicionado sobre el ícono */}
                    {isCollapsed && showOrdersBadge && (
                      <span
                        aria-label={`${pendingOrdersCount} pedidos pendientes`}
                        className="absolute -top-2 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-zinc-950 font-bold text-[9px] flex items-center justify-center shadow-md animate-pulse"
                      >
                        {pendingOrdersCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {/* Badge en modo expandido */}
                {!isCollapsed && showOrdersBadge && (
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

              {/* Tooltip accesible para modo colapsado */}
              {isTooltipVisible && (
                <div
                  role="tooltip"
                  id={`tooltip-${item.id}`}
                  className="fixed left-18 z-50 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-100 shadow-2xl pointer-events-none flex items-center gap-2 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
                  style={{
                    // Centrado vertical aproximado
                    transform: "translateY(-50%)",
                  }}
                >
                  <span>{item.label}</span>
                  {showOrdersBadge && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-zinc-950 font-bold text-[10px]">
                      {pendingOrdersCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Botón de Cargar Producto */}
        <div className="pt-3">
          <Link prefetch={false}
            href="/admin/productos/nuevo"
            aria-label="Cargar nuevo producto"
            className={`flex items-center justify-center rounded-xl bg-amber-300/10 hover:bg-amber-300/20 border border-amber-400/30 text-amber-300 font-bold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer ${
              isCollapsed ? "p-3" : "py-2.5 px-3 gap-2 text-xs"
            }`}
            title="Cargar nuevo producto"
          >
            {isCollapsed ? (
              <Plus size={16} aria-hidden="true" />
            ) : (
              <>
                <PlusCircle size={15} aria-hidden="true" />
                <span className="truncate">+ Cargar Producto</span>
              </>
            )}
          </Link>
        </div>
      </nav>

      {/* 3. Pie de la Barra: Usuario y Salida */}
      <div className="p-2 border-t border-zinc-800 shrink-0 space-y-2 bg-zinc-950/90">
        {!isCollapsed && (
          <a
            href="https://wa.me/5491112345678?text=Hola,%20necesito%20ayuda%20con%20el%20panel%20de%20mi%20tienda"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            title="Escribir a soporte por WhatsApp"
          >
            <span className="flex items-center gap-2">
              <HelpCircle size={14} className="text-emerald-400" aria-hidden="true" />
              <span>Ayuda y Soporte</span>
            </span>
          </a>
        )}

        <div
          className={`flex items-center rounded-xl bg-zinc-900/80 border border-zinc-800/80 ${
            isCollapsed
              ? "flex-col p-1.5 gap-2 justify-center"
              : "justify-between p-2 gap-2"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-200 truncate">
                  {user?.email || "Administrador"}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-amber-300/90 font-medium">
                  <ShieldCheck size={11} aria-hidden="true" />
                  <span className="truncate">{userRoleDisplay}</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            aria-label={
              loggingOut ? "Cerrando sesión..." : "Cerrar sesión de administración"
            }
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none disabled:opacity-50 cursor-pointer shrink-0"
            title="Cerrar sesión"
          >
            <LogOut size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
