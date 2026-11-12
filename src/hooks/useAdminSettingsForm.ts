"use client";

import { useCallback, useState } from "react";
import { useAutoDismiss } from "./useAutoDismiss";

export interface AdminFeedbackState {
  type: "ok" | "error";
  text: string;
}

export interface UseAdminSettingsFormOptions {
  endpoint?: string;
  method?: "PUT" | "PATCH" | "POST";
  autoDismissMs?: number;
  defaultSuccessMessage?: string;
}

/**
 * Estado unificado de guardado y feedback para formularios de configuración del admin.
 */
export function useAdminSettingsForm(options: UseAdminSettingsFormOptions = {}) {
  const {
    endpoint = "/api/admin/settings",
    method = "PUT",
    autoDismissMs = 5000,
    defaultSuccessMessage = "Configuración guardada con éxito.",
  } = options;

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedbackState | null>(null);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  useAutoDismiss(feedback?.type === "ok" ? feedback.text : null, clearFeedback, autoDismissMs);

  const saveSettings = useCallback(
    async <TResponse extends { ok?: boolean; error?: string }>(
      payload: unknown,
      successMessage = defaultSuccessMessage
    ): Promise<TResponse | null> => {
      setSaving(true);
      setFeedback(null);

      try {
        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        let data: TResponse | null = null;
        try {
          data = (await res.json()) as TResponse;
        } catch {
          data = null;
        }

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "No se pudo guardar la configuración.");
        }

        setFeedback({ type: "ok", text: successMessage });
        return data;
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text:
            err instanceof Error && err.message
              ? err.message
              : "Error de conexión al guardar.",
        });
        return null;
      } finally {
        setSaving(false);
      }
    },
    [endpoint, method, defaultSuccessMessage]
  );

  return {
    saving,
    feedback,
    setFeedback,
    clearFeedback,
    saveSettings,
  };
}
