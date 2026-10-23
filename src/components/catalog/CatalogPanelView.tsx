"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  CatalogFacets,
  Product,
  ProductSortOption,
} from "../../domain/product/types";
import { Category } from "../../domain/category/types";
import { ProductAttributeDefinition } from "../../domain/navigation/types";
import { ProductCard } from "./ProductCard";

export interface ActiveCatalogFilters {
  q?: string;
  categoria?: string;
  talles: string[];
  colores: string[];
  minPrecio?: string;
  maxPrecio?: string;
  disponible: boolean;
  oferta: boolean;
  atributos: Record<string, string[]>;
  orden: ProductSortOption;
  pagina: number;
}

export interface CatalogPanelViewProps {
  title: string;
  subtitle?: string | null;
  breadcrumbLabel: string;
  products: Product[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  facets: CatalogFacets;
  categories: Category[];
  attributeDefinitions: ProductAttributeDefinition[];
  enabledFilters: string[];
  activeFilters: ActiveCatalogFilters;
  defaultSort: ProductSortOption;
  lockedSectionRuleType?: string;
}

export function CatalogPanelView({
  title,
  subtitle,
  breadcrumbLabel,
  products,
  totalCount,
  pageSize,
  currentPage,
  facets,
  categories,
  attributeDefinitions,
  enabledFilters,
  activeFilters,
  defaultSort,
  lockedSectionRuleType,
}: CatalogPanelViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Control de grupos plegables en la barra lateral
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    {}
  );

  // Estado para hoja inferior móvil (en celular se aplica con botón "Aplicar")
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<ActiveCatalogFilters>(activeFilters);

  // Estado local de inputs de rango de precio (escritorio)
  const [minPriceInput, setMinPriceInput] = useState(
    activeFilters.minPrecio || ""
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    activeFilters.maxPrecio || ""
  );

  // Gestión de foco accesible al cargar más productos
  const prevProductCountRef = useRef<number>(products.length);
  const shouldFocusNewBatchRef = useRef<boolean>(false);

  useEffect(() => {
    setDraftFilters(activeFilters);
    setMinPriceInput(activeFilters.minPrecio || "");
    setMaxPriceInput(activeFilters.maxPrecio || "");
  }, [activeFilters]);

  useEffect(() => {
    if (
      shouldFocusNewBatchRef.current &&
      products.length > prevProductCountRef.current
    ) {
      const targetId = `catalog-item-${prevProductCountRef.current}`;
      const el = document.getElementById(targetId);
      if (el) {
        el.focus({ preventScroll: false });
      }
      shouldFocusNewBatchRef.current = false;
    }
    prevProductCountRef.current = products.length;
  }, [products.length]);

