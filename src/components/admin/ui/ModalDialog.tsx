"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
} as const;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: keyof typeof SIZE_CLASSES;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  closeDisabled?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  headerIcon?: React.ReactNode;
  footer?: React.ReactNode;
  role?: "dialog" | "alertdialog";
  children: React.ReactNode;
}

/**
 * Primitiva modal accesible con foco inicial, trapping de Tab, cierre por Escape
 * y botón de cierre de mínimo 44×44px compatible con tema claro y oscuro del admin.
 */
export function ModalDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  closeDisabled = false,
  initialFocusRef,
  headerIcon,
  footer,
  role = "dialog",
  children,
}: ModalDialogProps) {
  const autoTitleId = useId();
  const autoDescId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables && focusables.length > 0) {
        focusables[0].focus();
      } else {
        panelRef.current?.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape && !closeDisabled) {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first || !panelRef.current.contains(document.activeElement)) {
            event.preventDefault();
            last.focus();
          }
        } else if (
          document.activeElement === last ||
          !panelRef.current.contains(document.activeElement)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, closeDisabled, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={() => {
        if (closeOnBackdrop && !closeDisabled) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={autoTitleId}
        aria-describedby={subtitle ? autoDescId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${SIZE_CLASSES[size]} max-h-[90vh] flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            {headerIcon && <div className="shrink-0 mt-0.5">{headerIcon}</div>}
            <div className="min-w-0">
              <h2 id={autoTitleId} className="text-base font-bold text-zinc-100 leading-snug">
                {title}
              </h2>
              {subtitle && (
                <p id={autoDescId} className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Cerrar diálogo"
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 inline-flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-4 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-4 sm:px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/60 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
