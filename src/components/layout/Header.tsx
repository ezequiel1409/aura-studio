"use client";

import { useEffect, useRef, useState, useTransition, useMemo, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  Percent,
  Search,
  User,
  X,
} from "lucide-react";
import { parseProductCode } from "../../domain/product/rules";
import { NavigationSection } from "../../domain/navigation/types";
import { Category } from "../../domain/category/types";
import { AnnouncementBarConfig, NavbarConfig } from "../../services/settings.service";
import { formatPriceARS } from "../../lib/format/currency";
import { CartHeaderButton } from "../cart/CartHeaderButton";
import { AnnouncementBar } from "./AnnouncementBar";
import { BrandLogo } from "./BrandLogo";

export interface HeaderProps {
  brandName?: string;
  logoUrl?: string | null;
  initialSearch?: string;
  sections?: NavigationSection[];
  categories?: Category[];
  announcementBar?: AnnouncementBarConfig | null;
  navbarConfig?: NavbarConfig | null;
}

const DEFAULT_FALLBACK_SECTIONS: NavigationSection[] = [
  {
    id: 1,
    name: "MUJER",
    slug: "mujer",
    ruleType: "ATTRIBUTE",
    ruleConfig: { attributeKey: "para", attributeValue: "Mujer" },
    position: 1,
    isVisible: true,
    showInHomeMosaic: true,
    accentColor: null,
    subcategories: [],
    bannerImageUrl: null,
  },
  {
    id: 2,
    name: "HOMBRE",
    slug: "hombre",
    ruleType: "ATTRIBUTE",
    ruleConfig: { attributeKey: "para", attributeValue: "Hombre" },
    position: 2,
    isVisible: true,
    showInHomeMosaic: true,
    accentColor: null,
    subcategories: [],
    bannerImageUrl: null,
  },
  {
    id: 3,
    name: "RECIÉN LLEGADOS",
    slug: "recien-llegados",
    ruleType: "RECENCY",
    ruleConfig: { daysWindow: 30 },
    position: 3,
    isVisible: true,
    showInHomeMosaic: false,
    accentColor: null,
    subcategories: [],
    bannerImageUrl: null,
  },
  {
    id: 4,
    name: "SALE",
    slug: "sale",
    ruleType: "SALE",
    ruleConfig: {},
    position: 4,
    isVisible: true,
    showInHomeMosaic: true,
    accentColor: "#be123c",
    subcategories: [],
    bannerImageUrl: null,
  },
];

interface SuggestionResult {
  directCode: string | null;
  categories: Array<{ id: number; name: string; slug: string; href: string }>;
  products: Array<{
    id: number;
    code: string;
    title: string;
    priceCents: number | null;
    compareAtPriceCents: number | null;
    thumbUrl: string | null;
    href: string;
  }>;
}

function isBroadNavigationItem(
  cleanHref: string,
  label: string,
  hasMatchedSection: boolean
): boolean {
  if (hasMatchedSection) return true;
  if (
    cleanHref === "mujer" ||
    cleanHref === "hombre" ||
    cleanHref === "catalogo" ||
    cleanHref === "secciones" ||
    cleanHref === "colecciones"
  ) {
    return true;
  }
  const lowerLabel = label.toLowerCase();
  return (
    lowerLabel.includes("mujer") ||
    lowerLabel.includes("hombre") ||
    lowerLabel.includes("ropa") ||
    lowerLabel.includes("seccion") ||
    lowerLabel.includes("sección") ||
    lowerLabel.includes("coleccion") ||
    lowerLabel.includes("colección") ||
    lowerLabel.includes("catálogo") ||
    lowerLabel.includes("catalogo")
  );
}

