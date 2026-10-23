"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getActiveNavGroup } from "./nav-items";

interface AdminSubNavBarProps {
  pathname: string;
}

export function AdminSubNavBar({ pathname }: AdminSubNavBarProps) {
  const searchParams = useSearchParams();
  const activeGroup = getActiveNavGroup(pathname);

  if (!activeGroup || !activeGroup.subItems || activeGroup.subItems.length === 0) {
    return null;
  }

  const currentSeccion = searchParams.get("seccion") || "top";

  return (
    <div className="border-t border-zinc-800 bg-zinc-900/90 backdrop-blur-md">
      <div
        role="navigation"
        aria-label={`Sub-secciones de ${activeGroup.label}`}
        className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mr-1.5 shrink-0 hidden md:inline">
          {activeGroup.label}:
        </span>

        {activeGroup.subItems.map((sub) => {
          const SubIcon = sub.icon;
          let isSubActive = false;

          if (sub.tabParam) {
            isSubActive =
              pathname === "/admin/configuracion" && currentSeccion === sub.tabParam;
          } else if (sub.exact) {
            isSubActive = pathname === sub.href;
          } else {
            isSubActive = pathname.startsWith(sub.href);
          }

          return (
            <Link prefetch={false}
              key={sub.href}
              href={sub.href}
              aria-current={isSubActive ? "page" : undefined}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                isSubActive
                  ? "bg-amber-200 text-zinc-950 font-bold shadow-xs admin-nav-active"
                  : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent admin-nav-inactive"
              }`}
            >
              <SubIcon size={14} aria-hidden="true" />
              <span>{sub.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
