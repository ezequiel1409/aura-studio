"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  ADMIN_PRIMARY_NAV_ITEMS,
  AdminNavItem,
  getActiveNavGroup,
} from "../header/nav-items";

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
}

const AdminNavContext = createContext<AdminNavContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "admin_sidebar_collapsed";

export function AdminNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [isTooltipDismissed, setIsTooltipDismissed] = useState<boolean>(false);

  // Cargar estado colapsado desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") {
        setIsCollapsedState(true);
      }
    } catch {
      // Entornos sin acceso a localStorage
    }
  }, []);

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // Ignorar fallos de almacenamiento
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignorar
      }
      return next;
    });
  }, []);

  const dismissTooltip = useCallback(() => {
    setIsTooltipDismissed(true);
  }, []);

  // Tecla Escape para descartar tooltips y cerrar drawer móvil
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsTooltipDismissed(true);
        setIsMobileDrawerOpen(false);
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

  // Cerrar drawer móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Cargar conteo de pedidos pendientes
  const refreshPendingOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders?status=PENDING&limit=50", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.orders)) {
          setPendingOrdersCount(data.orders.length);
        }
      }
    } catch {
      // Fallo no bloqueante de red
    }
  }, []);

  useEffect(() => {
    const isAuthRoute =
      pathname === "/admin/login" ||
      pathname === "/admin/recuperar" ||
      pathname.startsWith("/admin/restablecer");

    if (!isAuthRoute) {
      refreshPendingOrders();
    }
  }, [pathname, refreshPendingOrders]);

  const activeGroup = useMemo(() => getActiveNavGroup(pathname), [pathname]);
  const hasSecondary = useMemo(
    () => Boolean(activeGroup?.subItems && activeGroup.subItems.length > 0),
    [activeGroup]
  );

  const value = useMemo(
    () => ({
      isCollapsed,
      setIsCollapsed,
      toggleCollapse,
      isMobileDrawerOpen,
      setIsMobileDrawerOpen,
      activeGroup,
      hasSecondary,
      pendingOrdersCount,
      refreshPendingOrders,
      isTooltipDismissed,
      dismissTooltip,
    }),
    [
      isCollapsed,
      setIsCollapsed,
      toggleCollapse,
      isMobileDrawerOpen,
      setIsMobileDrawerOpen,
      activeGroup,
      hasSecondary,
      pendingOrdersCount,
      refreshPendingOrders,
      isTooltipDismissed,
      dismissTooltip,
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
};

export function useAdminNav() {
  const context = useContext(AdminNavContext);
  return context || defaultNavContext;
}
