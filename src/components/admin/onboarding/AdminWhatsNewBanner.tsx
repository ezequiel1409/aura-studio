"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Check, ArrowRight, X } from "lucide-react";
import {
  ADMIN_CHANGELOG_RELEASES,
  AdminReleaseItem,
  getAcknowledgedReleaseIds,
  acknowledgeRelease,
} from "../../../lib/changelog/releases";
import { useAdminNav } from "../navigation/AdminNavContext";
import { AdminWhatsNewModal } from "./AdminWhatsNewModal";

interface AdminWhatsNewBannerProps {
  userId?: number | string | null;
}

export function AdminWhatsNewBanner({ userId: propUserId }: AdminWhatsNewBannerProps) {
  const { userId: navUserId } = useAdminNav();
  const userId = propUserId ?? navUserId;

  const [unreadReleases, setUnreadReleases] = useState<AdminReleaseItem[]>(() => {
    if (typeof window === "undefined") return ADMIN_CHANGELOG_RELEASES;
    const acknowledged = getAcknowledgedReleaseIds(userId);
    return ADMIN_CHANGELOG_RELEASES.filter((r) => !acknowledged.includes(r.id));
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | undefined>(undefined);
  const [dismissedTemporarily, setDismissedTemporarily] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const calculateUnread = useCallback(() => {
    const acknowledged = getAcknowledgedReleaseIds(userId);
    const unread = ADMIN_CHANGELOG_RELEASES.filter((r) => !acknowledged.includes(r.id));
    setUnreadReleases(unread);
    if (unread.length === 0) {
      setIsDismissed(true);
    }
  }, [userId]);

  useEffect(() => {
    calculateUnread();
    const handleUpdate = () => calculateUnread();
    window.addEventListener("app_changelog_updated", handleUpdate);
    return () => window.removeEventListener("app_changelog_updated", handleUpdate);
  }, [calculateUnread]);

  // Si ya se descartó, no hay novedades pendientes o el usuario minimizó el aviso
  if (isDismissed || unreadReleases.length === 0 || dismissedTemporarily) {
    return (
      <AdminWhatsNewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        initialReleaseId={selectedReleaseId}
      />
    );
  }

  const latestUnread = unreadReleases[0];

  const handleAcknowledge = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Desaparición inmediata (0ms)
    setIsDismissed(true);
    setUnreadReleases([]);
    if (latestUnread) {
      acknowledgeRelease(latestUnread.id, userId);
    }
  };

  const handleOpenDetails = () => {
    setSelectedReleaseId(latestUnread.id);
    setIsModalOpen(true);
  };

  const handleCloseTemporarily = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDismissed(true);
    setDismissedTemporarily(true);
  };

  return (
    <>
      <section
        aria-label="Aviso de novedades del sistema"
        className="admin-whats-new-banner mb-6 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in"
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="banner-icon-box p-2.5 rounded-xl shrink-0">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="banner-pill-badge text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                Nueva Actualización
              </span>
              <span className="banner-meta text-xs font-mono font-bold">
                {latestUnread.version} • {latestUnread.category}
              </span>
            </div>
            <h2 className="banner-title text-sm sm:text-base font-bold truncate">
              {latestUnread.title}
            </h2>
            <p className="banner-summary text-xs line-clamp-1 leading-relaxed">
              {latestUnread.summary}
            </p>
          </div>
        </div>

        <div className="banner-actions-divider flex flex-wrap items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0">
          <button
            type="button"
            onClick={handleOpenDetails}
            className="banner-primary-btn px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ver cambios (Antes vs Ahora)</span>
            <ArrowRight size={13} />
          </button>

          <button
            type="button"
            onClick={handleAcknowledge}
            className="banner-ack-btn px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Marcar como comprendido para no volver a mostrar este aviso"
          >
            <Check size={14} />
            <span>Ya lo entendí</span>
          </button>

          <button
            type="button"
            onClick={handleCloseTemporarily}
            aria-label="Ocultar aviso por ahora"
            className="banner-close-btn p-2 rounded-xl transition-colors cursor-pointer"
            title="Ocultar por ahora"
          >
            <X size={16} />
          </button>
        </div>
      </section>

      <AdminWhatsNewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        initialReleaseId={selectedReleaseId}
      />
    </>
  );
}
