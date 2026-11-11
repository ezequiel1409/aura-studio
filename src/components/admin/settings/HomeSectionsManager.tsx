"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Compass,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Loader2,
  Maximize2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  HomeSectionLayout,
  NavigationRuleConfig,
  NavigationRuleType,
  NavigationSection,
  ProductAttributeDefinition,
} from "../../../domain/navigation/types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Category } from "../../../domain/category/types";

interface HomeSectionsManagerProps {
  sections: NavigationSection[];
  onSectionsChange: (sections: NavigationSection[]) => void;
  categories?: Category[];
  attributes?: ProductAttributeDefinition[];
}

const LAYOUT_OPTIONS: Array<{
  id: HomeSectionLayout;
  label: string;
  description: string;
  cols: number;
}> = [
  {
    id: "1_col",
    label: "Ancho Completo (1 Columna)",
    description: "Banner protagonista horizontal que abarca el 100% del contenedor.",
    cols: 1,
  },
  {
    id: "2_col",
    label: "Dividida en 2 Secciones (50% / 50%)",
    description: "Dos secciones contiguas en columnas equilibradas en escritorio.",
    cols: 2,
  },
  {
    id: "3_col",
    label: "3 Columnas (33% / 33% / 33%)",
    description: "Tres bloques en fila horizontal para colecciones o rubros.",
    cols: 3,
  },
  {
    id: "4_col",
    label: "4 Columnas (25% cada una)",
    description: "Grilla compacta de cuatro bloques destacados.",
    cols: 4,
  },
];

