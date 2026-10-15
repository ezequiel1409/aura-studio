"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  RefreshCw,
  Settings,
  Shield,
  ShoppingBag,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { AdminThemeToggle } from "./AdminThemeToggle";

interface SessionUser {
  userId?: number;
  email?: string;
  role?: string;
}

interface AdminHeaderProps {
  brandName?: string;
  storeType?: string;
}

export function AdminHeader({
  brandName: initialBrandName,
  storeType: initialStoreType,
}: AdminHeaderProps = {}) {
  const pathname = usePathname();
  const router = useRouter();

  const [brandName, setBrandName] = useState(initialBrandName || "Aura Studio");
  const [storeType, setStoreType] = useState(initialStoreType || "Showroom");
  const [loggingOut, setLoggingOut] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [renewingSession, setRenewingSession] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Consulta de datos de sesión del usuario logueado (BR-10, BR-37)
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setExpiresInSeconds(data.expiresInSeconds);
        }
      }
    } catch {
      // Ignorar fallas momentáneas de red
    }
  }, []);

  useEffect(() => {
    if (
      pathname === "/admin/login" ||
      pathname === "/admin/recuperar" ||
      pathname.startsWith("/admin/restablecer")
    ) {
      return;
    }
    fetchSession();
  }, [pathname, fetchSession]);

  useEffect(() => {
    if (!initialBrandName || !initialStoreType) {
      fetch("/api/admin/login")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            if (data.storeName && !initialBrandName) setBrandName(data.storeName);
            if (data.storeType && !initialStoreType) setStoreType(data.storeType);
          }
        })
        .catch(() => {});
    }
  }, [initialBrandName, initialStoreType]);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsNavOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Cerrar popover con tecla Escape o clic afuera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsNavOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // No renderizar barra en páginas de login y recuperación
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/recuperar" ||
    pathname.startsWith("/admin/restablecer")
  ) {
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

  const handleRenewSession = async () => {
    if (renewingSession) return;
    setRenewingSession(true);
    try {
      const res = await fetch("/api/admin/session/refresh", { method: "POST" });
      if (res.ok) {
        await fetchSession();
      }
    } finally {
      setRenewingSession(false);
    }
  };

  const navItems = [
    { href: "/admin", label: "Resumen", mobileLabel: "Resumen", icon: LayoutDashboard },
    { href: "/admin/ordenes", label: "Pedidos", mobileLabel: "Pedidos", icon: ShoppingBag },
    { href: "/admin/productos", label: "Catálogo", mobileLabel: "Catálogo", icon: Package },
    { href: "/admin/productos/nuevo", label: "Cargar", mobileLabel: "Cargar", icon: PlusCircle },
    { href: "/admin/categorias", label: "Categorías", mobileLabel: "Categorías", icon: FolderTree },
    { href: "/admin/configuracion", label: "Ajustes", mobileLabel: "Ajustes", icon: Settings },
    { href: "/admin/usuarios", label: "Equipo", mobileLabel: "Equipo", icon: Users },
  ];

  // Letra inicial para el Avatar estilo Google (Google Account Circle)
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "A";
  const userRoleDisplay =
    user?.role === "SUPER_ADMIN" ? "Super Administradora" : "Administradora";

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 text-zinc-100 admin-header transition-colors">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Lado Izquierdo: Botón Hamburguesa Móvil & Logo de Marca */}
        <div className="flex items-center gap-2.5">
          {/* Botón Desplegable / Colapsable para Móvil */}
          <button
            type="button"
            onClick={() => setIsNavOpen(!isNavOpen)}
            aria-expanded={isNavOpen}
            aria-controls="admin-collapsible-nav"
            aria-label={isNavOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            className="sm:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-colors"
          >
            {isNavOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>

          <Link
            href="/admin"
            aria-label={`${brandName}, ir al panel de administración`}
            className="font-serif text-xl tracking-wider text-amber-100 font-semibold hover:opacity-90 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-lg admin-logo"
          >
            {brandName}
          </Link>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 admin-badge hidden xs:inline-block">
            Admin
          </span>
        </div>

        {/* Navegación Desktop / Tablet Principal */}
        <nav
          aria-label="Navegación principal de administración"
          className="hidden sm:flex items-center gap-1"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  isActive
                    ? "bg-zinc-800 text-amber-200 admin-nav-active"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 admin-nav-inactive"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Enlaces de Acción, Selector de Tema & Avatar de Usuario (Estilo Google) */}
        <div className="flex items-center gap-2">
          {/* Alternar Tema Claro/Oscuro Accesible */}
          <AdminThemeToggle />

          {/* Enlace al Catálogo Público */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir catálogo público de la tienda en una pestaña nueva"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            title="Ver catálogo público en una nueva pestaña"
          >
            <span className="hidden md:inline">Ver tienda</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>

          {/* Botón de Cerrar Sesión Rápido Accesible */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label={loggingOut ? "Cerrando sesión..." : "Cerrar sesión de administración"}
            className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none disabled:opacity-50"
            title="Cerrar sesión"
          >
            <LogOut size={14} aria-hidden="true" />
            <span>{loggingOut ? "Saliendo..." : "Salir"}</span>
          </button>

          {/* AVATAR DE USUARIO ESTILO GOOGLE (Google Account Switcher & Popover) */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              id="admin-user-menu-button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-haspopup="dialog"
              aria-expanded={isUserMenuOpen}
              aria-label={
                user?.email
                  ? `Cuenta de ${user.email} (${userRoleDisplay}). Administrar cuenta y sesión.`
                  : `Cuenta de administración de ${brandName}`
              }
              title={user?.email ? `${user.email} (${userRoleDisplay})` : "Cuenta de Administradora"}
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-amber-400/60 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-all group"
            >
              {/* Círculo Avatar con Inicial */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center shadow-xs border border-amber-300/40 select-none">
                {userInitial}
              </div>
            </button>

            {/* Popover / Tarjeta de Perfil Estilo Google */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="dialog"
                  aria-labelledby="user-dialog-title"
                  aria-modal="true"
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 z-50 rounded-2xl bg-zinc-900 border border-zinc-700/80 p-4 shadow-2xl backdrop-blur-xl text-zinc-100 animate-in fade-in slide-in-from-top-2 space-y-4"
                >
                  {/* Encabezado: Avatar grande, email y rol */}
                  <div className="flex flex-col items-center text-center space-y-1.5 pb-3 border-b border-zinc-800">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-zinc-950 font-extrabold text-xl flex items-center justify-center shadow-md border-2 border-amber-300/60 select-none">
                      {userInitial}
                    </div>
                    <div className="space-y-0.5">
                      <h3 id="user-dialog-title" className="text-sm font-bold text-zinc-100 truncate max-w-[240px]">
                        {user?.email || "Administradora Aura"}
                      </h3>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] uppercase font-bold tracking-wider text-amber-300">
                        <Shield size={10} aria-hidden="true" />
                        <span>{userRoleDisplay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estado de la Sesión */}
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Sesión Activa</span>
                      </div>
                      {expiresInSeconds !== null && (
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                          <Clock size={11} aria-hidden="true" />
                          <span>~{Math.max(1, Math.floor(expiresInSeconds / 60))} min</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Autenticación segura por 2 horas de inactividad (BR-37).
                    </p>
                    <button
                      type="button"
                      onClick={handleRenewSession}
                      disabled={renewingSession}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-200 text-xs font-semibold transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <RefreshCw size={12} className={renewingSession ? "animate-spin" : ""} aria-hidden="true" />
                      <span>{renewingSession ? "Renovando..." : "Renovar 2 horas más"}</span>
                    </button>
                  </div>

                  {/* Enlace a gestión de equipo y perfil */}
                  <div className="space-y-1">
                    <Link
                      href="/admin/usuarios"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <User size={14} className="text-zinc-400" />
                        <span>Gestionar equipo y accesos</span>
                      </span>
                      <ArrowUpRight size={13} className="text-zinc-500" />
                    </Link>
                  </div>

                  {/* Botón de Cerrar Sesión */}
                  <div className="pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      aria-label={loggingOut ? "Cerrando sesión..." : "Cerrar sesión de administración"}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-rose-950/70 border border-zinc-700/80 hover:border-rose-700 text-zinc-300 hover:text-rose-200 font-semibold text-xs transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none disabled:opacity-50"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      <span>{loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MENÚ MÓVIL DESPLEGABLE / COLAPSABLE (Colapsible Navigation Drawer) */}
      <div
        id="admin-collapsible-nav"
        className={`sm:hidden border-t border-zinc-800 transition-all duration-300 overflow-hidden ${
          isNavOpen ? "max-h-[450px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <nav
          aria-label="Navegación móvil de administración"
          className="p-4 bg-zinc-950/98 space-y-1 backdrop-blur-xl"
        >
          {/* Tarjeta de usuario en el menú desplegable */}
          <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-zinc-950 font-bold text-sm flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-100 truncate">{user?.email || "Administradora"}</p>
              <p className="text-[10px] text-amber-300 font-medium">{userRoleDisplay}</p>
            </div>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 pt-1">
            Secciones de Administración
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsNavOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isActive
                    ? "bg-amber-200 text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 px-1">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-semibold hover:bg-zinc-800"
            >
              <span>Ver tienda</span>
              <ArrowUpRight size={13} />
            </a>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800/60 text-xs font-semibold hover:bg-rose-900/60"
            >
              <LogOut size={13} />
              <span>{loggingOut ? "Saliendo..." : "Salir"}</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