  const buildUrlWithFilters = (next: ActiveCatalogFilters): string => {
    const params = new URLSearchParams();
    if (next.q?.trim()) params.set("q", next.q.trim());
    if (next.categoria) params.set("categoria", next.categoria);
    if (next.talles.length > 0) params.set("talle", next.talles.join(","));
    if (next.colores.length > 0) params.set("color", next.colores.join(","));
    if (next.minPrecio?.trim()) params.set("min", next.minPrecio.trim());
    if (next.maxPrecio?.trim()) params.set("max", next.maxPrecio.trim());
    if (next.disponible) params.set("disponible", "1");
    if (next.oferta) params.set("oferta", "1");

    for (const [attrKey, vals] of Object.entries(next.atributos)) {
      if (vals && vals.length > 0) {
        params.set(`attr_${attrKey}`, vals.join(","));
      }
    }

    if (next.orden && next.orden !== defaultSort) {
      params.set("orden", next.orden);
    }
    if (next.pagina > 1) {
      params.set("pagina", String(next.pagina));
    }

    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const applyFiltersDesktop = (next: ActiveCatalogFilters) => {
    const resetPage = { ...next, pagina: 1 };
    startTransition(() => {
      router.push(buildUrlWithFilters(resetPage), { scroll: false });
    });
  };

  const handleLoadMore = () => {
    shouldFocusNewBatchRef.current = true;
    const nextUrl = buildUrlWithFilters({
      ...activeFilters,
      pagina: currentPage + 1,
    });
    startTransition(() => {
      router.push(nextUrl, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    const clean: ActiveCatalogFilters = {
      q: undefined,
      categoria: undefined,
      talles: [],
      colores: [],
      minPrecio: undefined,
      maxPrecio: undefined,
      disponible: false,
      oferta: false,
      atributos: {},
      orden: defaultSort,
      pagina: 1,
    };
    setDraftFilters(clean);
    setMinPriceInput("");
    setMaxPriceInput("");
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  // Chips de filtros activos
  const activeChips: Array<{ id: string; label: string; onRemove: () => void }> =
    [];

  if (activeFilters.q) {
    activeChips.push({
      id: "q",
      label: `Búsqueda: "${activeFilters.q}"`,
      onRemove: () => applyFiltersDesktop({ ...activeFilters, q: undefined }),
    });
  }

  if (activeFilters.categoria) {
    const catObj = categories.find((c) => c.slug === activeFilters.categoria);
    activeChips.push({
      id: `cat-${activeFilters.categoria}`,
      label: `Categoría: ${catObj?.name || activeFilters.categoria}`,
      onRemove: () =>
        applyFiltersDesktop({ ...activeFilters, categoria: undefined }),
    });
  }

  for (const sz of activeFilters.talles) {
    activeChips.push({
      id: `sz-${sz}`,
      label: `Talle ${sz}`,
      onRemove: () =>
        applyFiltersDesktop({
          ...activeFilters,
          talles: activeFilters.talles.filter((s) => s !== sz),
        }),
    });
  }

  for (const col of activeFilters.colores) {
    activeChips.push({
      id: `col-${col}`,
      label: `Color: ${col}`,
      onRemove: () =>
        applyFiltersDesktop({
          ...activeFilters,
          colores: activeFilters.colores.filter((c) => c !== col),
        }),
    });
  }

  if (activeFilters.minPrecio || activeFilters.maxPrecio) {
    const minLbl = activeFilters.minPrecio
      ? `$${activeFilters.minPrecio}`
      : "$0";
    const maxLbl = activeFilters.maxPrecio
      ? `$${activeFilters.maxPrecio}`
      : "Sin tope";
    activeChips.push({
      id: "price",
      label: `Precio: ${minLbl} – ${maxLbl}`,
      onRemove: () =>
        applyFiltersDesktop({
          ...activeFilters,
          minPrecio: undefined,
          maxPrecio: undefined,
        }),
    });
  }

  if (activeFilters.disponible) {
    activeChips.push({
      id: "avail",
      label: "Solo disponibles",
      onRemove: () =>
        applyFiltersDesktop({ ...activeFilters, disponible: false }),
    });
  }

  if (activeFilters.oferta && lockedSectionRuleType !== "SALE") {
    activeChips.push({
      id: "sale",
      label: "Sale / En oferta",
      onRemove: () => applyFiltersDesktop({ ...activeFilters, oferta: false }),
    });
  }

  for (const [attrKey, vals] of Object.entries(activeFilters.atributos)) {
    const def = attributeDefinitions.find((a) => a.key === attrKey);
    for (const val of vals) {
      activeChips.push({
        id: `attr-${attrKey}-${val}`,
        label: `${def?.label || attrKey}: ${val}`,
        onRemove: () =>
          applyFiltersDesktop({
            ...activeFilters,
            atributos: {
              ...activeFilters.atributos,
              [attrKey]: vals.filter((v) => v !== val),
            },
          }),
      });
    }
  }

  const toggleCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleCategories = categories.filter(
    (c) => !c.isHidden && c.slug !== "sin-clasificar"
  );

  // Renderizador reutilizable de grupos de filtros (instantáneo en escritorio, diferido en celular)
  const renderFilterGroups = (isMobile: boolean) => {
    const current = isMobile ? draftFilters : activeFilters;
    const updateFilter = (next: ActiveCatalogFilters) => {
      if (isMobile) {
        setDraftFilters(next);
      } else {
        applyFiltersDesktop(next);
      }
    };

    return (
      <div className="space-y-5">
        {/* 1. Categorías */}
        {enabledFilters.includes("categories") &&
          visibleCategories.length > 0 && (
            <fieldset className="border-b border-[#e7e2da] pb-4">
              <legend className="w-full">
                <button
                  type="button"
                  onClick={() => toggleCollapse("categories")}
                  aria-expanded={!collapsedGroups["categories"]}
                  className="flex w-full items-center justify-between py-1 text-left text-xs font-bold uppercase tracking-wider text-stone-900"
                >
                  <span>Categorías</span>
                  <ChevronDown
                    className={`h-4 w-4 text-stone-500 transition-transform ${
                      collapsedGroups["categories"] ? "-rotate-90" : ""
                    }`}
                  />
                </button>
              </legend>

              {!collapsedGroups["categories"] && (
                <div className="mt-2.5 space-y-1.5">
                  {visibleCategories.map((cat) => {
                    const count =
                      facets.categories.find((fc) => fc.id === cat.id)?.count || 0;
                    const checked = current.categoria === cat.slug;
                    const disabled = count === 0 && !checked;
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center justify-between gap-2 text-xs py-1 ${
                          disabled
                            ? "opacity-45 cursor-not-allowed"
                            : "cursor-pointer hover:text-stone-950"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-stone-800">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() =>
                              updateFilter({
                                ...current,
                                categoria: checked ? undefined : cat.slug,
                              })
                            }
                            className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                          />
                          <span>{cat.name}</span>
                        </span>
                        <span className="font-mono text-[11px] text-stone-500">
                          ({count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          )}

        {/* 2. Talle */}
        {enabledFilters.includes("size") && facets.sizes.length > 0 && (
          <fieldset className="border-b border-[#e7e2da] pb-4">
            <legend className="w-full">
              <button
                type="button"
                onClick={() => toggleCollapse("size")}
                aria-expanded={!collapsedGroups["size"]}
                className="flex w-full items-center justify-between py-1 text-left text-xs font-bold uppercase tracking-wider text-stone-900"
              >
                <span>Talle</span>
                <ChevronDown
                  className={`h-4 w-4 text-stone-500 transition-transform ${
                    collapsedGroups["size"] ? "-rotate-90" : ""
                  }`}
                />
              </button>
            </legend>

            {!collapsedGroups["size"] && (
              <div className="mt-2.5 space-y-1.5">
                {facets.sizes.map((sz) => {
                  const checked = current.talles.includes(sz.size);
                  const disabled = sz.count === 0 && !checked;
                  return (
                    <label
                      key={sz.size}
                      className={`flex items-center justify-between gap-2 text-xs py-1 ${
                        disabled
                          ? "opacity-45 cursor-not-allowed"
                          : "cursor-pointer hover:text-stone-950"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-stone-800">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => {
                            const nextSizes = checked
                              ? current.talles.filter((s) => s !== sz.size)
                              : [...current.talles, sz.size];
                            updateFilter({ ...current, talles: nextSizes });
                          }}
                          className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                        />
                        <span className="font-mono font-medium">{sz.size}</span>
                      </span>
                      <span className="font-mono text-[11px] text-stone-500">
                        ({sz.count})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
        )}

        {/* 3. Color (muestra más nombre) */}
        {enabledFilters.includes("color") && facets.colors.length > 0 && (
          <fieldset className="border-b border-[#e7e2da] pb-4">
            <legend className="w-full">
              <button
                type="button"
                onClick={() => toggleCollapse("color")}
                aria-expanded={!collapsedGroups["color"]}
                className="flex w-full items-center justify-between py-1 text-left text-xs font-bold uppercase tracking-wider text-stone-900"
              >
                <span>Color</span>
                <ChevronDown
                  className={`h-4 w-4 text-stone-500 transition-transform ${
                    collapsedGroups["color"] ? "-rotate-90" : ""
                  }`}
                />
              </button>
            </legend>

            {!collapsedGroups["color"] && (
              <div className="mt-2.5 space-y-1.5">
                {facets.colors.map((col) => {
                  const checked = current.colores.some(
                    (c) => c.toLowerCase() === col.name.toLowerCase()
                  );
                  const disabled = col.count === 0 && !checked;
                  return (
                    <label
                      key={col.name}
                      className={`flex items-center justify-between gap-2 text-xs py-1 ${
                        disabled
                          ? "opacity-45 cursor-not-allowed"
                          : "cursor-pointer hover:text-stone-950"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-stone-800">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => {
                            const nextColors = checked
                              ? current.colores.filter(
                                  (c) =>
                                    c.toLowerCase() !== col.name.toLowerCase()
                                )
                              : [...current.colores, col.name];
                            updateFilter({ ...current, colores: nextColors });
                          }}
                          className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                        />
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full border border-stone-300 shrink-0"
                          style={{
                            backgroundColor: col.hexCode || "#78716c",
                          }}
                          aria-hidden="true"
                        />
                        <span>{col.name}</span>
                      </span>
                      <span className="font-mono text-[11px] text-stone-500">
                        ({col.count})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
        )}

        {/* 4. Precio (rango con campos mínimo y máximo) */}
        {enabledFilters.includes("price") && (
          <fieldset className="border-b border-[#e7e2da] pb-4">
            <legend className="w-full">
              <button
                type="button"
                onClick={() => toggleCollapse("price")}
                aria-expanded={!collapsedGroups["price"]}
                className="flex w-full items-center justify-between py-1 text-left text-xs font-bold uppercase tracking-wider text-stone-900"
              >
                <span>Precio (ARS)</span>
                <ChevronDown
                  className={`h-4 w-4 text-stone-500 transition-transform ${
                    collapsedGroups["price"] ? "-rotate-90" : ""
                  }`}
                />
              </button>
            </legend>

            {!collapsedGroups["price"] && (
              <div className="mt-2.5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor={isMobile ? "mob-min-price" : "desk-min-price"}
                      className="block text-[10px] font-medium text-stone-500 mb-1"
                    >
                      Mínimo ($)
                    </label>
                    <input
                      id={isMobile ? "mob-min-price" : "desk-min-price"}
                      type="number"
                      min={0}
                      placeholder={
                        facets.minPriceCents
                          ? String(Math.round(facets.minPriceCents / 100))
                          : "0"
                      }
                      value={
                        isMobile ? current.minPrecio || "" : minPriceInput
                      }
                      onChange={(e) => {
                        if (isMobile) {
                          setDraftFilters({
                            ...current,
                            minPrecio: e.target.value,
                          });
                        } else {
                          setMinPriceInput(e.target.value);
                        }
                      }}
                      className="w-full rounded-lg border border-[#d8d2c7] bg-white px-2.5 py-1.5 text-xs font-mono text-stone-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={isMobile ? "mob-max-price" : "desk-max-price"}
                      className="block text-[10px] font-medium text-stone-500 mb-1"
                    >
                      Máximo ($)
                    </label>
                    <input
                      id={isMobile ? "mob-max-price" : "desk-max-price"}
                      type="number"
                      min={0}
                      placeholder={
                        facets.maxPriceCents
                          ? String(Math.round(facets.maxPriceCents / 100))
                          : "999999"
                      }
                      value={
                        isMobile ? current.maxPrecio || "" : maxPriceInput
                      }
                      onChange={(e) => {
                        if (isMobile) {
                          setDraftFilters({
                            ...current,
                            maxPrecio: e.target.value,
                          });
                        } else {
                          setMaxPriceInput(e.target.value);
                        }
                      }}
                      className="w-full rounded-lg border border-[#d8d2c7] bg-white px-2.5 py-1.5 text-xs font-mono text-stone-900"
                    />
                  </div>
                </div>
                {!isMobile && (
                  <button
                    type="button"
                    onClick={() =>
                      applyFiltersDesktop({
                        ...current,
                        minPrecio: minPriceInput.trim() || undefined,
                        maxPrecio: maxPriceInput.trim() || undefined,
                      })
                    }
                    className="w-full rounded-lg border border-[#d8d2c7] bg-white py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-900 hover:text-white transition-colors"
                  >
                    Aplicar rango de precio
                  </button>
                )}
              </div>
            )}
          </fieldset>
        )}

        {/* 5. Disponibilidad y En oferta */}
        {(enabledFilters.includes("availability") ||
          enabledFilters.includes("sale")) && (
          <fieldset className="border-b border-[#e7e2da] pb-4">
            <legend className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-2">
              Estado y Promoción
            </legend>
            <div className="space-y-2">
              {enabledFilters.includes("availability") && (
                <label className="flex items-center justify-between gap-2 text-xs text-stone-800 cursor-pointer py-0.5">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={current.disponible}
                      onChange={(e) =>
                        updateFilter({
                          ...current,
                          disponible: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                    />
                    <span>Solo disponibles</span>
                  </span>
                  <span className="font-mono text-[11px] text-stone-500">
                    ({facets.availableCount})
                  </span>
                </label>
              )}

              {enabledFilters.includes("sale") &&
                lockedSectionRuleType !== "SALE" && (
                  <label className="flex items-center justify-between gap-2 text-xs text-stone-800 cursor-pointer py-0.5">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={current.oferta}
                        onChange={(e) =>
                          updateFilter({
                            ...current,
                            oferta: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                      />
                      <span className="font-semibold text-rose-700">
                        En oferta (Sale)
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-stone-500">
                      ({facets.onSaleCount})
                    </span>
                  </label>
                )}
            </div>
          </fieldset>
        )}

        {/* 6. Atributos propios del rubro (Para, Material, Marca, etc.) */}
        {attributeDefinitions
          .filter(
            (def) => def.isFilterable && enabledFilters.includes(def.key)
          )
          .map((def) => {
            const facetOptions = facets.attributes[def.key] || [];
            const selectedVals = current.atributos[def.key] || [];
            const allOptions = Array.from(
              new Set([
                ...def.options,
                ...facetOptions.map((fo) => fo.value),
              ])
            );
            if (allOptions.length === 0) return null;

            return (
              <fieldset key={def.key} className="border-b border-[#e7e2da] pb-4">
                <legend className="w-full">
                  <button
                    type="button"
                    onClick={() => toggleCollapse(`attr_${def.key}`)}
                    aria-expanded={!collapsedGroups[`attr_${def.key}`]}
                    className="flex w-full items-center justify-between py-1 text-left text-xs font-bold uppercase tracking-wider text-stone-900"
                  >
                    <span>{def.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-stone-500 transition-transform ${
                        collapsedGroups[`attr_${def.key}`] ? "-rotate-90" : ""
                      }`}
                    />
                  </button>
                </legend>

                {!collapsedGroups[`attr_${def.key}`] && (
                  <div className="mt-2.5 space-y-1.5">
                    {allOptions.map((opt) => {
                      const count =
                        facetOptions.find(
                          (f) => f.value.toLowerCase() === opt.toLowerCase()
                        )?.count || 0;
                      const checked = selectedVals.some(
                        (v) => v.toLowerCase() === opt.toLowerCase()
                      );
                      const disabled = count === 0 && !checked;

                      return (
                        <label
                          key={opt}
                          className={`flex items-center justify-between gap-2 text-xs py-1 ${
                            disabled
                              ? "opacity-45 cursor-not-allowed"
                              : "cursor-pointer hover:text-stone-950"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-stone-800">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                const nextVals = checked
                                  ? selectedVals.filter(
                                      (v) =>
                                        v.toLowerCase() !== opt.toLowerCase()
                                    )
                                  : [...selectedVals, opt];
                                updateFilter({
                                  ...current,
                                  atributos: {
                                    ...current.atributos,
                                    [def.key]: nextVals,
                                  },
                                });
                              }}
                              className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                            />
                            <span>{opt}</span>
                          </span>
                          <span className="font-mono text-[11px] text-stone-500">
                            ({count})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            );
          })}
      </div>
    );
  };

  const progressPercent =
    totalCount > 0
      ? Math.min(100, Math.round((products.length / totalCount) * 100))
      : 100;
  const hasMore = products.length < totalCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Migas de pan" className="mb-4 text-xs text-stone-500">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link prefetch={false} href="/" className="hover:text-stone-900 hover:underline">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3 w-3" />
          </li>
          <li aria-current="page" className="font-semibold text-stone-900">
            {breadcrumbLabel}
          </li>
        </ol>
      </nav>

      {/* Región aria-live para anunciar cantidad de resultados */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`${title}: ${totalCount} producto${
          totalCount === 1 ? "" : "s"
        } encontrados. Mostrando ${products.length}.`}
      </div>

      {/* Barra fija inferior/superior en celular: "Filtrar (N) · Ordenar" */}
      <div className="sticky top-[57px] z-30 -mx-4 mb-4 flex items-center justify-between border-y border-[#e7e2da] bg-[#faf8f5]/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8d2c7] bg-white px-4 py-2 text-xs font-semibold text-stone-900 shadow-2xs"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            Filtrar{activeChips.length > 0 ? ` (${activeChips.length})` : ""}
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <label htmlFor="mobile-sort" className="text-[11px] text-stone-500">
            Ordenar:
          </label>
          <select
            id="mobile-sort"
            value={activeFilters.orden}
            onChange={(e) =>
              applyFiltersDesktop({
                ...activeFilters,
                orden: e.target.value as ProductSortOption,
              })
            }
            className="rounded-full border border-[#d8d2c7] bg-white px-3 py-1.5 text-xs font-semibold text-stone-900"
          >
            {activeFilters.q && <option value="relevance">Relevancia</option>}
            <option value="featured">Destacados</option>
            <option value="newest">Recién llegados</option>
            <option value="price_asc">Menor precio</option>
            <option value="price_desc">Mayor precio</option>
          </select>
        </div>
      </div>

      {/* Estructura estilo panel: Filtros a la izquierda (260px), Resultados a la derecha */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-8">
        {/* Barra lateral fija (sticky) de ~260px en escritorio */}
        <aside
          aria-label="Filtros del catálogo"
          className="hidden lg:block w-[260px] shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2"
        >
          <div className="flex items-center justify-between border-b border-[#e7e2da] pb-3 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-900">
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Filtros</span>
            </div>
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-stone-600 hover:text-stone-950 underline underline-offset-4"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {renderFilterGroups(false)}
        </aside>

        {/* Columna derecha: Encabezado, Chips activos, Grilla y Paginación por tandas */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Cabecera del panel derecho */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#e7e2da] pb-4">
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-wide text-stone-900">
                  {title}
                </h1>
                <span className="text-xs sm:text-sm font-medium text-stone-500">
                  · {totalCount} producto{totalCount === 1 ? "" : "s"}
                </span>
              </div>
              {subtitle && (
                <p className="mt-1 text-xs sm:text-sm text-stone-600">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Selector de Orden en escritorio */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <label
                htmlFor="desktop-sort"
                className="text-xs font-medium text-stone-600"
              >
                Ordenar:
              </label>
              <select
                id="desktop-sort"
                value={activeFilters.orden}
                onChange={(e) =>
                  applyFiltersDesktop({
                    ...activeFilters,
                    orden: e.target.value as ProductSortOption,
                  })
                }
                className="rounded-xl border border-[#d8d2c7] bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 focus:border-stone-900 focus:outline-none"
              >
                {activeFilters.q && (
                  <option value="relevance">Relevancia</option>
                )}
                <option value="featured">Destacados</option>
                <option value="newest">Recién llegados</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
              </select>
            </div>
          </div>

          {/* Chips de filtros activos sobre la grilla */}
          {activeChips.length > 0 && (
            <div
              role="region"
              aria-label="Filtros aplicados"
              className="flex flex-wrap items-center gap-2"
            >
              {activeChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Quitar filtro ${chip.label}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d2c7] bg-white px-3 py-1 text-xs font-medium text-stone-800 hover:border-stone-900 hover:bg-stone-100 transition-colors"
                >
                  <span>{chip.label}</span>
                  <X className="h-3 w-3 text-stone-500" aria-hidden="true" />
                </button>
              ))}

              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-stone-700 hover:text-stone-950 underline underline-offset-4"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Limpiar todo</span>
              </button>
            </div>
          )}

          {/* Grilla de productos (12 por tanda se reparten exacto en 2, 3 y 4 columnas) */}
          {products.length > 0 ? (
            <div
              className={`grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 transition-opacity duration-200 ${
                isPending ? "opacity-60" : "opacity-100"
              }`}
            >
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={idx < 4}
                  cardId={`catalog-item-${idx}`}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#e7e2da] bg-white p-12 text-center space-y-4">
              <p className="font-serif text-xl text-stone-800">
                No encontramos productos con esos filtros.
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Probá quitando alguno de los filtros seleccionados o explorá todo nuestro catálogo disponible.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-stone-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Limpiar todos los filtros</span>
              </button>
            </div>
          )}

          {/* Pie de paginación: "Mostrando X de Y", barra de progreso, botón "Cargar más" y enlaces reales (?pagina=2) */}
          {totalCount > 0 && (
            <div className="pt-8 pb-4 flex flex-col items-center space-y-4 border-t border-[#e7e2da]">
              <div className="w-full max-w-xs space-y-2 text-center">
                <p className="text-xs font-medium text-stone-600">
                  Mostrando{" "}
                  <span className="font-bold text-stone-900">
                    {products.length}
                  </span>{" "}
                  de{" "}
                  <span className="font-bold text-stone-900">{totalCount}</span>{" "}
                  productos
                </p>
                <div
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progreso del catálogo mostrado"
                  className="h-1.5 w-full overflow-hidden rounded-full bg-[#e7e2da]"
                >
                  <div
                    className="h-full bg-stone-900 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {hasMore && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isPending}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full border border-stone-900 bg-stone-900 px-8 py-3 text-xs font-semibold tracking-wider uppercase text-white shadow-sm hover:bg-stone-800 transition-all focus-visible:outline-2 focus-visible:outline-stone-900 disabled:opacity-60 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Cargando tanda...</span>
                    </>
                  ) : (
                    <span>Cargar más productos</span>
                  )}
                </button>
              )}

              {/* Enlaces de página reales (?pagina=2) para buscadores y para compartir */}
              {totalPages > 1 && (
                <nav
                  aria-label="Paginación del catálogo"
                  className="flex flex-wrap items-center justify-center gap-1.5 pt-2"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => {
                      const isCurrent = pageNum === currentPage;
                      const pageHref = buildUrlWithFilters({
                        ...activeFilters,
                        pagina: pageNum,
                      });
                      return (
                        <Link
                          key={pageNum}
                          href={pageHref}
                          prefetch={pageNum === currentPage + 1}
                          aria-current={isCurrent ? "page" : undefined}
                          aria-label={`Página ${pageNum}`}
                          className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-mono font-semibold border transition-colors ${
                            isCurrent
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-[#d8d2c7] bg-white text-stone-700 hover:border-stone-900"
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    }
                  )}
                </nav>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hoja inferior de filtros en celular con botón "Aplicar" / "Ver resultados" */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros del catálogo"
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
        >
          <div
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] w-full rounded-t-3xl bg-[#faf8f5] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e7e2da] px-5 py-4">
              <span className="font-serif text-lg font-medium text-stone-900">
                Filtrar catálogo
              </span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Cerrar filtros"
                className="p-2 rounded-full text-stone-600 hover:text-stone-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {renderFilterGroups(true)}
            </div>

            <div className="flex items-center gap-3 border-t border-[#e7e2da] bg-white p-4">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  clearAllFilters();
                }}
                className="flex-1 min-h-[44px] rounded-full border border-[#d8d2c7] py-2.5 text-xs font-semibold text-stone-800"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  applyFiltersDesktop(draftFilters);
                }}
                className="flex-2 min-h-[44px] rounded-full bg-stone-900 py-2.5 px-6 text-xs font-semibold text-white"
              >
                Aplicar filtros ({totalCount} resultados)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
