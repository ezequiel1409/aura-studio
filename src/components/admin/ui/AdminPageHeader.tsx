"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

/**
 * Cabecera estándar de páginas del backoffice con soporte opcional de breadcrumb/eyebrow,
 * enlace de retorno sin recargas y zona de acciones primarias.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = "Volver",
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-300 transition-colors mb-1.5"
          >
            <ArrowLeft size={14} />
            <span>{backLabel}</span>
          </Link>
        )}
        {eyebrow && (
          <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
            {eyebrow}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl font-serif font-light text-zinc-100 mt-1 truncate">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}
