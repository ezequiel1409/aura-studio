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

  // Preserva parámetros existentes al cambiar de categoría (BR-22)
  const createQueryString = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("categoria", slug);
    } else {
      params.delete("categoria");
    }
    // Al cambiar de categoría volvemos a la página 1
    params.delete("pagina");
    const str = params.toString();
    return str ? `/?${str}` : "/";
  };

  return (
    <nav className="w-full overflow-x-auto no-scrollbar py-2.5">
      <div className="flex items-center gap-2 px-4 sm:px-0">
        {/* Opción Todo */}
        <Link
          href={createQueryString(undefined)}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            !activeSlug
              ? "bg-stone-900 text-stone-50 shadow-sm"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
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
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-stone-900 text-stone-50 shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
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

