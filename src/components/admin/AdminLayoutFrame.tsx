"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { isSubNavItemActive } from "./header/nav-items";
import { useAdminNav } from "./navigation/AdminNavContext";

export function AdminLayoutFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams ? searchParams.toString() : "";

  const isAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/admin/recuperar" ||
    pathname.startsWith("/admin/restablecer");

  const { isCollapsed, hasSecondary, activeGroup } = useAdminNav();

  const desktopPaddingClass = isCollapsed
    ? hasSecondary
      ? "md:pl-[284px]"
      : "md:pl-16"
    : hasSecondary
    ? "md:pl-[460px]"
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
          {/* Navegación secundaria móvil (pestañas superiores en pantallas angostas - ADM-01) */}
          {!isAuthRoute && hasSecondary && activeGroup?.subItems && (
            <div className="md:hidden mb-6 -mt-2 pb-2 border-b border-zinc-800">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-amber-300 mb-1.5">
                {activeGroup.label}
              </span>
              <nav
                aria-label={`Subsecciones de ${activeGroup.label}`}
                className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1"
              >
                {activeGroup.subItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isActive = isSubNavItemActive(
                    pathname,
                    searchParamsString,
                    sub
                  );

                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                        isActive
                          ? "bg-amber-300 text-zinc-950 font-bold shadow-xs"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
                      }`}
                    >
                      <SubIcon size={13} aria-hidden="true" />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </nav>
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
          Creado por <strong className="font-semibold text-zinc-300">Altum</strong>
        </span>
      </footer>
    </>
  );
}
