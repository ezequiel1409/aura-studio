"use client";

import { usePathname } from "next/navigation";
import { useEffect, memo } from "react";

interface StoreShellProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  cart: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Componente micro-aislado para restaurar el scroll suavemente al cambiar de ruta.
 * Al estar aislado en un subcomponente que no devuelve DOM, StoreShell y sus componentes
 * persistentes (Header, Footer, Cart) NO sufren re-renderizados cuando la usuaria navega.
 */
function NavigationScrollRestorer() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname.startsWith("/admin") && typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname]);

  return null;
}

/**
 * Contenedor memoizado para los elementos de cabecera, pie y carrito.
 * Previene que React reconcilie o destruya estos árboles cuando el contenido dinámico ({children}) cambia.
 */
const PersistentSlot = memo(function PersistentSlot({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
});

/**
 * Shell compartido persistente para el Storefront público.
 *
 * Mantiene montados el Header, Footer, Drawer del Carrito y Notificaciones
 * entre navegaciones del catálogo y fichas de producto sin destruirlos ni rehidratarlos.
 * Se desactiva automáticamente al navegar al panel administrativo (/admin).
 */
export function StoreShell({
  header,
  footer,
  cart,
  children,
}: StoreShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] flex flex-col">
      <NavigationScrollRestorer />
      <PersistentSlot>{header}</PersistentSlot>
      <div className="flex-1 flex flex-col">{children}</div>
      <PersistentSlot>{cart}</PersistentSlot>
      <PersistentSlot>{footer}</PersistentSlot>
    </div>
  );
}
