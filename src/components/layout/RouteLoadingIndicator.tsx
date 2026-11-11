"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Indicador visual y accesible de navegación entre rutas en el storefront (AR-11).
 * Detecta clics en enlaces locales y renderiza:
 * 1. Una barra de progreso superior de estética editorial en tono bronce (#926a3c) si la carga supera 70ms.
 * 2. Un spinner flotante con información de estado ("Cargando producto...", "Cargando catálogo...").
 * 3. Región viva aria-live="polite" y aria-busy para lectores de pantalla.
 */
export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetLabel, setTargetLabel] = useState<string>("Cargando...");
  const [progress, setProgress] = useState(0);
  const pendingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Al completarse la navegación y cambiar de ruta o parámetros, finalizamos la animación
  useEffect(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }

    if (!isNavigating) return;

    let timer: NodeJS.Timeout | undefined;
    const frame = requestAnimationFrame(() => {
      setProgress(100);
      timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [pathname, searchParams, isNavigating]);

  // Interceptar clics en enlaces locales para activar la transición si toma tiempo
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

        // No superponer spinner de storefront dentro del panel administrativo
        if (url.pathname.startsWith("/admin")) {
          return;
        }

        // Si el enlace apunta exactamente a la URL actual (pathname + search), no iniciar navegación
        const currentFullUrl = window.location.pathname + window.location.search;
        const targetFullUrl = url.pathname + url.search;
        if (currentFullUrl === targetFullUrl) {
          return;
        }

        // Si es la misma ruta y solo cambian parámetros de consulta (filtros, orden, destacados en catálogo),
        // dejamos que la transición local optimista maneje la respuesta
        if (url.pathname === window.location.pathname) {
          return;
        }

        // Definir texto descriptivo accesible según el destino
        if (url.pathname.startsWith("/p/")) {
          setTargetLabel("Cargando producto...");
        } else if (url.pathname === "/") {
          setTargetLabel("Cargando catálogo...");
        } else {
          setTargetLabel("Cargando página...");
        }

        // Debounce de 70ms: no mostrar spinner para transiciones inmediatas de caché
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = setTimeout(() => {
          setIsNavigating(true);
          setProgress(35);
        }, 70);
      } catch {
        // En caso de URL inválida, no interrumpir comportamiento nativo
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  // Animación progresiva mientras la página se descarga/renderiza
  useEffect(() => {
    if (!isNavigating) return;

    const step1 = setTimeout(() => setProgress((p) => Math.max(p, 60)), 150);
    const step2 = setTimeout(() => setProgress((p) => Math.max(p, 85)), 500);

    // Timeout de seguridad en caso de que la navegación se aborte
    const safetyTimeout = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 6000);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
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
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent pointer-events-none"
        >
          {/* Barra de progreso de acento bronce (#926a3c) */}
          <div
            className="h-full bg-gradient-to-r from-[#926a3c] via-[#b3864f] to-[#d4aa73] transition-all duration-200 ease-out shadow-xs"
            style={{
              width: `${progress}%`,
              opacity: progress === 100 ? 0 : 1,
              transitionProperty: "width, opacity",
            }}
          />

          {/* Spinner flotante accesible de esquina superior derecha */}
          {isNavigating && (
            <div className="absolute right-4 top-3 flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/95 px-3 py-1 shadow-md backdrop-blur-md transition-opacity">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#926a3c] motion-reduce:animate-none" aria-hidden="true" />
              <span className="font-serif text-[11px] font-medium tracking-wide text-stone-700">
                {targetLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
