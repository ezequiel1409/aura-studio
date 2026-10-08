"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Category } from "../../domain/category/types";

interface CategoryNavProps {
  categories: Category[];
  activeSlug?: string;
}

export function CategoryNav({ categories, activeSlug }: CategoryNavProps) {
  const searchParams = useSearchParams();

  const createQueryString = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("categoria", slug);
    } else {
      params.delete("categoria");
    }
    params.delete("pagina");
    const str = params.toString();
    return str ? `/?${str}` : "/";
  };

  return (
    <nav
      aria-label="Filtro de categorías"
      className="w-full overflow-x-auto no-scrollbar py-2"
    >
      <div className="flex items-center gap-2 px-1 py-1">
        {/* Opción Todo */}
        <Link
          href={createQueryString(undefined)}
          aria-current={!activeSlug ? "page" : undefined}
          className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full px-5 py-2 text-xs tracking-wider uppercase transition-all focus-visible:outline-2 focus-visible:outline-stone-900 ${
            !activeSlug
              ? "bg-[#1c1917] font-semibold text-[#faf8f5] shadow-xs"
              : "border border-[#e7e2da] bg-white/70 font-medium text-stone-700 hover:border-stone-400 hover:bg-white hover:text-stone-900"
          }`}
        >
          Todo
        </Link>

        {/* Categorías visibles (BR-38) */}
        {categories
          .filter((cat) => !cat.isHidden && cat.slug !== "sin-clasificar")
          .map((cat) => {
            const isActive = activeSlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={createQueryString(cat.slug)}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full px-5 py-2 text-xs tracking-wider uppercase transition-all focus-visible:outline-2 focus-visible:outline-stone-900 ${
                  isActive
                    ? "bg-[#1c1917] font-semibold text-[#faf8f5] shadow-xs"
                    : "border border-[#e7e2da] bg-white/70 font-medium text-stone-700 hover:border-stone-400 hover:bg-white hover:text-stone-900"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
