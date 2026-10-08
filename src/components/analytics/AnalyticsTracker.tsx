"use client";

import { useEffect } from "react";
import { AnalyticsEventType } from "../../services/analytics.service";

interface AnalyticsTrackerProps {
  type: AnalyticsEventType;
  productId?: number;
  categoryId?: number;
}

export function AnalyticsTracker({ type, productId, categoryId }: AnalyticsTrackerProps) {
  useEffect(() => {
    // Genera o recupera sessionId anónimo en el navegador
    let sessionId = localStorage.getItem("aura_session_id");
    if (!sessionId) {
      sessionId = `sess_${Math.random().toString(36).substring(2)}_${Date.now()}`;
      localStorage.setItem("aura_session_id", sessionId);
    }

    const payload = JSON.stringify({
      type,
      productId,
      categoryId,
      sessionId,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [type, productId, categoryId]);

  return null;
}

/**
 * Función auxiliar para registrar clics en WhatsApp (conversión BR-39)
 */
export function trackWhatsAppClick(productId: number) {
  if (typeof window === "undefined") return;

  let sessionId = localStorage.getItem("aura_session_id");
  if (!sessionId) {
    sessionId = `sess_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    localStorage.setItem("aura_session_id", sessionId);
  }

  const payload = JSON.stringify({
    type: "whatsapp_click",
    productId,
    sessionId,
  });

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/track", blob);
  } else {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

