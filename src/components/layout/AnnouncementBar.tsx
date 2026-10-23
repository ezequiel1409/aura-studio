"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { AnnouncementBarConfig } from "../../services/settings.service";

interface AnnouncementBarProps {
  config?: AnnouncementBarConfig | null;
}

export function AnnouncementBar({ config }: AnnouncementBarProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nowMs = Date.now();
  const rawItems = config?.messages || config?.items || [];
  const validItems = rawItems.filter((item) => {
    if (!item.text?.trim()) return false;
    if (item.startsAt) {
      const startMs =
        typeof item.startsAt === "number"
          ? item.startsAt
          : Date.parse(item.startsAt);
      if (!Number.isNaN(startMs) && startMs > nowMs) return false;
    }
    if (item.endsAt) {
      const endMs =
        typeof item.endsAt === "number" ? item.endsAt : Date.parse(item.endsAt);
      if (!Number.isNaN(endMs) && endMs < nowMs) return false;
    }
    return true;
  });

  useEffect(() => {
    if (!config?.enabled || validItems.length <= 1 || isPaused) return;
    const intervalSec = Math.max(6, config.intervalSeconds || 6);
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validItems.length);
    }, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [config?.enabled, config?.intervalSeconds, validItems.length, isPaused]);

  if (!config?.enabled || validItems.length === 0) {
    return null;
  }

  const current = validItems[currentIndex % validItems.length];

  return (
    <div
      role="region"
      aria-label="Anuncios y beneficios destacados"
      className="w-full h-9 sm:h-10 bg-stone-900 text-stone-100 border-b border-stone-800 px-3 flex items-center justify-center text-xs"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-6xl w-full flex items-center justify-between gap-2">
        {validItems.length > 1 ? (
          <button
            type="button"
            onClick={() =>
              setCurrentIndex(
                (prev) => (prev - 1 + validItems.length) % validItems.length
              )
            }
            aria-label="Anuncio anterior"
            className="p-1 text-stone-400 hover:text-white rounded focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="w-5" />
        )}

        <div className="flex-1 text-center truncate font-medium tracking-wide">
          {current.href ? (
            <Link prefetch={false}
              href={current.href}
              className="hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-300 rounded-xs px-1"
            >
              {current.text}
            </Link>
          ) : (
            <span>{current.text}</span>
          )}
        </div>

        {validItems.length > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={
                isPaused
                  ? "Reanudar rotación de anuncios"
                  : "Pausar rotación de anuncios"
              }
              className="p-1 text-stone-400 hover:text-white rounded focus-visible:outline-2 focus-visible:outline-amber-300"
            >
              {isPaused ? (
                <Play className="h-3 w-3" />
              ) : (
                <Pause className="h-3 w-3" />
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) => (prev + 1) % validItems.length)
              }
              aria-label="Siguiente anuncio"
              className="p-1 text-stone-400 hover:text-white rounded focus-visible:outline-2 focus-visible:outline-amber-300"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span className="w-5" />
        )}
      </div>
    </div>
  );
}
