"use client";

import Link from "next/link";
import { ArrowUpRight, LogOut } from "lucide-react";
import {
  ADMIN_PRIMARY_NAV_ITEMS,
  ADMIN_QUICK_CREATE_ITEM,
  isAdminNavItemActive,
} from "./nav-items";

interface AdminMobileDrawerProps {
  isOpen: boolean;
  pathname: string;
  userEmail?: string;
  userInitial: string;
  userRoleDisplay: string;
  loggingOut: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function AdminMobileDrawer({
  isOpen,
  pathname,
  userEmail,
  userInitial,
  userRoleDisplay,
  loggingOut,
  onClose,
  onLogout,
}: AdminMobileDrawerProps) {
  const QuickIcon = ADMIN_QUICK_CREATE_ITEM.icon;

  return (
    <div
      id="admin-collapsible-nav"
      className={`sm:hidden border-t border-zinc-800 transition-all duration-300 overflow-hidden ${
        isOpen ? "max-h-[620px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      }`}
    >
      <nav
        aria-label="Navegación móvil de administración"
        className="p-4 bg-zinc-950/98 space-y-3 backdrop-blur-xl"
      >
        {/* Tarjeta de usuario en el menú desplegable */}
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-100 truncate">
                {userEmail || "Administradora"}
              </p>
              <p className="text-[11px] text-amber-300 font-semibold">{userRoleDisplay}</p>
            </div>
          </div>

          <Link
            href={ADMIN_QUICK_CREATE_ITEM.href}
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-200 text-zinc-950 text-xs font-bold shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <QuickIcon size={14} aria-hidden="true" />
            <span>Cargar</span>
          </Link>
        </div>

        {/* 4 Pilares Principales con sus sub-secciones */}
        <div className="space-y-1.5 pt-1">
          {ADMIN_PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isAdminNavItemActive(pathname, item);
            return (
              <div key={item.id} className="space-y-1.5">
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    isActive
                      ? "bg-amber-200 text-zinc-950 font-bold shadow-xs admin-nav-active"
                      : "text-zinc-200 hover:text-zinc-100 hover:bg-zinc-900 admin-nav-inactive"
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>

                {isActive && item.subItems && (
                  <div className="grid grid-cols-2 gap-1.5 pl-4 pr-1 py-1">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onClose}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 hover:text-amber-300 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                        >
                          <SubIcon size={13} className="text-amber-300 shrink-0" aria-hidden="true" />
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2 px-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <span>Ver tienda</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800 text-xs font-semibold hover:bg-rose-900/60 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none cursor-pointer"
          >
            <LogOut size={14} aria-hidden="true" />
            <span>{loggingOut ? "Saliendo..." : "Salir"}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
