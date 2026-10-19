"use client";

import { usePathname } from "next/navigation";

export function AdminLayoutFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/admin/recuperar" ||
    pathname.startsWith("/admin/restablecer");

  return (
    <>
      <main
        id="admin-main"
        tabIndex={-1}
        className={
          isAuthRoute
            ? "flex-1 w-full flex flex-col items-center justify-center px-4 py-6 focus:outline-none min-w-0"
            : "flex-1 w-full px-4 py-6 md:py-8 md:pl-64 focus:outline-none min-w-0"
        }
      >
        <div
          className={
            isAuthRoute
              ? "w-full flex flex-col items-center justify-center my-auto"
              : "max-w-6xl mx-auto w-full"
          }
        >
          {children}
        </div>
      </main>
      <footer
        className={
          isAuthRoute
            ? "w-full py-4 text-center border-t border-zinc-800 text-xs text-zinc-500"
            : "w-full py-4 text-center border-t border-zinc-800 text-xs text-zinc-500 md:pl-64"
        }
      >
        <span>
          Creado por <strong className="font-semibold text-zinc-300">Altum</strong>
        </span>
      </footer>
    </>
  );
}
