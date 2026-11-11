"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import {
  getUnreadReleasesCount,
} from "../../../lib/changelog/releases";
import { useAdminNav } from "../navigation/AdminNavContext";
import { AdminWhatsNewModal } from "./AdminWhatsNewModal";

interface AdminWhatsNewTriggerProps {
  userId?: number | string | null;
  className?: string;
  variant?: "button" | "menu-item";
}

export function AdminWhatsNewTrigger({
  userId: propUserId,
  className = "",
  variant = "button",
}: AdminWhatsNewTriggerProps) {
  const { userId: navUserId } = useAdminNav();
  const userId = propUserId ?? navUserId;

  const [unreadCount, setUnreadCount] = useState<number>(() => {
    return getUnreadReleasesCount(userId);
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const checkUnread = useCallback(() => {
    setUnreadCount(getUnreadReleasesCount(userId));
  }, [userId]);

  useEffect(() => {
    checkUnread();
    const handleUpdate = () => checkUnread();
    window.addEventListener("app_changelog_updated", handleUpdate);
    return () => window.removeEventListener("app_changelog_updated", handleUpdate);
  }, [checkUnread]);

  if (variant === "menu-item") {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer ${className}`}
        >
          <span className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber-400" aria-hidden="true" />
            <span>Novedades del Sistema</span>
          </span>
          {unreadCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-extrabold text-[10px]">
              {unreadCount} nueva{unreadCount > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500 font-normal">Historial</span>
          )}
        </button>

        <AdminWhatsNewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userId={userId}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        aria-label={
          unreadCount > 0
            ? `Ver novedades del sistema (${unreadCount} nueva${unreadCount > 1 ? "s" : ""})`
            : "Ver historial de novedades del sistema"
        }
        title="Novedades y Registro de Cambios"
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer ${
          unreadCount > 0
            ? "border-amber-400/50 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 shadow-xs"
            : "border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900"
        } ${className}`}
      >
        <Sparkles
          size={14}
          className={unreadCount > 0 ? "text-amber-400 animate-pulse" : "text-zinc-400"}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">Novedades</span>
        {unreadCount > 0 && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        )}
      </button>

      <AdminWhatsNewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
      />
    </>
  );
}
