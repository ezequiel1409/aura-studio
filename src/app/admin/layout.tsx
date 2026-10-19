import type { Metadata, Viewport } from "next";
import { AdminHeader } from "../../components/admin/AdminHeader";
import { AdminLayoutFrame } from "../../components/admin/AdminLayoutFrame";
import { AdminSessionMonitor } from "../../components/admin/AdminSessionMonitor";
import { AdminThemeInitializer } from "../../components/admin/AdminThemeInitializer";

export const metadata: Metadata = {
  title: "Panel de Control",
  description: "Panel privado de administración de la tienda",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf8f5",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <AdminHeader />
      <AdminLayoutFrame>{children}</AdminLayoutFrame>
      {/* Monitor de expiración de sesión y renovación en 1 clic (BR-10, BR-37) */}
      <AdminSessionMonitor />
    </div>
  );
}
