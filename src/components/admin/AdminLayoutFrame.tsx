"use client";

import { usePathname } from "next/navigation";
import { useAdminNav } from "./navigation/AdminNavContext";
import { AdminSectionTabs } from "./navigation/AdminSectionTabs";
import { AdminWhatsNewBanner } from "./onboarding/AdminWhatsNewBanner";

export function AdminLayoutFrame({
  children,
  operatorName,
}: {
  children: React.ReactNode;
  operatorName?: string | null;
}) {
  const pathname = usePathname() || "";

  const isAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/admin/recuperar" ||
    pathname.startsWith("/admin/restablecer");

  const { isCollapsed, hasSecondary, activeGroup } = useAdminNav();

  const desktopPaddingClass = isCollapsed
    ? hasSecondary
      ? "md:pl-16 lg:pl-[284px]"
      : "md:pl-16"
    : hasSecondary
    ? "md:pl-60 lg:pl-[460px]"
    : "md:pl-60";

  return (
    <>
      <main
        id="admin-main"
        tabIndex={-1}
        className={
          isAuthRoute
            ? "flex-1 w-full flex flex-col items-center justify-center px-4 py-6 focus:outline-none min-w-0"
            : `flex-1 w-full px-4 py-6 md:py-8 focus:outline-none min-w-0 transition-all duration-200 ${desktopPaddingClass}`
        }
      >
        <div
          className={
            isAuthRoute
              ? "w-full flex flex-col items-center justify-center my-auto"
              : "max-w-6xl mx-auto w-full"
          }
        >
          {!isAuthRoute && <AdminWhatsNewBanner />}

          {/* Navegación secundaria móvil y tablet (pestañas persistentes hasta 1023px) */}
          {!isAuthRoute && hasSecondary && activeGroup?.subItems && (
            <div className="lg:hidden mb-6 -mt-2 pb-2 border-b border-zinc-800">
              <AdminSectionTabs group={activeGroup} pathname={pathname} />
            </div>
          )}

          {children}
        </div>
      </main>

      <footer
        className={
          isAuthRoute
            ? "w-full py-4 text-center border-t border-zinc-800 text-xs text-zinc-500"
            : `w-full py-4 text-center border-t border-zinc-800 text-xs text-zinc-500 transition-all duration-200 ${desktopPaddingClass}`
        }
      >
        <span>
          {operatorName ? `Panel de Gestión · ${operatorName}` : "Panel de Gestión"}
        </span>
      </footer>
    </>
  );
}
