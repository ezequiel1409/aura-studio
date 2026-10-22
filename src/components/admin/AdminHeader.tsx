"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, LogOut, Menu, PauseCircle, PlayCircle, PlusCircle, Search, X } from "lucide-react";
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
  const [ordersPaused, setOrdersPaused] = useState(false);
  const [ordersPausedNotice, setOrdersPausedNotice] = useState("");
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [modalNoticeInput, setModalNoticeInput] = useState("");
  const [updatingPauseStatus, setUpdatingPauseStatus] = useState(false);
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

  // Cargar estado de pausa de ventas
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) {
          setOrdersPaused(Boolean(data.settings.ordersPaused));
          if (data.settings.ordersPausedNotice) {
            setOrdersPausedNotice(data.settings.ordersPausedNotice);
            setModalNoticeInput(data.settings.ordersPausedNotice);
          } else {
            setModalNoticeInput("Estamos realizando balance de stock. Las compras online se reanudan en breve.");
          }
        }
      })
      .catch(() => {});
  }, []);

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

  const handleResumeSales = async () => {
    if (updatingPauseStatus) return;
    setUpdatingPauseStatus(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordersPaused: false }),
      });
      if (res.ok) {
        setOrdersPaused(false);
      }
    } finally {
      setUpdatingPauseStatus(false);
    }
  };

  const handleConfirmPause = async () => {
    if (updatingPauseStatus) return;
    setUpdatingPauseStatus(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ordersPaused: true,
          ordersPausedNotice: modalNoticeInput.trim() || undefined,
        }),
      });
      if (res.ok) {
        setOrdersPaused(true);
        setOrdersPausedNotice(modalNoticeInput.trim());
        setIsPauseModalOpen(false);
      }
    } finally {
      setUpdatingPauseStatus(false);
    }
  };

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
            {/* Botón Kill-Switch: Pausar o Reanudar Ventas */}
            <button
              type="button"
              disabled={updatingPauseStatus}
              onClick={() => (ordersPaused ? handleResumeSales() : setIsPauseModalOpen(true))}
              title={
                ordersPaused
                  ? "Las ventas online están pausadas. Clic para reanudar."
                  : "La tienda está activa y recibiendo pedidos. Clic para pausar."
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                ordersPaused
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              {updatingPauseStatus ? (
                <Loader2 size={13} className="animate-spin text-zinc-400" />
              ) : ordersPaused ? (
                <>
                  <PauseCircle size={14} className="shrink-0 text-rose-400" />
                  <span className="hidden sm:inline">Ventas pausadas</span>
                  <span className="text-[10px] font-bold uppercase underline tracking-wider ml-0.5">Reanudar</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="hidden sm:inline">Tienda activa</span>
                </>
              )}
            </button>

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
        {/* Banner persistente de aviso si la tienda está en pausa */}
        {ordersPaused && (
          <div className="bg-rose-950/80 border-t border-rose-800/80 text-rose-200 px-4 md:px-6 py-2 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
              <span className="truncate">
                <strong>Atención:</strong> Las ventas online se encuentran <strong>pausadas</strong>. Los clientes no pueden confirmar órdenes.
              </span>
            </div>
            <button
              type="button"
              disabled={updatingPauseStatus}
              onClick={handleResumeSales}
              className="px-3 py-1 rounded-lg bg-rose-400 hover:bg-rose-300 text-zinc-950 font-bold text-[11px] uppercase tracking-wider transition-colors shrink-0 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {updatingPauseStatus ? "Reanudando..." : "Reanudar ventas"}
            </button>
          </div>
        )}
      </header>

      {/* Modal interactivo para pausar ventas con mensaje personalizado */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <PauseCircle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-100">
                  ¿Pausar ventas en la tienda?
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Los clientes podrán seguir viendo el catálogo en modo escaparate, pero se deshabilitará el checkout.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Mensaje para los clientes en la tienda:
              </label>
              <textarea
                rows={3}
                value={modalNoticeInput}
                onChange={(e) => setModalNoticeInput(e.target.value)}
                placeholder="ej: Estamos realizando balance de inventario. Las compras se reanudarán en breve."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={updatingPauseStatus}
                onClick={() => setIsPauseModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={updatingPauseStatus}
                onClick={handleConfirmPause}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {updatingPauseStatus && <Loader2 size={13} className="animate-spin" />}
                <span>Confirmar y Pausar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
