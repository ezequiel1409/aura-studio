"use client";

import { MessageCircle } from "lucide-react";
import { trackWhatsAppClick } from "../analytics/AnalyticsTracker";

interface WhatsAppButtonProps {
  productId: number;
  url: string;
  label?: string;
  disabled?: boolean;
}

export function WhatsAppButton({
  productId,
  url,
  label = "Consultar por WhatsApp",
  disabled = false,
}: WhatsAppButtonProps) {
  const handleClick = () => {
    trackWhatsAppClick(productId);
  };

  if (disabled) {
    return (
      <button
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-full bg-stone-200 py-3.5 px-6 font-medium text-stone-400 shadow-none"
      >
        <MessageCircle className="h-5 w-5" />
        <span>Pieza no disponible</span>
      </button>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-full bg-emerald-700 py-3.5 px-6 font-medium text-white shadow-md transition-all duration-200 hover:bg-emerald-800 hover:shadow-lg active:scale-[0.98]"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="text-sm font-semibold tracking-wide uppercase">{label}</span>
    </a>
  );
}

