"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { AdminThemeToggle } from "./AdminThemeToggle";
import { AdminDesktopNav } from "./header/AdminDesktopNav";
import { AdminSubNavBar } from "./header/AdminSubNavBar";
import { AdminMobileDrawer } from "./header/AdminMobileDrawer";
import { AdminUserMenuPopover } from "./header/AdminUserMenuPopover";

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
  const [, setStoreType] = useState(initialStoreType || "Showroom");
  const [loggingOut, setLoggingOut] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [renewingSession, setRenewingSession] = useState(false);

  const hasLoadedSessionRef = useRef(false);
  const hasLoadedBrandRef = useRef(Boolean(initialBrandName));

  // Consulta de datos de sesión del usuario logueado (BR-10, BR-37)
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setExpiresInSeconds(data.expiresInSeconds);
          hasLoadedSessionRef.current = true;
        }
      }
    } catch {
      // Ignorar fallas momentáneas de red
    }
  }, []);

  // Cargar sesión solo 1 vez al montar (o tras login), evitando fetches repetidos en cada cambio de pestaña
  useEffect(() => {
    const isAuthRoute =
      pathname === "/admin/login" ||
      pathname === "/admin/recuperar" ||
      pathname.startsWith("/admin/restablecer");

    if (isAuthRoute) {
      hasLoadedSessionRef.current = false;
      return;
    }

    if (!hasLoadedSessionRef.current) {
      fetchSession();
    }
  }, [pathname, fetchSession]);

  // Cargar nombre de tienda solo 1 vez si no vino por props
  useEffect(() => {
    if (!hasLoadedBrandRef.current) {
      hasLoadedBrandRef.current = true;
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

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setIsNavOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Cerrar popover con tecla Escape
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
      hasLoadedSessionRef.current = false;
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

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "A";
  const userRoleDisplay =
    user?.role === "SUPER_ADMIN" ? "Super Administradora" : "Administradora";

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 text-zinc-100 admin-header transition-colors">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Lado Izquierdo: Botón Hamburguesa Móvil & Logo de Marca */}
        <div className="flex items-center gap-2.5">
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
        <AdminDesktopNav pathname={pathname} />

        {/* Enlaces de Acción, Selector de Tema & Avatar de Usuario */}
        <div className="flex items-center gap-2">
          <AdminThemeToggle />

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

          <AdminUserMenuPopover
            isOpen={isUserMenuOpen}
            brandName={brandName}
            userEmail={user?.email}
            userInitial={userInitial}
            userRoleDisplay={userRoleDisplay}
            expiresInSeconds={expiresInSeconds}
            renewingSession={renewingSession}
            loggingOut={loggingOut}
            onToggle={() => setIsUserMenuOpen(!isUserMenuOpen)}
            onClose={() => setIsUserMenuOpen(false)}
            onRenewSession={handleRenewSession}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Barra Secundaria Contextual (Sub-secciones de Catálogo o Tienda y Ajustes) */}
      <AdminSubNavBar pathname={pathname} />

      {/* Menú Móvil Desplegable */}
      <AdminMobileDrawer
        isOpen={isNavOpen}
        pathname={pathname}
        userEmail={user?.email}
        userInitial={userInitial}
        userRoleDisplay={userRoleDisplay}
        loggingOut={loggingOut}
        onClose={() => setIsNavOpen(false)}
        onLogout={handleLogout}
      />
    </header>
  );
}
