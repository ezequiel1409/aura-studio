"use client";

import type { AdminShellData } from "../../infra/auth/dal";
import { AdminHeader } from "./AdminHeader";
import { AdminLayoutFrame } from "./AdminLayoutFrame";
import { AdminSessionMonitor } from "./AdminSessionMonitor";
import { AdminThemeInitializer } from "./AdminThemeInitializer";
import { AdminNavProvider } from "./navigation/AdminNavContext";

interface AdminShellProps {
  initialData: AdminShellData;
  children: React.ReactNode;
}

export function AdminShell({ initialData, children }: AdminShellProps) {
  const authKey = initialData.session
    ? `auth-${initialData.session.userId ?? "admin"}`
    : "anon";

  return (
    <div
      id="admin-layout-root"
      data-theme="light"
      className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col font-sans selection:bg-amber-800 selection:text-amber-50 transition-colors"
    >
      {/* Sincronización de tema accesible sin script tag en el árbol de React */}
      <AdminThemeInitializer />
      {/* Enlace accesible para saltar directo al contenido con teclado o lector de pantalla */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-amber-300 focus:text-zinc-950 focus:font-bold focus:text-xs focus:rounded-xl focus:shadow-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
      >
        Saltar al contenido principal
      </a>
      <AdminNavProvider
        key={authKey}
        initialUser={initialData.session}
        initialPendingOrdersCount={initialData.pendingOrdersCount}
      >
        <AdminHeader
          brandName={initialData.brandName}
          storeType={initialData.storeType}
          logoUrl={initialData.logoUrl}
          initialSession={initialData.session}
          initialOrdersPaused={initialData.ordersPaused}
          initialOrdersPausedNotice={initialData.ordersPausedNotice}
          hasServerData
        />
        <AdminLayoutFrame operatorName={initialData.operatorName}>
          {children}
        </AdminLayoutFrame>
      </AdminNavProvider>
      {/* Monitor de expiración de sesión y renovación en 1 clic (BR-10, BR-37) */}
      <AdminSessionMonitor
        key={`session-${initialData.session?.expiresAtMs ?? "none"}`}
        initialSession={initialData.session}
      />
    </div>
  );
}
