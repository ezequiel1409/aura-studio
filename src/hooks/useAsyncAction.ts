"use client";

import { useCallback, useRef, useState } from "react";

export interface UseAsyncActionResult<TArgs extends unknown[], TResult> {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  setError: (message: string | null) => void;
  run: (...args: TArgs) => Promise<TResult | undefined>;
}

/**
 * Encapsula el ciclo de ejecución, bloqueo anti doble-click y captura de error
 * para acciones asíncronas en formularios y paneles del backoffice.
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  fallbackErrorMessage = "No se pudo completar la operación."
): UseAsyncActionResult<TArgs, TResult> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      if (inFlightRef.current) return undefined;
      inFlightRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        return await action(...args);
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message ? err.message : fallbackErrorMessage;
        setError(message);
        return undefined;
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [action, fallbackErrorMessage]
  );

  return { isLoading, error, clearError, setError, run };
}
