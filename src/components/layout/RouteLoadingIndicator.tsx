"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Indicador visual y accesible de navegación entre rutas en Aura Studio (AR-11).
 * Detecta clics en enlaces locales y renderiza:
 * 1. Una barra de progreso superior de estética editorial en tono bronce (#926a3c).
 * 2. Un spinner flotante con información de estado ("Cargando prenda...", "Cargando catálogo...").
 * 3. Región viva aria-live="polite" y aria-busy para lectores de pantalla.
 */
export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetLabel, setTargetLabel] = useState<string>("Cargando...");
  const [progress, setProgress] = useState(0);

  // Al completarse la navegación y cambiar de ruta o parámetros, finalizamos la animación
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Interceptar clics en enlaces locales para activar la transición inmediata
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Ignorar clics secundarios (click derecho/central) o con teclas modificadoras
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey
      ) {
        return;
      }

      // Buscar si el objetivo o sus ancestros corresponden a una etiqueta <a>
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const targetAttr = anchor.getAttribute("target");

      // Ignorar descargas, enlaces a nueva ventana o externos
      if (!href || targetAttr === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      // Ignorar anclas internas (#id) en la misma página
      if (href.startsWith("#")) {
        return;
      }

      // Comprobar si es un enlace interno de la aplicación
      try {
        const url = new URL(anchor.href, window.location.href);
        const isInternal = url.origin === window.location.origin;

        if (!isInternal) {
          return;
        }

        // Si el enlace apunta exactamente a la URL actual (pathname + search), no iniciar navegación
        const currentFullUrl = window.location.pathname + window.location.search;
        const targetFullUrl = url.pathname + url.search;
        if (currentFullUrl === targetFullUrl) {
          return;
        }

        // Definir texto descriptivo accesible según el destino
        if (url.pathname.startsWith("/p/")) {
          setTargetLabel("Cargando prenda...");
        } else if (url.pathname === "/") {
          setTargetLabel("Cargando catálogo...");
        } else {
          setTargetLabel("Cargando página...");
        }

        // Iniciar estado visual de navegación
        setIsNavigating(true);
        setProgress(30);
      } catch {
        // En caso de URL inválida, no interrumpir comportamiento nativo
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  // Animación progresiva mientras la página se descarga/renderiza
  useEffect(() => {
    if (!isNavigating) return;

    const step1 = setTimeout(() => setProgress((p) => Math.max(p, 55)), 120);
    const step2 = setTimeout(() => setProgress((p) => Math.max(p, 80)), 450);
    const step3 = setTimeout(() => setProgress((p) => Math.max(p, 92)), 1100);

    // Timeout de seguridad en caso de que la navegación se aborte
    const safetyTimeout = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 8000);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(safetyTimeout);
    };
  }, [isNavigating]);

  return (
    <>
      {/* Región accesible aria-live para lectores de pantalla */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isNavigating ? targetLabel : progress === 100 ? "Navegación completada" : ""}
      </div>

      {/* Interfaz visual de carga */}
      {(isNavigating || progress > 0) && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={targetLabel}
          aria-busy={isNavigating}
          className="pointer-events-none fixed inset-x-0 top-0 z-50 select-none"
        >
          {/* Barra de progreso superior editorial */}
          <div className="h-[3px] w-full bg-transparent overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#926a3c] via-[#b68c59] to-[#73512b] shadow-xs transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                opacity: progress === 100 ? 0 : 1,
                transitionProperty: "width, opacity",
              }}
            />
          </div>

          {/* Spinner flotante sutil con insignia de estado */}
          {isNavigating && (
            <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 rounded-full border border-[#e7e2da] bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md transition-all motion-reduce:transition-none">
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-[#926a3c] motion-reduce:animate-none"
                aria-hidden="true"
              />
              <span className="font-serif text-xs font-medium text-stone-800">
                {targetLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