export function HomeSectionsManager({
  sections,
  onSectionsChange,
  categories = [],
  attributes = [],
}: HomeSectionsManagerProps) {
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeleteSectionId, setPendingDeleteSectionId] = useState<number | null>(null);
  const [isDeletingSection, setIsDeletingSection] = useState(false);

  // Campos del formulario
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [layout, setLayout] = useState<HomeSectionLayout>("2_col");
  const [showInHome, setShowInHome] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [showProductCount, setShowProductCount] = useState(false);
  const [accentColor, setAccentColor] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const resetForm = () => {
    setEditingSectionId(null);
    setName("");
    setSubtitle("");
    setSlug("");
    setImageUrl("");
    setTargetUrl("");
    setLayout("2_col");
    setShowInHome(true);
    setIsVisible(true);
    setShowProductCount(false);
    setAccentColor("");
    setIsFormOpen(false);
  };

  const handleStartEdit = (sec: NavigationSection) => {
    setEditingSectionId(sec.id);
    setName(sec.name);
    setSubtitle(sec.subtitle || "");
    setSlug(sec.slug);
    setImageUrl(sec.bannerImageUrl || sec.coverImageUrl || "");
    setTargetUrl(sec.targetUrl || `/${sec.slug}`);
    setLayout(sec.layout || "2_col");
    setShowInHome(sec.showInHomeMosaic !== false);
    setIsVisible(sec.isVisible !== false);
    setShowProductCount(Boolean(sec.showProductCount || sec.ruleConfig?.showProductCount));
    setAccentColor(sec.accentColor || "");
    setIsFormOpen(true);
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // Fallback a Base64 si el endpoint no está disponible
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageUrl(event.target?.result as string);
          setUploadingImage(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      }
    } catch {
      // Fallback a base64
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setFeedback(null);

    try {
      const existingSection = editingSectionId
        ? sections.find((s) => s.id === editingSectionId)
        : null;

      const payload = {
        id: editingSectionId || undefined,
        name: name.trim().toUpperCase(),
        slug: slug.trim() || undefined,
        subtitle: subtitle.trim() || null,
        bannerImageUrl: imageUrl.trim() || null,
        coverImageUrl: imageUrl.trim() || null,
        targetUrl: targetUrl.trim() || null,
        layout,
        showInHomeMosaic: showInHome,
        isVisible,
        showProductCount,
        accentColor: accentColor.trim() || null,
        ruleType: existingSection?.ruleType || ("FEATURED" as NavigationRuleType),
        ruleConfig: {
          ...(existingSection?.ruleConfig || {}),
          layout,
          targetUrl: targetUrl.trim() || null,
          subtitle: subtitle.trim() || null,
          showInHomeMosaic: showInHome,
          showProductCount,
        },
      };

      const url = editingSectionId
        ? `/api/admin/sections?id=${editingSectionId}`
        : "/api/admin/sections";

      const res = await fetch(url, {
        method: editingSectionId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar la sección.");
      }

      // Recargar listado
      const reload = await fetch("/api/admin/sections");
      const reloadData = await reload.json();
      if (reloadData.ok && Array.isArray(reloadData.sections)) {
        onSectionsChange(reloadData.sections);
      }

      resetForm();
      setFeedback({
        type: "ok",
        text: editingSectionId
          ? "Sección de la home actualizada correctamente."
          : "Nueva sección destacada creada para la home.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error al guardar sección.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHomeVisibility = async (sec: NavigationSection) => {
    const nextShow = !sec.showInHomeMosaic;
    try {
      await fetch(`/api/admin/sections?id=${sec.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sec,
          showInHomeMosaic: nextShow,
          ruleConfig: {
            ...sec.ruleConfig,
            showInHomeMosaic: nextShow,
          },
        }),
      });

      const reload = await fetch("/api/admin/sections");
      const reloadData = await reload.json();
      if (reloadData.ok) {
        onSectionsChange(reloadData.sections);
      }
    } catch {
      // Ignorar error temporal
    }
  };

  const handleDelete = (id: number) => {
    setPendingDeleteSectionId(id);
  };

  const confirmDeleteSection = async () => {
    if (pendingDeleteSectionId === null) return;
    setIsDeletingSection(true);
    try {
      const res = await fetch(`/api/admin/sections?id=${pendingDeleteSectionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.sections)) {
        onSectionsChange(data.sections);
        setFeedback({ type: "ok", text: "Sección eliminada con éxito." });
        setPendingDeleteSectionId(null);
      }
    } catch {
      setFeedback({ type: "error", text: "No se pudo eliminar la sección." });
    } finally {
      setIsDeletingSection(false);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const updated = [...sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const orderedIds = updated.map((s) => s.id);
    onSectionsChange(updated);

    try {
      await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          orderedIds,
        }),
      });
    } catch {
      // Error silencioso
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-amber-300" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Secciones y Banners de la Home
            </h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Personalizá los bloques visuales que aparecen en la portada de la tienda.
            Podés configurar banners que ocupen el ancho completo o dividirlos en 2, 3 o 4 columnas,
            asignarles fotos, títulos y la página a la que deben navegar.
          </p>
        </div>

        {!isFormOpen && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>Nueva Sección</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            feedback.type === "ok"
              ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
              : "bg-rose-950/60 border border-rose-800 text-rose-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-current hover:opacity-75 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Formulario de Alta / Edición de Sección */}
      {isFormOpen && (
        <form
          onSubmit={handleSaveSection}
          className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-amber-400/50 space-y-5 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-300" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                {editingSectionId ? "Editar Sección de la Home" : "Crear Nueva Sección de la Home"}
              </h3>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          </div>

          {/* 1. Selector de Formato de Columnas (Layout) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-200">
              Formato de Visualización en la Portada (Layout)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {LAYOUT_OPTIONS.map((opt) => {
                const isSelected = layout === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLayout(opt.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400"
                        : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/60"
                    }`}
                  >
                    <div>
                      {/* Diagrama visual de las columnas */}
                      <div className="w-full h-8 rounded bg-zinc-950 border border-zinc-800 p-1 mb-2 flex items-center gap-1">
                        {Array.from({ length: opt.cols }).map((_, cIdx) => (
                          <div
                            key={cIdx}
                            className={`h-full rounded bg-amber-400/40 border border-amber-400/60 flex-1`}
                          />
                        ))}
                      </div>
                      <div className="text-xs font-bold text-zinc-100 mb-0.5">
                        {opt.label}
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Título, Subtítulo y Enlace de Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Título de la Sección *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: NUEVA COLECCIÓN o BÁSICOS & ABRIGOS"
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Subtítulo o texto breve (Opcional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej: Prendas de alto rendimiento y compresión"
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                ¿Hacia dónde navega al hacer clic? (URL de Destino)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="Ej: /mujer, /catalogo?categoria=tops o /promociones"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
                <select
                  onChange={(e) => {
                    if (e.target.value) setTargetUrl(e.target.value);
                  }}
                  defaultValue=""
                  className="px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-xl shrink-0"
                >
                  <option value="" disabled>
                    Elegir destino...
                  </option>
                  <optgroup label="Categorías">
                    {categories.map((c) => (
                      <option key={c.slug} value={`/catalogo?categoria=${c.slug}`}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Páginas">
                    <option value="/catalogo">Todo el Catálogo</option>
                    <option value="/promociones">Promociones</option>
                    <option value="/sale">Ofertas / Sale</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Identificador URL / Slug (Opcional)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Ej: coleccion-seamless (se autogenera si se deja vacío)"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Carga de Foto / Imagen */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <ImageIcon size={14} className="text-amber-300" />
                <span>Foto de Fondo de la Sección</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Quitar foto
                </button>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Cargá una foto atractiva de la colección. El sistema aplicará automáticamente
              un filtro de contraste oscuro suave para garantizar la legibilidad del texto en cualquier pantalla.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="section-image-file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="section-image-file"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer border border-zinc-700 transition-colors"
                  >
                    {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>{uploadingImage ? "Subiendo..." : "Subir archivo de imagen"}</span>
                  </label>
                  <span className="text-xs text-zinc-500">o ingresá una URL:</span>
                </div>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... o /images/..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Vista Previa de la tarjeta con contraste */}
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 min-h-[110px] p-4 flex flex-col justify-between shadow-inner">
                {imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Vista previa de sección"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/45 to-stone-950/20" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-zinc-900" />
                )}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/90 bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
                    {layout === "1_col" ? "Banner Completo" : "Sección Destacada"}
                  </span>
                  {showProductCount && (
                    <span className="text-[9px] font-mono text-zinc-300">
                      12 piezas
                    </span>
                  )}
                </div>
                <div className="relative z-10 pt-2">
                  <div className="text-sm font-serif font-bold text-white uppercase truncate">
                    {name || "TÍTULO DE LA SECCIÓN"}
                  </div>
                  <div className="text-[10px] text-zinc-300 truncate">
                    {subtitle || (targetUrl ? `Navega a ${targetUrl}` : "Explorar colección")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Opciones de Visibilidad */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showInHome}
                  onChange={(e) => setShowInHome(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-xs text-zinc-200 font-semibold">
                  Mostrar en la Home
                </span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-xs text-zinc-200 font-semibold">
                  Activa / Publicada
                </span>
              </label>

              <label
                className="inline-flex items-center gap-2 cursor-pointer select-none"
                title="Si está apagado, la sección en portada no menciona 'X productos' o 'X piezas', manteniendo un lookbook limpio"
              >
                <input
                  type="checkbox"
                  checked={showProductCount}
                  onChange={(e) => setShowProductCount(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
                />
                <span className="text-xs text-zinc-200 font-semibold">
                  Mencionar cantidad de productos (apagado por defecto)
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                <span>{editingSectionId ? "Guardar Cambios" : "Crear Sección"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Listado de Secciones de la Home */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>Secciones cargadas ({sections.length})</span>
          <span>Arrastrá o usá las flechas para reordenar cómo aparecen en la portada</span>
        </div>

        {sections.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-950/50 border border-dashed border-zinc-800 text-center space-y-2">
            <LayoutGrid size={24} className="mx-auto text-zinc-600" />
            <p className="text-xs text-zinc-400">
              No tenés secciones destacadas configuradas para la portada.
            </p>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className="text-xs font-bold text-amber-400 hover:underline"
            >
              + Crear la primera sección
            </button>
          </div>
        ) : (
          sections.map((sec, index) => {
            const hasPhoto = Boolean(sec.bannerImageUrl || sec.coverImageUrl);
            const photoUrl = sec.bannerImageUrl || sec.coverImageUrl;
            const currentLayout = sec.layout || "2_col";

            return (
              <div
                key={sec.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  sec.showInHomeMosaic
                    ? "bg-zinc-950/80 border-zinc-800 hover:border-zinc-700"
                    : "bg-zinc-950/40 border-zinc-900 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Flechas de Orden */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(index, "up")}
                      disabled={index === 0}
                      aria-label="Subir"
                      className="p-1 rounded text-zinc-400 hover:text-amber-300 disabled:opacity-20"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <span className="text-[10px] font-mono text-zinc-500">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleMove(index, "down")}
                      disabled={index === sections.length - 1}
                      aria-label="Bajar"
                      className="p-1 rounded text-zinc-400 hover:text-amber-300 disabled:opacity-20"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  {/* Miniatura de imagen */}
                  <div className="relative w-16 h-12 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                    {hasPhoto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={photoUrl!}
                        alt={sec.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={18} className="text-zinc-600" />
                    )}
                  </div>

                  {/* Información */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-zinc-100 uppercase truncate">
                        {sec.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 shrink-0">
                        {currentLayout === "1_col"
                          ? "1 Col (Ancho Completo)"
                          : currentLayout === "3_col"
                          ? "3 Columnas"
                          : currentLayout === "4_col"
                          ? "4 Columnas"
                          : "2 Columnas"}
                      </span>
                      {sec.showInHomeMosaic ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-300 shrink-0">
                          En Home
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500 shrink-0">
                          Oculta en Home
                        </span>
                      )}
                      {sec.showProductCount ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/60 text-amber-300 shrink-0">
                          Con piezas
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500 shrink-0">
                          Sin piezas
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate flex items-center gap-2">
                      {sec.subtitle && <span>{sec.subtitle} · </span>}
                      <span className="font-mono text-zinc-500">
                        Navega a: {sec.targetUrl || `/${sec.slug}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleHomeVisibility(sec)}
                    className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
                    title={sec.showInHomeMosaic ? "Ocultar de la Home" : "Mostrar en la Home"}
                  >
                    {sec.showInHomeMosaic ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(sec)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700 transition-colors"
                  >
                    <Edit3 size={13} />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(sec.id)}
                    aria-label={`Eliminar ${sec.name}`}
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteSectionId !== null}
        onClose={() => setPendingDeleteSectionId(null)}
        onConfirm={confirmDeleteSection}
        title="Eliminar sección"
        message="¿Estás seguro de que querés eliminar esta sección de la home?"
        confirmLabel="Eliminar sección"
        isLoading={isDeletingSection}
      />
    </div>
  );
}

