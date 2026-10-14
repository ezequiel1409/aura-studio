"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Layers, X } from "lucide-react";
import { Category, SYSTEM_UNCATEGORIZED_SLUG } from "../../domain/category/types";

interface CategoryNavProps {
  categories: Category[];
  activeSlug?: string;
}

export function CategoryNav({ categories, activeSlug }: CategoryNavProps) {
  const searchParams = useSearchParams();
  const currentSlugFromUrl = searchParams?.get("categoria") || undefined;
  const initialSlug = activeSlug !== undefined ? activeSlug : currentSlugFromUrl;

  const [optimisticSlug, setOptimisticSlug] = useState<string | null | undefined>(undefined);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setOptimisticSlug(undefined);
  }, [searchParams]);

  const effectiveActiveSlug =
    optimisticSlug !== undefined ? (optimisticSlug || undefined) : initialSlug;

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

  // Categoría seleccionada según el slug efectivo
  const activeCategory = useMemo(() => {
    if (!effectiveActiveSlug) return null;
    return visibleCategories.find((cat) => cat.slug === effectiveActiveSlug) || null;
  }, [visibleCategories, effectiveActiveSlug]);

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
      {/* Nivel 1: Categorías Principales (Raíz) y Botón Desplegable */}
      <div
        role="navigation"
        aria-label="Categorías principales"
        className="flex items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-visible no-scrollbar py-1"
      >
        {/* Botón Desplegable / Colapsable */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          aria-expanded={isDropdownOpen}
          aria-controls="category-dropdown-panel"
          aria-label={isDropdownOpen ? "Cerrar menú de categorías" : "Desplegar todas las categorías del catálogo"}
          className={`inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all focus-visible:outline-2 focus-visible:outline-stone-900 cursor-pointer ${
            isDropdownOpen
              ? "bg-[#1c1917] text-[#faf8f5] shadow-xs"
              : "border border-[#e7e2da] bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50"
          }`}
        >
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Categorías</span>
          {isDropdownOpen ? (
            <ChevronUp className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
          )}
        </button>

        {/* Opción Todo */}
        <Link
          href={createQueryString(undefined)}
          scroll={false}
          prefetch={true}
          onClick={() => {
            setOptimisticSlug(null);
            setIsDropdownOpen(false);
          }}
          aria-current={!effectiveActiveSlug ? "page" : undefined}
          className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full px-5 py-2 text-xs tracking-wider uppercase transition-all focus-visible:outline-2 focus-visible:outline-stone-900 ${
            !effectiveActiveSlug
              ? "bg-[#1c1917] font-semibold text-[#faf8f5] shadow-xs"
              : "border border-[#e7e2da] bg-white/70 font-medium text-stone-700 hover:border-stone-400 hover:bg-white hover:text-stone-900"
          }`}
        >
          Todo
        </Link>

        {/* Categorías principales del catálogo */}
        {rootCategories.map((root) => {
          const isDirectlyActive = effectiveActiveSlug === root.slug;
          const isParentOfActive =
            !isDirectlyActive && activeRootCategory?.id === root.id;

          return (
            <Link
              key={root.id}
              href={createQueryString(root.slug)}
              scroll={false}
              prefetch={true}
              onClick={() => setOptimisticSlug(root.slug)}
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
            scroll={false}
            prefetch={true}
            onClick={() => setOptimisticSlug(activeRootCategory.slug)}
            aria-current={effectiveActiveSlug === activeRootCategory.slug ? "page" : undefined}
            className={`inline-flex min-h-[34px] items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs transition-all focus-visible:outline-2 focus-visible:outline-stone-900 ${
              effectiveActiveSlug === activeRootCategory.slug
                ? "bg-stone-900 font-semibold text-white shadow-2xs"
                : "border border-[#e7e2da] bg-white/80 font-medium text-stone-600 hover:border-stone-400 hover:bg-white hover:text-stone-900"
            }`}
          >
            Todas
          </Link>

          {/* Subcategorías hijas */}
          {activeSubcategories.map((sub) => {
            const isSubActive = effectiveActiveSlug === sub.slug;
            return (
              <Link
                key={sub.id}
                href={createQueryString(sub.slug)}
                scroll={false}
                prefetch={true}
                onClick={() => setOptimisticSlug(sub.slug)}
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

      {/* Panel Desplegable Completo de Categorías y Subcategorías */}
      {isDropdownOpen && (
        <div
          id="category-dropdown-panel"
          className="mt-1 p-4 sm:p-6 rounded-2xl border border-[#e7e2da] bg-white shadow-md animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#f0ece1] mb-4">
            <span className="font-serif text-sm font-medium text-stone-900 tracking-wide">
              Explorar Catálogo por Categorías
            </span>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(false)}
              className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Cerrar panel de categorías"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rootCategories.map((root) => {
              const subs = subcategoriesByParent.get(root.id) || [];
              const isRootActive = activeRootCategory?.id === root.id;
              return (
                <div
                  key={root.id}
                  className={`space-y-1.5 p-3 rounded-xl border transition-colors ${
                    isRootActive ? "bg-[#f5f2eb]/70 border-[#e7e2da]" : "bg-[#faf8f5]/50 border-[#e7e2da]/60"
                  }`}
                >
                  <Link
                    href={createQueryString(root.slug)}
                    scroll={false}
                    prefetch={true}
                    onClick={() => {
                      setOptimisticSlug(root.slug);
                      setIsDropdownOpen(false);
                    }}
                    className={`block font-sans text-xs font-bold uppercase tracking-wider transition-colors hover:text-amber-900 ${
                      effectiveActiveSlug === root.slug ? "text-stone-900 underline underline-offset-4" : "text-stone-800"
                    }`}
                  >
                    {root.name} →
                  </Link>

                  {subs.length > 0 && (
                    <ul className="space-y-1 pl-1 pt-1 list-none m-0">
                      {subs.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={createQueryString(sub.slug)}
                            scroll={false}
                            prefetch={true}
                            onClick={() => {
                              setOptimisticSlug(sub.slug);
                              setIsDropdownOpen(false);
                            }}
                            className={`block text-xs py-0.5 transition-colors hover:text-stone-900 ${
                              effectiveActiveSlug === sub.slug
                                ? "font-semibold text-stone-900 underline"
                                : "text-stone-600"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
