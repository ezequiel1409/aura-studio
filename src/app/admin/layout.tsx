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
      <AdminHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
