"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Category, SYSTEM_UNCATEGORIZED_SLUG } from "../../domain/category/types";

interface CategoryNavProps {
  categories: Category[];
  activeSlug?: string;
}

export function CategoryNav({ categories, activeSlug }: CategoryNavProps) {
  const searchParams = useSearchParams();

  const createQueryString = (slug?: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (slug) {
      params.set("categoria", slug);
    } else {
      params.delete("categoria");
    }
    params.delete("pagina");
    const str = params.toString();
    return str ? `/?${str}` : "/";
  };

  // Filtrar categorías visibles del catálogo (BR-38)
  const visibleCategories = useMemo(() => {
    return (categories || []).filter(
      (cat) => !cat.isHidden && cat.slug !== SYSTEM_UNCATEGORIZED_SLUG
    );
  }, [categories]);

  // Nivel 1: Categorías raíz (parentId === null)
  const rootCategories = useMemo(() => {
    return visibleCategories.filter((cat) => cat.parentId === null);
  }, [visibleCategories]);

  // Agrupar subcategorías por parentId (Nivel 2)
  const subcategoriesByParent = useMemo(() => {
    const map = new Map<number, Category[]>();
    for (const cat of visibleCategories) {
      if (cat.parentId !== null) {
        const list = map.get(cat.parentId) || [];
        list.push(cat);
        map.set(cat.parentId, list);
      }
    }
    return map;
  }, [visibleCategories]);

  // Categoría seleccionada según el slug de la URL
  const activeCategory = useMemo(() => {
    if (!activeSlug) return null;
    return visibleCategories.find((cat) => cat.slug === activeSlug) || null;
  }, [visibleCategories, activeSlug]);

  // Categoría raíz activa (si se eligió una raíz o una de sus subcategorías hijas)
  const activeRootCategory = useMemo(() => {
    if (!activeCategory) return null;
    if (activeCategory.parentId === null) {
      return activeCategory;
    }
    return rootCategories.find((root) => root.id === activeCategory.parentId) || null;
  }, [activeCategory, rootCategories]);

  // Subcategorías a mostrar si la raíz seleccionada tiene hijas (BR-15, BR-16)
  const activeSubcategories = useMemo(() => {
    if (!activeRootCategory) return [];
    return subcategoriesByParent.get(activeRootCategory.id) || [];
  }, [activeRootCategory, subcategoriesByParent]);

  const hasSubcategories = activeSubcategories.length > 0;

  return (
    <nav
      aria-label="Filtro de categorías del catálogo"
      className="flex flex-col gap-2 py-1"
    >
      {/* Nivel 1: Categorías Principales (Raíz) */}
      <div
        role="navigation"
        aria-label="Categorías principales"
        className="flex items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-visible no-scrollbar py-1"
      >
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

        {/* Categorías principales del catálogo */}
        {rootCategories.map((root) => {
          const isDirectlyActive = activeSlug === root.slug;
          const isParentOfActive =
            !isDirectlyActive && activeRootCategory?.id === root.id;

          return (
            <Link
              key={root.id}
              href={createQueryString(root.slug)}
              aria-current={isDirectlyActive ? "page" : isParentOfActive ? "true" : undefined}
              className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full px-5 py-2 text-xs tracking-wider uppercase transition-all focus-visible:outline-2 focus-visible:outline-stone-900 ${
                isDirectlyActive
                  ? "bg-[#1c1917] font-semibold text-[#faf8f5] shadow-xs"
                  : isParentOfActive
                  ? "border-2 border-stone-900 bg-stone-900/5 font-semibold text-stone-900 shadow-2xs"
                  : "border border-[#e7e2da] bg-white/70 font-medium text-stone-700 hover:border-stone-400 hover:bg-white hover:text-stone-900"
              }`}
            >
              {root.name}
            </Link>
          );
        })}
      </div>

      {/* Nivel 2: Subcategorías contextuales cuando se selecciona una categoría padre (BR-15, BR-16) */}
      {hasSubcategories && activeRootCategory && (
        <div
          role="navigation"
          aria-label={`Subcategorías de ${activeRootCategory.name}`}
          className="flex items-center gap-1.5 overflow-x-auto md:flex-wrap md:overflow-visible no-scrollbar pt-2 pb-1 border-t border-[#e7e2da]/70 animate-in fade-in duration-200"
        >
          <span className="hidden sm:inline-flex items-center text-[10px] font-mono tracking-widest text-stone-500 uppercase pr-1 font-semibold select-none">
            {activeRootCategory.name}:
          </span>

          {/* Opción para ver todo el grupo padre (ej: "Todas las prendas") */}
          <Link
            href={createQueryString(activeRootCategory.slug)}
            aria-current={activeSlug === activeRootCategory.slug ? "page" : undefined}
            className={`inline-flex min-h-[34px] items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs transition-all focus-visible:outline-2 focus-visible:outline-stone-900 ${
              activeSlug === activeRootCategory.slug
                ? "bg-stone-900 font-semibold text-white shadow-2xs"
                : "border border-[#e7e2da] bg-white/80 font-medium text-stone-600 hover:border-stone-400 hover:bg-white hover:text-stone-900"
            }`}
          >
            Todas
          </Link>

          {/* Subcategorías hijas */}
          {activeSubcategories.map((sub) => {
            const isSubActive = activeSlug === sub.slug;
            return (
              <Link
                key={sub.id}
                href={createQueryString(sub.slug)}
                aria-current={isSubActive ? "page" : undefined}
                className={`inline-flex min-h-[34px] items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs transition-all focus-visible:outline-2 focus-visible:outline-stone-900 ${
                  isSubActive
                    ? "bg-stone-900 font-semibold text-white shadow-2xs"
                    : "border border-[#e7e2da] bg-white/80 font-medium text-stone-600 hover:border-stone-400 hover:bg-white hover:text-stone-900"
                }`}
              >
                {sub.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
