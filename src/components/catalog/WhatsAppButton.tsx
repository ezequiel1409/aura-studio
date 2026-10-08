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
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full border border-stone-300 bg-stone-100 px-6 py-3.5 text-center text-xs font-semibold tracking-wider text-stone-500 uppercase cursor-not-allowed select-none"
      >
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
        <span>Pieza agotada</span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`${label} - Abre chat de WhatsApp con mensaje prearmado`}
      className="group flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[#155e42] px-6 py-3.5 text-xs font-semibold tracking-widest text-white uppercase shadow-md transition-all duration-200 hover:bg-[#0f4631] hover:shadow-lg active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#155e42] focus-visible:outline-offset-2"
    >
      <MessageCircle aria-hidden="true" className="h-5 w-5 transition-transform group-hover:scale-110" />
      <span>{label}</span>
    </a>
  );
}
