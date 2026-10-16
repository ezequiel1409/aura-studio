"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useBackofficeStore } from "../../stores/backoffice.store";

export function AdminThemeToggle() {
  const { theme, toggleTheme, setTheme } = useBackofficeStore();
  const [mounted, setMounted] = useState(false);

  // Sincronizar tema persistido en localStorage al montar en cliente
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("aura_admin_theme");
      if (stored === "dark" || stored === "light") {
        setTheme(stored);
      }
    } catch {}
  }, [setTheme]);

  const isDark = mounted ? theme === "dark" : false;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Cambiar a modo claro editorial" : "Cambiar a modo oscuro accesible"}
      title={isDark ? "Cambiar a modo claro editorial" : "Cambiar a modo oscuro accesible"}
      className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-zinc-100 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none admin-theme-toggle-btn cursor-pointer"
    >
      {isDark ? (
        <>
          <Sun size={15} className="text-amber-300 shrink-0" aria-hidden="true" />
          <span className="hidden md:inline">Claro</span>
        </>
      ) : (
        <>
          <Moon size={15} className="text-amber-300 shrink-0" aria-hidden="true" />
          <span className="hidden md:inline">Oscuro</span>
        </>
      )}
    </button>
  );
}
