"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LogOut, Menu, PlusCircle, Search, X } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { AdminThemeToggle } from "./AdminThemeToggle";
import { AdminMainSidebar } from "./navigation/AdminMainSidebar";
import { AdminSecondarySidebar } from "./navigation/AdminSecondarySidebar";
import { AdminMobileDrawer } from "./header/AdminMobileDrawer";
import { AdminUserMenuPopover } from "./header/AdminUserMenuPopover";
import { useAdminNav } from "./navigation/AdminNavContext";

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

  const {
    isCollapsed,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    hasSecondary,
  } = useAdminNav();

  const [brandName, setBrandName] = useState(initialBrandName || "Aura Studio");
  const [, setStoreType] = useState(initialStoreType || "Showroom");
  const [loggingOut, setLoggingOut] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [renewingSession, setRenewingSession] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const hasLoadedSessionRef = useRef(false);
  const hasLoadedBrandRef = useRef(Boolean(initialBrandName));

  // Consulta de datos de sesión del usuario logueado
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

  // Cargar sesión solo 1 vez al montar
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

  // Cargar nombre de tienda si no vino por props
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

  // Teclas rápidas: Escape para cerrar menús, '/' para buscador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsMobileDrawerOpen(false);
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setIsMobileDrawerOpen]);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/admin/productos?q=${encodeURIComponent(query)}`);
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "A";
  const userRoleDisplay =
    user?.role === "SUPER_ADMIN" ? "Superadmin" : "Administrador";

  // Cálculo de padding dinámico según estado de colapso y presencia de sidebar secundaria
  const headerDesktopPaddingClass = isCollapsed
    ? hasSecondary
      ? "md:pl-[284px]"
      : "md:pl-16"
    : hasSecondary
    ? "md:pl-[460px]"
    : "md:pl-60";

  return (
    <>
      {/* 1. Doble Sidebar para Escritorio (ADM-01) */}
      <AdminMainSidebar
        pathname={pathname}
        brandName={brandName}
        user={user}
        userInitial={userInitial}
        userRoleDisplay={userRoleDisplay}
        loggingOut={loggingOut}
        onLogout={handleLogout}
      />

      <AdminSecondarySidebar />

      {/* 2. Barra Superior Mínima */}
      <header
        className={`sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 text-zinc-100 admin-header transition-all duration-200 ${headerDesktopPaddingClass}`}
      >
        <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between gap-3">
          {/* Lado Izquierdo Móvil: Botón Hamburguesa & Marca */}
          <div className="flex items-center gap-2.5 md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              aria-expanded={isMobileDrawerOpen}
              aria-controls="admin-collapsible-nav"
              aria-label={
                isMobileDrawerOpen
                  ? "Cerrar menú de navegación"
                  : "Abrir menú de navegación"
              }
              className="p-2.5 rounded-xl text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 border border-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-colors cursor-pointer"
            >
              {isMobileDrawerOpen ? (
                <X size={18} aria-hidden="true" />
              ) : (
                <Menu size={18} aria-hidden="true" />
              )}
            </button>

            <Link
              href="/admin"
              aria-label={`${brandName}, ir al panel de administración`}
              className="font-serif text-lg tracking-wider text-zinc-100 font-bold hover:opacity-90 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-lg px-1 py-0.5"
            >
              {brandName}
            </Link>
          </div>

          {/* Lado Izquierdo Escritorio: Buscador Global */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center gap-2 flex-1 max-w-sm"
          >
            <div className="relative w-full">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos o pedidos... (Presioná /)"
                aria-label="Buscar en el catálogo y pedidos"
                className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:bg-zinc-900 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </div>
          </form>

          {/* Lado Derecho: Acciones Rápidas, Enlace Tienda, Tema y Usuario */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botón Ver Tienda Pública */}
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir catálogo público de la tienda en una pestaña nueva"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              title="Abrir tienda pública en nueva pestaña"
            >
              <span className="hidden sm:inline">Ver tienda</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>

            {/* Alternador de Tema Oscuro/Claro */}
            <AdminThemeToggle />

            {/* Menú de Usuario Popover */}
            <AdminUserMenuPopover
              brandName={brandName}
              isOpen={isUserMenuOpen}
              onToggle={() => setIsUserMenuOpen(!isUserMenuOpen)}
              onClose={() => setIsUserMenuOpen(false)}
              userEmail={user?.email}
              userInitial={userInitial}
              userRoleDisplay={userRoleDisplay}
              expiresInSeconds={expiresInSeconds}
              renewingSession={renewingSession}
              onRenewSession={handleRenewSession}
              loggingOut={loggingOut}
              onLogout={handleLogout}
            />
          </div>
        </div>

        {/* 3. Menú Móvil Desplegable */}
        <AdminMobileDrawer
          isOpen={isMobileDrawerOpen}
          pathname={pathname}
          userEmail={user?.email}
          userInitial={userInitial}
          userRoleDisplay={userRoleDisplay}
          loggingOut={loggingOut}
          onClose={() => setIsMobileDrawerOpen(false)}
          onLogout={handleLogout}
        />
      </header>
    </>
  );
}
