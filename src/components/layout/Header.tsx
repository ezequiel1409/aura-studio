"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, User } from "lucide-react";
import { parseProductCode } from "../../domain/product/rules";
import { CartHeaderButton } from "../cart/CartHeaderButton";

interface HeaderProps {
  brandName?: string;
  logoUrl?: string | null;
  initialSearch?: string;
}

export function Header({
  brandName = "Aura Studio",
  logoUrl,
  initialSearch = "",
}: HeaderProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      startTransition(() => {
        router.push("/", { scroll: false });
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

    // Búsqueda por texto en catálogo con transición fluida
    startTransition(() => {
      router.push(`/?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    });
  };

  const clearSearch = () => {
    setQuery("");
    startTransition(() => {
      router.push("/", { scroll: false });
    });
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full border-b border-[#e7e2da] bg-[#faf8f5]/90 backdrop-blur-md transition-colors"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Marca / Logotipo editorial */}
        <Link
          href="/"
          aria-label={`${brandName} - Inicio del catálogo`}
          className="group flex items-center focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-stone-900"
        >
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt={brandName}
              className="h-8 sm:h-9 w-auto max-h-9 max-w-[150px] sm:max-w-[220px] object-contain transition-opacity group-hover:opacity-85"
            />
          ) : (
            <div className="flex flex-col">
              <span className="font-serif text-2xl tracking-[0.22em] font-normal text-stone-900 uppercase transition-opacity group-hover:opacity-80">
                {brandName}
              </span>
              <span className="text-[9px] tracking-[0.3em] font-medium text-stone-500 uppercase">
                Showroom & Archivo
              </span>
            </div>
          )}
        </Link>

        {/* Acciones de cabecera: Buscador (BR-24) y Carrito (BR-40) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <form
            role="search"
            onSubmit={handleSearch}
            className="relative w-40 sm:w-72"
          >
            <label htmlFor="catalog-search" className="sr-only">
              Buscar productos por nombre o código numérico
            </label>
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar o #código..."
              autoComplete="off"
              aria-label="Buscar en el catálogo"
              className="w-full rounded-full border border-[#d8d2c7] bg-white/80 py-2 pl-9 pr-8 text-xs text-stone-900 placeholder:text-stone-400 shadow-xs transition-all focus:border-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 sm:text-sm"
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
    </header>
  );
}
