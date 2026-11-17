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
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Cabecera estándar de páginas del backoffice con soporte opcional de breadcrumb/eyebrow,
 * ícono, enlace de retorno sin recargas y zona de acciones primarias consistente.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = "Volver",
  icon,
  badge,
  actions,
  className = "",
}: AdminPageHeaderProps) {
  return (
    <header
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800 ${className}`.trim()}
    >
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
        <div className="flex items-center gap-2.5 flex-wrap mt-1">
          {icon && <span className="text-amber-400 shrink-0">{icon}</span>}
          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-zinc-100 truncate">
            {title}
          </h1>
          {badge}
        </div>
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
