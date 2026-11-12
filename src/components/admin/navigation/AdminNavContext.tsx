"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import {
  ADMIN_PRIMARY_NAV_ITEMS,
  AdminNavItem,
  getActiveNavGroup,
} from "../header/nav-items";

export interface AdminNavInitialUser {
  userId?: number | null;
  role?: string | null;
}

interface AdminNavContextValue {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  toggleCollapse: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (v: boolean) => void;
  activeGroup: AdminNavItem | undefined;
  hasSecondary: boolean;
  pendingOrdersCount: number;
  refreshPendingOrders: () => Promise<void>;
  isTooltipDismissed: boolean;
  dismissTooltip: () => void;
  userId?: number | null;
}

const AdminNavContext = createContext<AdminNavContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "admin_sidebar_collapsed";
const SIDEBAR_EVENT = "admin:sidebar-collapse-changed";
export const ADMIN_ORDERS_UPDATED_EVENT = "admin:orders-updated";

function subscribeCollapsed(callback: () => void) {
  window.addEventListener(SIDEBAR_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SIDEBAR_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getCollapsedSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getCollapsedServerSnapshot() {
  return false;
}

export function AdminNavProvider({
  children,
  initialUser,
  initialPendingOrdersCount,
}: {
  children: React.ReactNode;
  initialUser?: AdminNavInitialUser | null;
  initialPendingOrdersCount?: number;
}) {
  const pathname = usePathname() || "";
  const isCollapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot
  );

  // Cerrado automáticamente cada vez que cambia pathname sin usar setState en useEffect
  const [drawerOpenForPath, setDrawerOpenForPath] = useState<string | null>(null);
  const isMobileDrawerOpen = drawerOpenForPath === pathname;

  const setIsMobileDrawerOpen = useCallback(
    (open: boolean) => {
      setDrawerOpenForPath(open ? pathname : null);
    },
    [pathname]
  );

  const hasHydratedUser = initialUser !== undefined;
  const hasHydratedCount = initialPendingOrdersCount !== undefined;

  const [fetchedUserId, setFetchedUserId] = useState<number | null>(
    initialUser?.userId ?? null
  );
  const [fetchedPendingOrdersCount, setFetchedPendingOrdersCount] = useState<number>(
    initialPendingOrdersCount ?? 0
  );
  const [isTooltipDismissed, setIsTooltipDismissed] = useState<boolean>(false);

  const userId = hasHydratedUser ? (initialUser?.userId ?? null) : fetchedUserId;

  useEffect(() => {
    if (hasHydratedUser) return;
    let cancelled = false;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.authenticated && data.user?.userId) {
          setFetchedUserId(data.user.userId);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hasHydratedUser]);

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // Ignorar fallos de almacenamiento
    }
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  }, []);

  const toggleCollapse = useCallback(() => {
    const next = !getCollapsedSnapshot();
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Ignorar
    }
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  }, []);

  const dismissTooltip = useCallback(() => {
    setIsTooltipDismissed(true);
  }, []);

  // Tecla Escape para descartar tooltips y cerrar drawer móvil
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsTooltipDismissed(true);
        setDrawerOpenForPath(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reiniciar estado de dismiss cuando el mouse se mueve o se enfoca otro elemento
  useEffect(() => {
    const handlePointerMove = () => {
      if (isTooltipDismissed) {
        setIsTooltipDismissed(false);
      }
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [isTooltipDismissed]);

  // Cargar conteo de pedidos pendientes
  const refreshPendingOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders?status=PENDING&limit=50", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.orders)) {
          setFetchedPendingOrdersCount(data.orders.length);
        }
      }
    } catch {
      // Fallo no bloqueante de red
    }
  }, []);

  // Suscripción a eventos de actualización de pedidos (sin re-fetchear en cada cambio de ruta)
  useEffect(() => {
    const handleOrdersUpdated = () => {
      void refreshPendingOrders();
    };
    window.addEventListener(ADMIN_ORDERS_UPDATED_EVENT, handleOrdersUpdated);
    return () => {
      window.removeEventListener(ADMIN_ORDERS_UPDATED_EVENT, handleOrdersUpdated);
    };
  }, [refreshPendingOrders]);

  // Fallback solo si el provider se monta sin datos hidratados desde servidor
  useEffect(() => {
    if (hasHydratedCount) return;
    const isAuthRoute =
      pathname === "/admin/login" ||
      pathname === "/admin/recuperar" ||
      pathname.startsWith("/admin/restablecer");
    if (isAuthRoute) return;

    const timer = setTimeout(() => {
      void refreshPendingOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [hasHydratedCount, pathname, refreshPendingOrders]);

  const activeGroup = useMemo(() => getActiveNavGroup(pathname), [pathname]);
  const hasSecondary = useMemo(
    () => Boolean(activeGroup?.subItems && activeGroup.subItems.length > 0),
    [activeGroup]
  );

  // Asegurar que no queden imports sin usar si algo requiere el array primario
  void ADMIN_PRIMARY_NAV_ITEMS;

  const value = useMemo(
    () => ({
      isCollapsed,
      setIsCollapsed,
      toggleCollapse,
      isMobileDrawerOpen,
      setIsMobileDrawerOpen,
      activeGroup,
      hasSecondary,
      pendingOrdersCount: fetchedPendingOrdersCount,
      refreshPendingOrders,
      isTooltipDismissed,
      dismissTooltip,
      userId,
    }),
    [
      isCollapsed,
      setIsCollapsed,
      toggleCollapse,
      isMobileDrawerOpen,
      setIsMobileDrawerOpen,
      activeGroup,
      hasSecondary,
      fetchedPendingOrdersCount,
      refreshPendingOrders,
      isTooltipDismissed,
      dismissTooltip,
      userId,
    ]
  );

  return (
    <AdminNavContext.Provider value={value}>
      {children}
    </AdminNavContext.Provider>
  );
}

const defaultNavContext: AdminNavContextValue = {
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleCollapse: () => {},
  isMobileDrawerOpen: false,
  setIsMobileDrawerOpen: () => {},
  activeGroup: undefined,
  hasSecondary: false,
  pendingOrdersCount: 0,
  refreshPendingOrders: async () => {},
  isTooltipDismissed: false,
  dismissTooltip: () => {},
  userId: null,
};

export function useAdminNav() {
  const context = useContext(AdminNavContext);
  return context || defaultNavContext;
}
