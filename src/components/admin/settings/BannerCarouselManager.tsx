"use client";

import { useId, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { HomeBanner, Promotion } from "../../../domain/promotion/types";

interface BannerCarouselManagerProps {
  banners: HomeBanner[];
  onBannersChange: (banners: HomeBanner[]) => void;
  activePromotions?: Promotion[];
  heroTitle: string;
  heroSubtitle: string;
  heroBannerUrl: string;
  onHeroTitleChange: (v: string) => void;
  onHeroSubtitleChange: (v: string) => void;
  onHeroBannerUrlChange: (v: string) => void;
}

interface BannerSlideDraft {
  id?: number;
  title: string;
  subtitle: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  promotionId?: number | null;
  isActive: boolean;
  position: number;
}

const EMPTY_DRAFT: BannerSlideDraft = {
  title: "",
  subtitle: "",
  desktopImageUrl: "",
  mobileImageUrl: "",
  ctaLabel: "Explorar colección",
  ctaHref: "/catalogo",
  promotionId: null,
  isActive: true,
  position: 0,
};

export function BannerCarouselManager({
  banners,
  onBannersChange,
  activePromotions = [],
  heroTitle,
  heroSubtitle,
  heroBannerUrl,
  onHeroTitleChange,
  onHeroSubtitleChange,
  onHeroBannerUrlChange,
}: BannerCarouselManagerProps) {
  const [editingSlide, setEditingSlide] = useState<BannerSlideDraft | null>(null);
  const [slideToDelete, setSlideToDelete] = useState<HomeBanner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showFallbackSection, setShowFallbackSection] = useState(false);

  const desktopFileId = useId();
  const mobileFileId = useId();

  const activeCount = banners.filter((b) => b.isActive).length;

  // Manejo de carga de archivo local para imagen de escritorio
  const handleDesktopFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setFormError("La imagen de escritorio supera los 3 MB. Se recomienda comprimirla.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (editingSlide) {
        setEditingSlide({ ...editingSlide, desktopImageUrl: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  // Manejo de carga de archivo local para imagen móvil
  const handleMobileFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setFormError("La imagen móvil supera los 3 MB. Se recomienda comprimirla.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (editingSlide) {
        setEditingSlide({ ...editingSlide, mobileImageUrl: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartCreate = () => {
    setFormError(null);
    setEditingSlide({
      ...EMPTY_DRAFT,
      position: banners.length,
    });
  };

  const handleStartEdit = (banner: HomeBanner) => {
    setFormError(null);
    setEditingSlide({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle || "",
      desktopImageUrl: banner.desktopImageUrl || "",
      mobileImageUrl: banner.mobileImageUrl || "",
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref,
      promotionId: null,
      isActive: banner.isActive,
      position: banner.position,
    });
  };

  const handleCancelEdit = () => {
    setEditingSlide(null);
    setFormError(null);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    if (!editingSlide.title.trim()) {
      setFormError("El título del slide es obligatorio.");
      return;
    }
    if (!editingSlide.desktopImageUrl.trim()) {
      setFormError("La URL de imagen para escritorio es obligatoria.");
      return;
    }
    if (!editingSlide.ctaLabel.trim()) {
      setFormError("El texto del botón es obligatorio.");
      return;
    }
    if (!editingSlide.ctaHref.trim()) {
      setFormError("El enlace de destino es obligatorio.");
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_banner",
          id: editingSlide.id,
          placement: "HOME_HERO",
          title: editingSlide.title.trim(),
          subtitle: editingSlide.subtitle.trim() || null,
          desktopImageUrl: editingSlide.desktopImageUrl.trim(),
          mobileImageUrl: editingSlide.mobileImageUrl.trim() || editingSlide.desktopImageUrl.trim(),
          ctaLabel: editingSlide.ctaLabel.trim(),
          ctaHref: editingSlide.ctaHref.trim(),
          promotionId: editingSlide.promotionId || null,
          isActive: editingSlide.isActive,
          position: editingSlide.position,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar el slide.");
      }

      onBannersChange(data.banners);
      setEditingSlide(null);
      setFeedback({
        type: "ok",
        text: editingSlide.id
          ? "Slide actualizado correctamente en el carrusel."
          : "Nuevo slide agregado y publicado en el carrusel de inicio.",
      });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el slide.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (banner: HomeBanner) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_banner_active",
          id: banner.id,
        }),
      });
      const data = await res.json();
      if (data.ok && data.banners) {
        onBannersChange(data.banners);
        setFeedback({
          type: "ok",
          text: `Slide "${banner.title}" ${banner.isActive ? "pausado" : "activado"} en el carrusel.`,
        });
      }
    } catch {
      setFeedback({ type: "error", text: "Error al actualizar estado del banner." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveSlide = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;

    const reordered = [...banners];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    const updated = reordered.map((b, idx) => ({ ...b, position: idx }));

    onBannersChange(updated);

    try {
      await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder_banners",
          banners: updated,
        }),
      });
    } catch {
      // revert if failed
    }
  };

  const handleDeleteSlide = async () => {
    if (!slideToDelete) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/promotions?id=${slideToDelete.id}&target=banner`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok && data.banners) {
        onBannersChange(data.banners);
        setFeedback({ type: "ok", text: "Slide eliminado del carrusel." });
      }
      setSlideToDelete(null);
    } catch {
      setFeedback({ type: "error", text: "Error al eliminar el slide." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPromotion = (promoId: number) => {
    const promo = activePromotions.find((p) => p.id === promoId);
    if (!promo || !editingSlide) return;
    setEditingSlide({
      ...editingSlide,
      promotionId: promo.id,
      title: editingSlide.title || promo.title,
      subtitle: editingSlide.subtitle || promo.benefitSummary,
      ctaLabel: editingSlide.ctaLabel || "Aprovechar beneficio",
      ctaHref: `/promociones/${promo.slug}`,
    });
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-5">
      {/* Encabezado de la Sección */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-amber-400 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-100">
              Carrusel de Banners de Portada (Hero Showcase)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configurá múltiples slides rotativos para la vidriera principal. Podés adjuntar imágenes de escritorio y móvil, títulos, descripciones y botones con enlace directo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300">
            {activeCount} {activeCount === 1 ? "slide activo" : "slides activos"} ({banners.length}/5)
          </span>

          <button
            type="button"
            disabled={banners.length >= 5 || Boolean(editingSlide)}
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
          >
            <Plus size={14} />
            <span>Agregar slide</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2.5 ${
            feedback.type === "ok"
              ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
              : "bg-rose-950/60 border border-rose-800 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "ok" ? (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle size={15} className="shrink-0 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-100 p-0.5"
            aria-label="Cerrar notificación"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Formulario de Creación / Edición de Slide (Drawer/Card) */}
      {editingSlide && (
        <form
          onSubmit={handleSaveSlide}
          className="rounded-2xl border border-amber-400/40 bg-zinc-950/90 p-4 sm:p-5 space-y-4 shadow-lg animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                {editingSlide.id ? "Editar Slide del Carrusel" : "Nuevo Slide para el Carrusel"}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-800"
              aria-label="Cerrar editor de slide"
            >
              <X size={16} />
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Selector rápido de Promoción Bancaria (opcional) */}
          {activePromotions.length > 0 && (
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
              <label htmlFor="promo-select" className="block text-[11px] font-semibold text-zinc-300">
                ⚡ Vincular con Promoción Bancaria existente (Opcional):
              </label>
              <select
                id="promo-select"
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val) handleSelectPromotion(val);
                }}
                defaultValue=""
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
              >
                <option value="">-- Seleccionar beneficio para autocompletar --</option>
                {activePromotions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.benefitSummary})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Título */}
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="slide-title" className="block text-xs font-medium text-zinc-200">
                Título Principal del Slide *
              </label>
              <input
                id="slide-title"
                type="text"
                value={editingSlide.title}
                onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                placeholder="Ej: Nueva Colección 2026 · Edición Limitada"
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Subtítulo / Bajada */}
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="slide-subtitle" className="block text-xs font-medium text-zinc-200">
                Bajada o Subtítulo descriptivo (opcional)
              </label>
              <input
                id="slide-subtitle"
                type="text"
                value={editingSlide.subtitle}
                onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                placeholder="Ej: Siluetas contemporáneas en tonos neutros con hasta 3 cuotas sin interés."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Imagen Escritorio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="slide-desktop-url" className="text-xs font-medium text-zinc-200">
                  Foto para Computadora (Desktop) *
                </label>
                <label
                  htmlFor={desktopFileId}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer font-semibold"
                >
                  <Upload size={12} />
                  <span>Subir archivo</span>
                </label>
                <input
                  id={desktopFileId}
                  type="file"
                  accept="image/*"
                  onChange={handleDesktopFileUpload}
                  className="hidden"
                />
              </div>
              <input
                id="slide-desktop-url"
                type="url"
                value={editingSlide.desktopImageUrl}
                onChange={(e) => setEditingSlide({ ...editingSlide, desktopImageUrl: e.target.value })}
                placeholder="https://ejemplo.com/banner-desktop.jpg"
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
              />
              {editingSlide.desktopImageUrl && (
                <div className="relative h-24 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editingSlide.desktopImageUrl}
                    alt="Vista previa escritorio"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] bg-black/75 text-zinc-300 px-1.5 py-0.5 rounded">
                    Escritorio
                  </span>
                </div>
              )}
            </div>

            {/* Imagen Celular */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="slide-mobile-url" className="text-xs font-medium text-zinc-200">
                  Foto para Celular (Móvil vertical)
                </label>
                <label
                  htmlFor={mobileFileId}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer font-semibold"
                >
                  <Upload size={12} />
                  <span>Subir archivo</span>
                </label>
                <input
                  id={mobileFileId}
                  type="file"
                  accept="image/*"
                  onChange={handleMobileFileUpload}
                  className="hidden"
                />
              </div>
              <input
                id="slide-mobile-url"
                type="url"
                value={editingSlide.mobileImageUrl}
                onChange={(e) => setEditingSlide({ ...editingSlide, mobileImageUrl: e.target.value })}
                placeholder="Opcional. Si queda vacío, usa la de escritorio."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
              />
              {editingSlide.mobileImageUrl && (
                <div className="relative h-24 w-20 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editingSlide.mobileImageUrl}
                    alt="Vista previa móvil"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] bg-black/75 text-zinc-300 px-1 py-0.5 rounded">
                    Móvil
                  </span>
                </div>
              )}
            </div>

            {/* Texto del Botón (CTA) */}
            <div className="space-y-1">
              <label htmlFor="slide-cta-label" className="block text-xs font-medium text-zinc-200">
                Texto del Botón *
              </label>
              <input
                id="slide-cta-label"
                type="text"
                value={editingSlide.ctaLabel}
                onChange={(e) => setEditingSlide({ ...editingSlide, ctaLabel: e.target.value })}
                placeholder="Ej: Explorar colección"
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Enlace del Botón (CTA Href) */}
            <div className="space-y-1">
              <label htmlFor="slide-cta-href" className="block text-xs font-medium text-zinc-200">
                Enlace de Destino (URL o ruta interna) *
              </label>
              <input
                id="slide-cta-href"
                type="text"
                value={editingSlide.ctaHref}
                onChange={(e) => setEditingSlide({ ...editingSlide, ctaHref: e.target.value })}
                placeholder="/catalogo, /sale o /promociones"
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Activo / Publicado */}
            <div className="sm:col-span-2 pt-2">
              <label className="inline-flex items-center gap-2.5 text-xs text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSlide.isActive}
                  onChange={(e) => setEditingSlide({ ...editingSlide, isActive: e.target.checked })}
                  className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
                />
                <span className="font-semibold">Slide activo en el carrusel</span>
                <span className="text-[11px] text-zinc-500">
                  (Si se desactiva, queda guardado en borrador sin mostrarse al público)
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Guardar Slide</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Listado de Slides en Carrusel */}
      {banners.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-zinc-800 text-center space-y-2 bg-zinc-950/40">
          <ImageIcon size={28} className="mx-auto text-zinc-600" />
          <p className="text-xs font-semibold text-zinc-300">
            Aún no agregaste slides personalizados al carrusel
          </p>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
            La tienda pública está mostrando la portada de respaldo por defecto configurada abajo. Agregá tu primer banner para activar la rotación automática.
          </p>
          <button
            type="button"
            onClick={handleStartCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors mt-2"
          >
            <Plus size={14} />
            <span>Crear primer slide</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Secuencia de rotación ({banners.length} {banners.length === 1 ? "slide" : "slides"} configurados)
          </span>

          <ul className="space-y-2 list-none p-0 m-0">
            {banners.map((banner, idx) => (
              <li
                key={banner.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Badge de Orden */}
                  <span className="text-[10px] font-mono font-bold text-zinc-500 w-5 shrink-0 text-center">
                    #{idx + 1}
                  </span>

                  {/* Thumbnail */}
                  <div className="relative h-12 w-20 shrink-0 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.desktopImageUrl || undefined}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                    {banner.mobileImageUrl && banner.mobileImageUrl !== banner.desktopImageUrl && (
                      <span
                        className="absolute bottom-0.5 right-0.5 bg-black/80 text-amber-300 text-[8px] px-1 rounded font-mono"
                        title="Incluye foto vertical para móvil"
                      >
                        📱 Móvil
                      </span>
                    )}
                  </div>

                  {/* Información */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-100 truncate" title={banner.title}>
                      {banner.title}
                    </p>
                    {banner.subtitle && (
                      <p className="text-[11px] text-zinc-400 truncate" title={banner.subtitle}>
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                      <span className="font-medium text-amber-300/90">
                        {banner.ctaLabel}
                      </span>
                      <span>→</span>
                      <span className="font-mono truncate max-w-[120px]">{banner.ctaHref}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones de la fila */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center border-t sm:border-t-0 border-zinc-800/80 pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Toggle Activo */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleToggleActive(banner)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      banner.isActive
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800 hover:bg-emerald-900"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {banner.isActive ? "Activo" : "Pausado"}
                  </button>

                  {/* Flechas de orden */}
                  <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                    <button
                      type="button"
                      disabled={idx === 0 || isLoading}
                      onClick={() => handleMoveSlide(idx, "up")}
                      aria-label="Subir posición"
                      className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === banners.length - 1 || isLoading}
                      onClick={() => handleMoveSlide(idx, "down")}
                      aria-label="Bajar posición"
                      className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  {/* Editar */}
                  <button
                    type="button"
                    onClick={() => handleStartEdit(banner)}
                    className="p-1.5 rounded-lg border border-zinc-800 text-zinc-300 hover:text-amber-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label={`Editar slide ${banner.title}`}
                  >
                    <Edit3 size={14} />
                  </button>

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => setSlideToDelete(banner)}
                    className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label={`Eliminar slide ${banner.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {slideToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle size={18} />
              <span>¿Eliminar este banner del carrusel?</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Estás a punto de eliminar el slide <strong className="text-white">&ldquo;{slideToDelete.title}&rdquo;</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSlideToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDeleteSlide}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Eliminar definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portada de Respaldo / Fallback (Acordeón Plegable) */}
      <div className="pt-3 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={() => setShowFallbackSection((prev) => !prev)}
          className="flex items-center justify-between w-full text-left text-xs font-semibold text-zinc-300 hover:text-amber-400 transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span>Portada de Respaldo / Fallback (Home Estática)</span>
            <span className="text-[10px] text-zinc-500 font-normal">
              (Se usa si se pausan todos los slides)
            </span>
          </span>
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${showFallbackSection ? "rotate-180" : ""}`}
          />
        </button>

        {showFallbackSection && (
          <div className="space-y-3 pt-3 mt-2 border-t border-zinc-800/60 animate-in fade-in duration-150">
            <div>
              <label htmlFor="fallback-hero-title" className="block text-xs font-medium text-zinc-300 mb-1">
                Título de Respaldo
              </label>
              <input
                id="fallback-hero-title"
                type="text"
                value={heroTitle}
                onChange={(e) => onHeroTitleChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="fallback-hero-subtitle" className="block text-xs font-medium text-zinc-300 mb-1">
                Bajada o Subtítulo de Respaldo
              </label>
              <input
                id="fallback-hero-subtitle"
                type="text"
                value={heroSubtitle}
                onChange={(e) => onHeroSubtitleChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="fallback-hero-url" className="block text-xs font-medium text-zinc-300 mb-1">
                URL de Imagen de Fondo de Respaldo
              </label>
              <input
                id="fallback-hero-url"
                type="url"
                value={heroBannerUrl || ""}
                onChange={(e) => onHeroBannerUrlChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
