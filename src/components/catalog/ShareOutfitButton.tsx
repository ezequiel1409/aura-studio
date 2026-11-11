"use client";

import { useState } from "react";
import { Share2, Check, MessageCircle, Copy } from "lucide-react";

interface ShareOutfitButtonProps {
  productTitle: string;
  productCode: string;
  brandName: string;
}

export function ShareOutfitButton({
  productTitle,
  productCode,
  brandName,
}: ShareOutfitButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const getShareText = () => {
    return `¡Mirá este producto de ${brandName}! Código ${productCode} - ${productTitle}`;
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = getShareText();

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${productTitle} | ${brandName}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: unknown) {
        // Si el usuario canceló el share nativo, salimos sin error
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    // Si no soporta navigator.share, alternamos el menú de compartir rápido
    setShowDropdown((prev) => !prev);
  };

  const handleCopy = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback silencioso
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${getShareText()}: ${shareUrl}`
  )}`;

  return (
    <div className="relative inline-block w-full sm:w-auto">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Compartir este producto en redes o WhatsApp"
        className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#d8d2c7] bg-white px-4 py-2.5 text-xs font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-stone-900 shadow-2xs"
      >
        <Share2 className="h-4 w-4 text-stone-600" />
        <span>Compartir producto</span>
      </button>

      {showDropdown && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-lg animate-in fade-in duration-150"
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setShowDropdown(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            <span>Enviar por WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-800 hover:bg-stone-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">¡Enlace copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-stone-500" />
                <span>Copiar enlace</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