export const Header = memo(function Header({
  brandName = "Aura Studio",
  logoUrl,
  initialSearch = "",
  sections,
  categories = [],
  announcementBar,
  navbarConfig,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const isNavbarEnabled = navbarConfig ? navbarConfig.enabled !== false : true;
  const navbarAlignment = navbarConfig?.alignment || "left";

  const [query, setQuery] = useState(initialSearch);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdownSlug, setOpenDropdownSlug] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<
    string | null
  >(null);

  // Sugerencias de búsqueda en vivo
  const [suggestions, setSuggestions] = useState<SuggestionResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLFormElement>(null);

  // Memoizar colecciones para no recrear arrays ni filtros en cada navegación o tecla
  const allVisibleSections = useMemo(
    () =>
      (sections && sections.length > 0 ? sections : DEFAULT_FALLBACK_SECTIONS).filter(
        (s) => s.isVisible
      ),
    [sections]
  );

  const navSections = useMemo(
    () => allVisibleSections.slice(0, 10),
    [allVisibleSections]
  );

  const visibleCategories = useMemo(
    () => categories.filter((c) => !c.isHidden && c.slug !== "sin-clasificar"),
    [categories]
  );

  // Auto-cerrar menús desplegables, sugerencias y drawer móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdownSlug(null);
    setShowSuggestions(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const nextScrolled = window.scrollY > 24;
      setIsScrolled((prev) => (prev !== nextScrolled ? nextScrolled : prev));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar sugerencias al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar sugerencias con debounce corto
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setSuggestions(data);
          }
        }
      } catch {
        // Silencioso en caso de desconexión
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const trimmed = query.trim();
    if (!trimmed) {
      startTransition(() => {
        router.push("/catalogo");
      });
      return;
    }

    // BR-24: Búsqueda directa por código (#023 o 023)
    const codeNumber = parseProductCode(trimmed);
    if (codeNumber !== null) {
      const paddedCode = codeNumber.toString().padStart(3, "0");
      router.push(`/p/${paddedCode}`);
      return;
    }

    // Los resultados llevan al catálogo con el texto aplicado
    startTransition(() => {
      router.push(`/catalogo?q=${encodeURIComponent(trimmed)}`);
    });
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions(null);
    setShowSuggestions(false);
    if (pathname === "/catalogo") {
      startTransition(() => {
        router.push("/catalogo");
      });
    }
  };

  const renderNavItems = (customTextColor?: string) => {
    if (navbarConfig?.items && navbarConfig.items.length > 0) {
      const sorted = [...navbarConfig.items].sort((a, b) => a.position - b.position);
      return sorted.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`));
        const cleanHref = item.href.replace(/^\//, "").split("?")[0].toLowerCase();
        const matchedSec = allVisibleSections.find(
          (s) =>
            s.slug.toLowerCase() === cleanHref ||
            `/${s.slug.toLowerCase()}` === item.href.toLowerCase() ||
            s.name.toLowerCase() === item.label.toLowerCase() ||
            item.href.toLowerCase().includes(s.slug.toLowerCase())
        );

        const isBroadNavSection = isBroadNavigationItem(
          cleanHref,
          item.label,
          Boolean(matchedSec)
        );

        const hasExplicitSubItems = Boolean(item.subItems && item.subItems.length > 0);
        const hasSubmenu = Boolean(
          hasExplicitSubItems ||
          (matchedSec?.subcategories && matchedSec.subcategories.length > 0) ||
          (isBroadNavSection && (visibleCategories.length > 0 || allVisibleSections.length > 0))
        );

        const secSlug = matchedSec ? matchedSec.slug : item.id;
        const isDropdownOpen = openDropdownSlug === secSlug;

        const linkStyle: React.CSSProperties = {
          ...(customTextColor && !item.isSale ? { color: customTextColor } : {}),
          ...(item.accentColor ? { color: item.accentColor } : {}),
        };

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => {
              if (hasSubmenu) setOpenDropdownSlug(secSlug);
            }}
            onMouseLeave={() => {
              if (openDropdownSlug === secSlug) setOpenDropdownSlug(null);
            }}
          >
            <div className="flex items-center">
              <Link
                href={item.href}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                aria-current={isActive ? "page" : undefined}
                style={Object.keys(linkStyle).length > 0 ? linkStyle : undefined}
                className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase transition-colors rounded-md focus-visible:outline-2 focus-visible:outline-stone-900 ${
                  isActive
                    ? "text-stone-950 underline underline-offset-8 decoration-2"
                    : item.isSale
                    ? "text-rose-700 hover:text-rose-800"
                    : "text-stone-700 hover:text-stone-950"
                }`}
              >
                {item.isSale && (
                  <Percent className="h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                <span>{item.label}</span>
              </Link>

              {hasSubmenu && (
                <button
                  type="button"
                  aria-label={`Subcategorías de ${item.label}`}
                  aria-expanded={isDropdownOpen}
                  aria-controls={`submenu-${secSlug}`}
                  style={customTextColor ? { color: customTextColor } : undefined}
                  onClick={() =>
                    setOpenDropdownSlug((prev) =>
                      prev === secSlug ? null : secSlug
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setOpenDropdownSlug(null);
                  }}
                  className="p-1 text-stone-500 hover:text-stone-900 rounded focus-visible:outline-2 focus-visible:outline-stone-900"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>

            {hasSubmenu && isDropdownOpen && (
              <div
                id={`submenu-${secSlug}`}
                role="region"
                aria-label={`Opciones y categorías en ${item.label}`}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpenDropdownSlug(null);
                }}
                className="absolute left-0 top-full pt-1.5 w-72 sm:w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="rounded-2xl border border-[#e7e2da] bg-[#faf8f5] p-4 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#e7e2da] pb-2">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-900">
                        Explorar {item.label}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Secciones y productos de la tienda
                      </span>
                    </div>
                    <Link
                      href={item.href}
                      onClick={() => setOpenDropdownSlug(null)}
                      className="text-[11px] font-semibold text-stone-900 hover:underline flex items-center gap-0.5"
                    >
                      <span>Ver todo</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Subsecciones configuradas / mapeadas por el usuario */}
                  {hasExplicitSubItems && item.subItems && (
                    <div className="space-y-1">
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-amber-900/90">
                        Subsecciones
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {item.subItems.map((sub) => (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            onClick={() => setOpenDropdownSlug(null)}
                            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                              sub.isSale
                                ? "text-rose-700 hover:bg-rose-50 hover:text-rose-900"
                                : "text-stone-800 hover:bg-stone-200/70 hover:text-stone-950"
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                            <ChevronRight className="h-3 w-3 text-stone-400 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Secciones y Colecciones destacadas */}
                  {allVisibleSections.length > 0 && (
                    <div className="space-y-1">
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-amber-800/80">
                        Secciones y Colecciones
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {allVisibleSections
                          .filter((sec) => sec.slug !== secSlug)
                          .slice(0, 4)
                          .map((sec) => (
                            <Link
                              key={sec.id}
                              href={sec.targetUrl || `/${sec.slug}`}
                              onClick={() => setOpenDropdownSlug(null)}
                              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-200/70 hover:text-stone-950 transition-colors"
                            >
                              <span className="truncate">{sec.name}</span>
                              <ChevronRight className="h-3 w-3 text-stone-400 shrink-0" />
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Categorías de productos */}
                  {visibleCategories.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[#e7e2da]/70">
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-500">
                        Productos por Categoría
                      </span>
                      <ul className="grid grid-cols-2 gap-1">
                        {(matchedSec?.subcategories && matchedSec.subcategories.length > 0
                          ? matchedSec.subcategories
                          : visibleCategories.slice(0, 8).map((c) => ({
                              label: c.name,
                              categorySlug: c.slug,
                              href: undefined as string | undefined,
                            }))
                        ).map((sub) => {
                          const targetHref =
                            sub.href ||
                            (matchedSec
                              ? `/${matchedSec.slug}?categoria=${encodeURIComponent(
                                  sub.categorySlug || ""
                                )}`
                              : `/${cleanHref}?categoria=${encodeURIComponent(
                                  sub.categorySlug || ""
                                )}`);

                          return (
                            <li key={sub.categorySlug || sub.label}>
                              <Link
                                href={targetHref}
                                onClick={() => setOpenDropdownSlug(null)}
                                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-stone-700 hover:bg-stone-200/60 hover:text-stone-950 transition-colors"
                              >
                                <span className="truncate">{sub.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      });
    }

    return navSections.map((sec) => {
      const isSale =
        sec.ruleType === "SALE" || sec.slug.toLowerCase() === "sale";
      const isActive =
        pathname === `/${sec.slug}` ||
        pathname.startsWith(`/${sec.slug}/`);
      const hasSubmenu =
        (sec.subcategories && sec.subcategories.length > 0) ||
        (sec.ruleType === "ATTRIBUTE" && visibleCategories.length > 0) ||
        sec.slug === "mujer" ||
        sec.slug === "hombre" ||
        (visibleCategories.length > 0 && allVisibleSections.length > 0);
      const isDropdownOpen = openDropdownSlug === sec.slug;

      return (
        <div
          key={sec.slug}
          className="relative"
          onMouseEnter={() => {
            if (hasSubmenu) setOpenDropdownSlug(sec.slug);
          }}
          onMouseLeave={() => {
            if (openDropdownSlug === sec.slug) setOpenDropdownSlug(null);
          }}
        >
          <div className="flex items-center">
            <Link
              href={`/${sec.slug}`}
              aria-current={isActive ? "page" : undefined}
              style={{
                ...(customTextColor && !isSale ? { color: customTextColor } : {}),
                ...(sec.accentColor ? { color: sec.accentColor } : {}),
              }}
              className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase transition-colors rounded-md focus-visible:outline-2 focus-visible:outline-stone-900 ${
                isActive
                  ? "text-stone-950 underline underline-offset-8 decoration-2"
                  : isSale
                  ? "text-rose-700 hover:text-rose-800"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              {isSale && (
                <Percent
                  className="h-3 w-3 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span>{sec.name}</span>
            </Link>

            {hasSubmenu && (
              <button
                type="button"
                aria-label={`Subcategorías de ${sec.name}`}
                aria-expanded={isDropdownOpen}
                aria-controls={`submenu-${sec.slug}`}
                onClick={() =>
                  setOpenDropdownSlug((prev) =>
                    prev === sec.slug ? null : sec.slug
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpenDropdownSlug(null);
                }}
                className="p-1 text-stone-500 hover:text-stone-900 rounded focus-visible:outline-2 focus-visible:outline-stone-900"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          {hasSubmenu && isDropdownOpen && (
            <div
              id={`submenu-${sec.slug}`}
              role="region"
              aria-label={`Categorías y secciones en ${sec.name}`}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpenDropdownSlug(null);
              }}
              className="absolute left-0 top-full pt-1.5 w-72 sm:w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="rounded-2xl border border-[#e7e2da] bg-[#faf8f5] p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#e7e2da] pb-2">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-900">
                      Explorar {sec.name}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      Secciones y productos de la tienda
                    </span>
                  </div>
                  <Link
                    href={`/${sec.slug}`}
                    onClick={() => setOpenDropdownSlug(null)}
                    className="text-[11px] font-semibold text-stone-900 hover:underline flex items-center gap-0.5"
                  >
                    <span>Ver todo</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* Secciones y Colecciones destacadas */}
                {allVisibleSections.length > 1 && (
                  <div className="space-y-1">
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-amber-800/80">
                      Secciones y Colecciones
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {allVisibleSections
                        .filter((s) => s.slug !== sec.slug)
                        .slice(0, 4)
                        .map((s) => (
                          <Link
                            key={s.id}
                            href={s.targetUrl || `/${s.slug}`}
                            onClick={() => setOpenDropdownSlug(null)}
                            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-200/70 hover:text-stone-950 transition-colors"
                          >
                            <span className="truncate">{s.name}</span>
                            <ChevronRight className="h-3 w-3 text-stone-400 shrink-0" />
                          </Link>
                        ))}
                    </div>
                  </div>
                )}

                {/* Categorías de productos */}
                {visibleCategories.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-[#e7e2da]/70">
                    <span className="block text-[10px] font-extrabold uppercase tracking-widest text-stone-500">
                      Productos por Categoría
                    </span>
                    <ul className="grid grid-cols-2 gap-1">
                      {(sec.subcategories && sec.subcategories.length > 0
                        ? sec.subcategories
                        : visibleCategories.slice(0, 8).map((c) => ({
                            label: c.name,
                            categorySlug: c.slug,
                            href: undefined as string | undefined,
                          }))
                      ).map((sub) => (
                        <li key={sub.categorySlug || sub.label}>
                          <Link
                            href={
                              sub.href ||
                              `/${sec.slug}?categoria=${encodeURIComponent(
                                sub.categorySlug || ""
                              )}`
                            }
                            onClick={() => setOpenDropdownSlug(null)}
                            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-stone-700 hover:bg-stone-200/60 hover:text-stone-950 transition-colors"
                          >
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {announcementBar && <AnnouncementBar config={announcementBar} />}

      <header
        role="banner"
        className={`sticky top-0 z-40 w-full border-b border-[#e7e2da] bg-[#faf8f5]/95 backdrop-blur-md transition-all duration-200 ${
          isScrolled ? "py-1.5 shadow-xs" : "py-2.5"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Bloque Izquierdo: Menú Móvil + Logotipo de Marca + Navegación de Escritorio agrupada */}
          <div className="flex items-center gap-6 lg:gap-8 min-w-0">
            {/* Botón Menú Móvil + Marca / Logotipo editorial */}
            <div className="flex items-center gap-2.5 shrink-0">
              {isNavbarEnabled && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Abrir menú de secciones"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-sections-drawer"
                  className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-full border border-[#d8d2c7] bg-white/80 text-stone-800 hover:border-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </button>
              )}

              <Link
                href="/"
                aria-label={`${brandName} - Inicio del catálogo`}
                className="group flex items-center focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-stone-900"
              >
                {logoUrl ? (
                  <BrandLogo
                    src={logoUrl}
                    alt={brandName}
                    className={`${
                      isScrolled
                        ? "h-10 w-10 sm:h-11 sm:w-11"
                        : "h-12 w-12 sm:h-14 sm:w-14"
                    } transition-all group-hover:opacity-85`}
                  />
                ) : (
                  <div className="flex flex-col">
                    <span
                      className={`font-serif ${
                        isScrolled ? "text-xl" : "text-2xl"
                      } tracking-[0.22em] font-normal text-stone-900 uppercase transition-all group-hover:opacity-80`}
                    >
                      {brandName}
                    </span>
                    {!isScrolled && (
                      <span className="text-[9px] tracking-[0.3em] font-medium text-stone-500 uppercase">
                        Showroom & Archivo
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </div>

            {/* Navegación por Secciones (Escritorio - Posicionamiento a la izquierda) */}
            {isNavbarEnabled && navbarAlignment === "left" && (
              <nav
                aria-label="Secciones principales de la tienda"
                className="hidden lg:flex items-center gap-1"
              >
                {renderNavItems()}
              </nav>
            )}
          </div>

          {/* Navegación por Secciones (Escritorio - Posicionamiento centrado) */}
          {isNavbarEnabled && navbarAlignment === "center" && (
            <nav
              aria-label="Secciones principales de la tienda"
              className="hidden lg:flex items-center justify-center gap-1 flex-1 mx-2"
            >
              {renderNavItems()}
            </nav>
          )}

          {/* Bloque Derecho: Buscador con sugerencias, Cuenta y Bolsa */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Navegación por Secciones (Escritorio - Posicionamiento a la derecha) */}
            {isNavbarEnabled && navbarAlignment === "right" && (
              <nav
                aria-label="Secciones principales de la tienda"
                className="hidden lg:flex items-center gap-1 mr-2"
              >
                {renderNavItems()}
              </nav>
            )}
            <form
              ref={searchContainerRef}
              role="search"
              onSubmit={handleSearch}
              className="relative w-36 sm:w-60 md:w-64"
            >
              <label htmlFor="catalog-search" className="sr-only">
                Buscar productos por nombre o código numérico
              </label>
              <input
                id="catalog-search"
                type="search"
                value={query}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowSuggestions(false);
                }}
                placeholder="Buscar o #código..."
                autoComplete="off"
                aria-label="Buscar en el catálogo"
                className="w-full rounded-full border border-[#d8d2c7] bg-white/85 py-2 pl-9 pr-8 text-xs text-stone-900 placeholder:text-stone-400 shadow-xs transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 sm:text-sm"
              />
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Borrar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-stone-400 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-stone-900"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Panel de sugerencias de productos y categorías */}
              {showSuggestions &&
                suggestions &&
                (suggestions.directCode ||
                  suggestions.categories.length > 0 ||
                  suggestions.products.length > 0) && (
                  <div
                    role="region"
                    aria-label="Sugerencias de búsqueda"
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-[#e7e2da] bg-[#faf8f5] p-3 shadow-2xl z-50 space-y-3"
                  >
                    {suggestions.directCode && (
                      <Link
                        href={`/p/${suggestions.directCode}`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center justify-between rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                      >
                        <span>Ir directo al código #{suggestions.directCode}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}

                    {suggestions.categories.length > 0 && (
                      <div className="space-y-1">
                        <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          Categorías
                        </span>
                        {suggestions.categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={cat.href}
                            onClick={() => setShowSuggestions(false)}
                            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-200/70"
                          >
                            <span>{cat.name}</span>
                            <ChevronRight className="h-3 w-3 text-stone-400" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {suggestions.products.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          Productos sugeridos
                        </span>
                        {suggestions.products.map((prod) => (
                          <Link
                            key={prod.id}
                            href={prod.href}
                            onClick={() => setShowSuggestions(false)}
                            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-stone-200/70 transition-colors"
                          >
                            {prod.thumbUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={prod.thumbUrl}
                                alt=""
                                className="h-10 w-8 rounded-md object-cover bg-stone-200 shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-8 rounded-md bg-stone-200 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-stone-900">
                                {prod.title}
                              </p>
                              <p className="text-[11px] font-semibold text-stone-600">
                                #{prod.code}
                                {prod.priceCents !== null &&
                                  ` · ${formatPriceARS(prod.priceCents)}`}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2 text-center text-xs font-semibold text-stone-900 hover:bg-stone-100"
                    >
                      Ver todos los resultados para &ldquo;{query.trim()}&rdquo;
                    </button>
                  </div>
                )}
            </form>

            {/* Enlace accesible a Mi Cuenta / Pedidos */}
            <Link
              href="/cuenta"
              aria-label="Mi Cuenta y Pedidos"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d2c7] bg-white/80 text-stone-700 shadow-xs transition-colors hover:border-stone-900 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
              title="Mi Cuenta"
            >
              <User className="h-4 w-4" />
            </Link>

            {/* Botón flotante accesible de bolsa de compras con badge */}
            <CartHeaderButton />
          </div>
        </div>

        {/* Fila secundaria dedicada de Navegación (para alineación en segunda fila) */}
        {isNavbarEnabled && navbarAlignment === "second_row" && (
          <div
            className={`w-full border-t border-[#e7e2da] py-2 px-4 sm:px-6 transition-colors ${
              !navbarConfig?.secondRowBgColor ? "bg-white/80" : ""
            }`}
            style={
              navbarConfig?.secondRowBgColor
                ? { backgroundColor: navbarConfig.secondRowBgColor }
                : undefined
            }
          >
            <nav
              aria-label="Secciones principales de la tienda"
              className="mx-auto flex max-w-6xl items-center justify-start sm:justify-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
            >
              {renderNavItems(navbarConfig?.secondRowTextColor || undefined)}
            </nav>
          </div>
        )}
      </header>

      {/* Menú Lateral con Acordeón para Celular */}
      {mobileMenuOpen && (
        <div
          id="mobile-sections-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación móvil"
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          <div
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-80 max-w-[85vw] bg-[#faf8f5] h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-5">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#e7e2da] pb-4">
                <span className="font-serif text-lg tracking-[0.2em] uppercase text-stone-900">
                  {brandName}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Cerrar menú"
                  className="p-2 rounded-full text-stone-600 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-stone-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav aria-label="Secciones móviles" className="space-y-1">
                {(navbarConfig?.items && navbarConfig.items.length > 0
                  ? [...navbarConfig.items]
                      .sort((a, b) => a.position - b.position)
                      .map((item) => {
                        const cleanHref = item.href.replace(/^\//, "").split("?")[0].toLowerCase();
                        const matchedSec = allVisibleSections.find(
                          (s) =>
                            s.slug.toLowerCase() === cleanHref ||
                            `/${s.slug.toLowerCase()}` === item.href.toLowerCase() ||
                            s.name.toLowerCase() === item.label.toLowerCase() ||
                            item.href.toLowerCase().includes(s.slug.toLowerCase())
                        );
                        const isSale = Boolean(item.isSale);
                        const isExpanded = mobileExpandedSection === item.id;
                        const isBroadNavSection = isBroadNavigationItem(
                          cleanHref,
                          item.label,
                          Boolean(matchedSec)
                        );

                        const hasExplicitSubItems = Boolean(item.subItems && item.subItems.length > 0);
                        const hasSubcategories = Boolean(
                          hasExplicitSubItems ||
                          (matchedSec?.subcategories && matchedSec.subcategories.length > 0) ||
                          (isBroadNavSection && (visibleCategories.length > 0 || allVisibleSections.length > 0))
                        );

                        return (
                          <div
                            key={item.id}
                            className="border-b border-[#e7e2da]/70 py-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <Link
                                href={item.href}
                                target={item.openInNewTab ? "_blank" : undefined}
                                rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                                onClick={() => setMobileMenuOpen(false)}
                                style={
                                  item.accentColor
                                    ? { color: item.accentColor }
                                    : undefined
                                }
                                className={`flex-1 py-2 text-sm font-semibold tracking-wider uppercase flex items-center gap-1.5 ${
                                  isSale ? "text-rose-700" : "text-stone-900"
                                }`}
                              >
                                {isSale && <Percent className="h-3.5 w-3.5" />}
                                <span>{item.label}</span>
                              </Link>

                              {hasSubcategories && (
                                <button
                                  type="button"
                                  aria-expanded={isExpanded}
                                  aria-label={`Alternar categorías de ${item.label}`}
                                  onClick={() =>
                                    setMobileExpandedSection((prev) =>
                                      prev === item.id ? null : item.id
                                    )
                                  }
                                  className="p-2 text-stone-600 hover:text-stone-900"
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                              )}
                            </div>

                            {hasSubcategories && isExpanded && (
                              <div className="pl-3 pb-2 pt-1 space-y-3">
                                {/* Subsecciones mapeadas / configuradas por el usuario en móvil */}
                                {hasExplicitSubItems && item.subItems && (
                                  <div className="space-y-1">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-900/90">
                                      Subsecciones
                                    </span>
                                    <div className="space-y-1">
                                      {item.subItems.map((sub) => (
                                        <Link
                                          key={sub.id}
                                          href={sub.href}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className={`block py-1 text-xs font-semibold transition-colors ${
                                            sub.isSale
                                              ? "text-rose-700"
                                              : "text-stone-800 hover:text-stone-950"
                                          }`}
                                        >
                                          {sub.label}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Secciones y Colecciones destacadas en celular */}
                                {allVisibleSections.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-800/80">
                                      Secciones y Colecciones
                                    </span>
                                    <div className="space-y-1">
                                      {allVisibleSections
                                        .filter((sec) => sec.slug !== (matchedSec ? matchedSec.slug : item.id))
                                        .slice(0, 4)
                                        .map((sec) => (
                                          <Link
                                            key={sec.id}
                                            href={sec.targetUrl || `/${sec.slug}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block py-1 text-xs font-semibold text-stone-800 hover:text-stone-950"
                                          >
                                            {sec.name}
                                          </Link>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {/* Categorías de productos en celular */}
                                {visibleCategories.length > 0 && (
                                  <div className="space-y-1 pt-1 border-t border-[#e7e2da]/70">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                                      Categorías
                                    </span>
                                    <ul className="space-y-1">
                                      {(matchedSec?.subcategories && matchedSec.subcategories.length > 0
                                        ? matchedSec.subcategories
                                        : visibleCategories.slice(0, 8).map((c) => ({
                                            label: c.name,
                                            categorySlug: c.slug,
                                            href: undefined as string | undefined,
                                          }))
                                      ).map((cat) => {
                                        const targetHref =
                                          cat.href ||
                                          (matchedSec
                                            ? `/${matchedSec.slug}?categoria=${encodeURIComponent(
                                                cat.categorySlug || ""
                                              )}`
                                            : `/${cleanHref}?categoria=${encodeURIComponent(
                                                cat.categorySlug || ""
                                              )}`);
                                        return (
                                          <li key={cat.label}>
                                            <Link
                                              href={targetHref}
                                              onClick={() => setMobileMenuOpen(false)}
                                              className="block py-1 text-xs text-stone-600 hover:text-stone-900"
                                            >
                                              {cat.label}
                                            </Link>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                  : navSections.map((sec) => {
                      const isSale =
                        sec.ruleType === "SALE" || sec.slug.toLowerCase() === "sale";
                      const isExpanded = mobileExpandedSection === sec.slug;
                      const hasSubcategories =
                        (sec.subcategories && sec.subcategories.length > 0) ||
                        (sec.ruleType === "ATTRIBUTE" && visibleCategories.length > 0);

                      return (
                        <div
                          key={sec.slug}
                          className="border-b border-[#e7e2da]/70 py-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/${sec.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              style={
                                sec.accentColor
                                  ? { color: sec.accentColor }
                                  : undefined
                              }
                              className={`flex-1 py-2 text-sm font-semibold tracking-wider uppercase flex items-center gap-1.5 ${
                                isSale ? "text-rose-700" : "text-stone-900"
                              }`}
                            >
                              {isSale && <Percent className="h-3.5 w-3.5" />}
                              <span>{sec.name}</span>
                            </Link>

                            {hasSubcategories && (
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                aria-label={`Alternar categorías de ${sec.name}`}
                                onClick={() =>
                                  setMobileExpandedSection((prev) =>
                                    prev === sec.slug ? null : sec.slug
                                  )
                                }
                                className="p-2 text-stone-600 hover:text-stone-900"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {hasSubcategories && isExpanded && (
                            <ul className="pl-3 pb-2 space-y-1">
                              {visibleCategories.map((cat) => (
                                <li key={cat.id}>
                                  <Link
                                    href={`/${sec.slug}?categoria=${encodeURIComponent(
                                      cat.slug
                                    )}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block py-1.5 text-xs text-stone-600 hover:text-stone-950"
                                  >
                                    {cat.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    }))}

                <div className="pt-2 space-y-1">
                  <Link
                    href="/catalogo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-sm font-semibold tracking-wider uppercase text-stone-800"
                  >
                    Ver todo el catálogo
                  </Link>
                  <Link
                    href="/promociones"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-stone-700"
                  >
                    Promociones bancarias
                  </Link>
                </div>
              </nav>
            </div>

            <div className="border-t border-[#e7e2da] pt-4">
              <Link
                href="/cuenta"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-semibold text-stone-800"
              >
                <User className="h-4 w-4" />
                <span>Mi Cuenta y Pedidos</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
