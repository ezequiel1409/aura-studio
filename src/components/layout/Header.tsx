"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { parseProductCode } from "../../domain/product/rules";

interface HeaderProps {
  brandName?: string;
  initialSearch?: string;
}

export function Header({ brandName = "AURA STUDIO", initialSearch = "" }: HeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/");
      return;
    }

    // BR-24: Búsqueda por código (#023 o 023) lleva directo a esa prenda
    const codeNumber = parseProductCode(trimmed);
    if (codeNumber !== null) {
      const paddedCode = codeNumber.toString().padStart(3, "0");
      router.push(`/p/${paddedCode}`);
      return;
    }

    // Búsqueda por texto filtra en el catálogo
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-stone-50/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Marca / Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-700/80 transition-transform group-hover:scale-110" />
          <span className="font-serif text-xl tracking-[0.2em] font-semibold text-stone-900 uppercase">
            {brandName}
          </span>
        </Link>

        {/* Buscador por código o texto (BR-24) */}
        <form onSubmit={handleSearch} className="relative w-44 sm:w-72">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar o #código..."
            className="w-full rounded-full border border-stone-300 bg-white/90 py-1.5 pl-8 pr-3 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stone-800 focus:bg-white focus:outline-none sm:text-sm"
          />
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
        </form>
      </div>
    </header>
  );
}

