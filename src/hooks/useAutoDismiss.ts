"use client";

import { useEffect, useRef } from "react";

/**
 * Ejecuta automáticamente `onDismiss` tras `delayMs` milisegundos mientras `active` sea verdadero/no nulo.
 * Usa un ref actualizado en efecto para evitar reinicios del timer con callbacks en línea.
 */
export function useAutoDismiss<T>(
  value: T | null | undefined | false,
  onDismiss: () => void,
  delayMs = 5000
): void {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const isActive = Boolean(value);

  useEffect(() => {
    if (!isActive || delayMs <= 0) return;

    const timer = window.setTimeout(() => {
      onDismissRef.current();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [isActive, value, delayMs]);
}
