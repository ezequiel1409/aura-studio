import type { Metadata } from "next";
import { AdminHeader } from "../../components/admin/AdminHeader";

export const metadata: Metadata = {
  title: "Aura Studio · Panel de Control",
  description: "Panel privado de administración de Aura Studio",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-900 selection:text-amber-100">
      {/* Enlace accesible para saltar directo al contenido con teclado o lector de pantalla */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-amber-300 focus:text-zinc-950 focus:font-bold focus:text-xs focus:rounded-xl focus:shadow-2xl focus:ring-2 focus:ring-zinc-950 focus:outline-none transition-all"
      >
        Saltar al contenido principal
      </a>
      <AdminHeader />
      <main
        id="admin-main"
        tabIndex={-1}
        className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 md:py-8 focus:outline-none"
      >
        {children}
      </main>
    </div>
  );
}
