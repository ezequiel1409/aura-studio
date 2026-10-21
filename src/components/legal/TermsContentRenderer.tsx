import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface TermsContentRendererProps {
  content: string;
  className?: string;
  brandName?: string;
}

/**
 * Parsea fragmentos en línea para detectar enlaces Markdown [texto](url),
 * URLs planas (https://...), negritas (**texto**) y cursivas (*texto*).
 * Construye elementos React puros sin usar dangerouslySetInnerHTML para prevenir XSS.
 */
export function parseInlineTokens(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex que busca tokens especiales:
  // 1: Markdown link: [label](url)
  // 2: Bold: **bold**
  // 3: Plain URL: https?://...
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g;

  const parts = text.split(tokenRegex);
  return parts.map((part, index) => {
    if (!part) return null;

    // 1. Enlace Markdown: [label](url)
    const mdLinkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (mdLinkMatch) {
      const [, label, rawUrl] = mdLinkMatch;
      const url = rawUrl.trim();
      const isInternal = url.startsWith("/") || url.startsWith("#");

      if (isInternal) {
        return (
          <Link
            key={`md-link-${index}`}
            href={url}
            className="text-[#926a3c] font-semibold underline underline-offset-4 hover:text-[#785328] transition-colors"
          >
            {label}
          </Link>
        );
      }

      return (
        <a
          key={`md-link-${index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#926a3c] font-semibold underline underline-offset-4 hover:text-[#785328] transition-colors inline-flex items-center gap-1"
        >
          <span>{label}</span>
          <ExternalLink size={11} className="shrink-0 opacity-70" />
        </a>
      );
    }

    // 2. Negrita: **texto**
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={`bold-${index}`} className="font-semibold text-stone-900">
          {boldMatch[1]}
        </strong>
      );
    }

    // 3. URL plana: https://...
    const urlMatch = part.match(/^https?:\/\/[^\s)]+$/);
    if (urlMatch) {
      const url = urlMatch[0];
      return (
        <a
          key={`plain-url-${index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#926a3c] font-semibold underline underline-offset-4 hover:text-[#785328] transition-colors inline-flex items-center gap-1 break-all"
        >
          <span>{url}</span>
          <ExternalLink size={11} className="shrink-0 opacity-70" />
        </a>
      );
    }

    // Texto plano
    return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
  });
}

/**
 * Renderizador seguro y accesible de Términos y Condiciones Legales.
 * Permite que los comercios redacten cláusulas con hipervínculos, listas y subtítulos.
 */
export function TermsContentRenderer({
  content,
  className = "",
}: TermsContentRendererProps) {
  if (!content || !content.trim()) {
    return null;
  }

  // Dividir por bloques de párrafos (separados por doble salto de línea)
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-5 font-sans leading-relaxed text-stone-800 ${className}`}>
      {blocks.map((block, blockIndex) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split("\n").map((l) => l.trim());

        // 1. Títulos de Cláusulas (ej: "## 1. Título" o "1. Condiciones Generales...")
        const isHeaderMarkdown = trimmed.startsWith("## ") || trimmed.startsWith("### ");
        const isNumberedClauseHeader = /^[0-9]+\.\s+[A-ZÁÉÍÓÚÑ]/.test(lines[0]) && lines.length === 1;

        if (isHeaderMarkdown) {
          const headerText = trimmed.replace(/^#+\s*/, "");
          return (
            <h2
              key={`block-h-${blockIndex}`}
              className="font-serif text-xl sm:text-2xl font-medium text-stone-900 border-b border-[#f0ece1] pb-2 pt-3 first:pt-0"
            >
              {parseInlineTokens(headerText)}
            </h2>
          );
        }

        if (isNumberedClauseHeader) {
          return (
            <h2
              key={`block-num-h-${blockIndex}`}
              className="font-serif text-xl sm:text-2xl font-medium text-stone-900 border-b border-[#f0ece1] pb-2 pt-3 first:pt-0"
            >
              {parseInlineTokens(lines[0])}
            </h2>
          );
        }

        // Si la primera línea es un encabezado numerado pero hay más líneas abajo en el mismo bloque
        if (/^[0-9]+\.\s+[A-ZÁÉÍÓÚÑ]/.test(lines[0]) && lines.length > 1) {
          const [firstLine, ...restLines] = lines;
          return (
            <section key={`block-sec-${blockIndex}`} className="space-y-3 pt-2 first:pt-0">
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-stone-900 border-b border-[#f0ece1] pb-2">
                {parseInlineTokens(firstLine)}
              </h2>
              <div className="space-y-2.5 text-xs sm:text-sm text-stone-700">
                {restLines.map((line, lineIdx) => {
                  if (line.startsWith("- ") || line.startsWith("* ")) {
                    return (
                      <li key={`sec-li-${lineIdx}`} className="list-disc list-inside ml-2">
                        {parseInlineTokens(line.replace(/^[-*]\s+/, ""))}
                      </li>
                    );
                  }
                  return (
                    <p key={`sec-p-${lineIdx}`} className="leading-relaxed">
                      {parseInlineTokens(line)}
                    </p>
                  );
                })}
              </div>
            </section>
          );
        }

        // 2. Listas de viñetas
        const isList = lines.every((l) => l.startsWith("- ") || l.startsWith("* "));
        if (isList) {
          return (
            <ul key={`block-list-${blockIndex}`} className="space-y-1.5 text-xs sm:text-sm pl-2">
              {lines.map((l, lIdx) => (
                <li key={`li-${lIdx}`} className="list-disc list-inside text-stone-700">
                  {parseInlineTokens(l.replace(/^[-*]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        // 3. Párrafo estándar
        return (
          <p
            key={`block-p-${blockIndex}`}
            className="text-xs sm:text-sm text-stone-700 leading-relaxed"
          >
            {lines.map((line, lIdx) => (
              <React.Fragment key={`p-line-${lIdx}`}>
                {parseInlineTokens(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

