"use client";

import { useLayoutEffect, useEffect } from "react";

// useLayoutEffect en cliente, useEffect seguro en SSR
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function AdminThemeInitializer() {
  useIsomorphicLayoutEffect(() => {
    try {
      const t = localStorage.getItem("aura_admin_theme") || "light";
      const el = document.getElementById("admin-layout-root");
      if (el) {
        el.setAttribute("data-theme", t);
      }
      document.documentElement.setAttribute("data-admin-theme", t);
    } catch {}
  }, []);

  return null;
}

