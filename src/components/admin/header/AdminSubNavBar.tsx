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
    <div className="border-t border-zinc-800/80 bg-zinc-900/75 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mr-2 shrink-0 hidden md:inline">
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
            <Link
              key={sub.href}
              href={sub.href}
              aria-current={isSubActive ? "page" : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                isSubActive
                  ? "bg-zinc-800 text-amber-300 border border-amber-500/40 font-semibold shadow-2xs"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent"
              }`}
            >
              <SubIcon size={13} aria-hidden="true" />
              <span>{sub.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

