"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Filter,
  Plus,
  Save,
  SlidersHorizontal,
  Tag,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { ProductAttributeDefinition } from "../../../domain/navigation/types";
import { CatalogSettingsConfig } from "../../../services/settings.service";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface CatalogAttributesManagerClientProps {
  initialAttributes: ProductAttributeDefinition[];
  initialCatalogConfig: CatalogSettingsConfig;
}

export type AttributesTabId = "atributos" | "filtros";

export function CatalogAttributesManagerClient({
  initialAttributes,
  initialCatalogConfig,
}: CatalogAttributesManagerClientProps) {
  const [activeTab, setActiveTab] = useState<AttributesTabId>("atributos");
  const [attributes, setAttributes] = useState<ProductAttributeDefinition[]>(initialAttributes);
  const [catalogConfig, setCatalogConfig] = useState<CatalogSettingsConfig>(initialCatalogConfig);

  // Formulario de Atributo
  const [attrKey, setAttrKey] = useState("");
  const [attrLabel, setAttrLabel] = useState("");
  const [attrOptionsText, setAttrOptionsText] = useState("");
  const [attrFilterable, setAttrFilterable] = useState(true);

  const [saving, setSaving] = useState(false);
  const [pendingDeleteAttrId, setPendingDeleteAttrId] = useState<number | null>(null);
  const [isDeletingAttr, setIsDeletingAttr] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrLabel.trim() || !attrOptionsText.trim()) return;

    setSaving(true);
    setFeedback(null);

    try {
      const options = attrOptionsText
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: attrLabel.trim(),
          label: attrLabel.trim(),
          slug: attrKey.trim() || attrLabel.trim(),
          key: attrKey.trim() || attrLabel.trim(),
          options,
          isFilterable: attrFilterable,
          position: attributes.length + 1,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar el atributo");
      }

      setAttributes((prev) => {
        const exists = prev.some((a) => a.key === data.attribute.key);
        if (exists) {
          return prev.map((a) => (a.key === data.attribute.key ? data.attribute : a));
        }
        return [...prev, data.attribute];
      });

      setAttrKey("");
      setAttrLabel("");
      setAttrOptionsText("");
      setFeedback({
        type: "ok",
        text: `Atributo "${data.attribute.label}" guardado correctamente.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error al guardar atributo",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAttribute = (id: number) => {
    setPendingDeleteAttrId(id);
  };

  const confirmDeleteAttribute = async () => {
    if (pendingDeleteAttrId === null) return;
    setIsDeletingAttr(true);
    try {
      await fetch(`/api/admin/attributes?id=${pendingDeleteAttrId}`, { method: "DELETE" });
      setAttributes((prev) => prev.filter((a) => a.id !== pendingDeleteAttrId));
      setFeedback({ type: "ok", text: "Atributo eliminado." });
      setPendingDeleteAttrId(null);
    } catch {
      setFeedback({ type: "error", text: "No se pudo eliminar el atributo." });
    } finally {
      setIsDeletingAttr(false);
    }
  };

  const handleSaveCatalogConfig = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogConfig }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al actualizar catálogo");
      }
      setFeedback({
        type: "ok",
        text: "Configuración de catálogo y filtros guardada con éxito.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error al guardar configuración",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleFilterOption = (filterKey: string) => {
    setCatalogConfig((prev) => {
      const currentFilters = prev.enabledFilters || [];
      const exists = currentFilters.includes(filterKey);
      return {
        ...prev,
        enabledFilters: exists
          ? currentFilters.filter((k) => k !== filterKey)
          : [...currentFilters, filterKey],
      };
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Encabezado */}
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
          Productos › Catálogo
        </span>
        <h1 className="text-xl sm:text-2xl font-serif font-light text-zinc-100 mt-1">
          Atributos y Filtros del Catálogo
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configurá los atributos técnicos de tus piezas (talle, color, material, etc.) y definí
          qué filtros se muestran en la barra lateral del catálogo público.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === "ok"
              ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
              : "bg-rose-950/60 border border-rose-800 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Pestañas */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("atributos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "atributos"
              ? "bg-amber-400 text-zinc-950 shadow-sm"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Tag size={14} />
          <span>Atributos del Rubro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("filtros")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "filtros"
              ? "bg-amber-400 text-zinc-950 shadow-sm"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Filtros y Paginación</span>
        </button>
      </div>

      {/* TAB 1: ATRIBUTOS */}
      {activeTab === "atributos" && (
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Atributos Configurados ({attributes.length})
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Etiquetas específicas de tus productos para cargar talles, materiales, disciplinas o género.
            </p>
          </div>

          <div className="space-y-2.5">
            {attributes.length === 0 ? (
              <div className="p-6 rounded-xl bg-zinc-950/50 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                Aún no creaste atributos personalizados. Podés agregar uno debajo.
              </div>
            ) : (
              attributes.map((attr) => (
                <div
                  key={attr.id}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-100">{attr.label}</span>
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-amber-300 font-mono">
                        {attr.key}
                      </code>
                      {attr.isFilterable && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-semibold">
                          Filtro activo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Opciones: <span className="text-zinc-300">{attr.options.join(", ")}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAttribute(attr.id)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    aria-label={`Eliminar atributo ${attr.label}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Formulario nuevo atributo */}
          <form onSubmit={handleSaveAttribute} className="pt-4 border-t border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              + Nuevo Atributo de Rubro
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Etiqueta visible *
                </label>
                <input
                  type="text"
                  value={attrLabel}
                  onChange={(e) => setAttrLabel(e.target.value)}
                  placeholder="Ej: Material, Disciplina, Temporada"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Opciones separadas por coma *
                </label>
                <input
                  type="text"
                  value={attrOptionsText}
                  onChange={(e) => setAttrOptionsText(e.target.value)}
                  placeholder="Ej: Poliéster, Lycra, Algodón"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={attrFilterable}
                  onChange={(e) => setAttrFilterable(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
                />
                <span>Habilitar como filtro en la barra lateral del catálogo</span>
              </label>

              <button
                type="submit"
                disabled={saving || !attrLabel.trim() || !attrOptionsText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>Guardar Atributo</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: FILTROS Y PAGINACIÓN */}
      {activeTab === "filtros" && (
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Filtros de la Barra Lateral y Paginación
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Definí qué filtros están disponibles para los clientes y cuántos productos se muestran por tanda.
            </p>
          </div>

          {/* Tamaño de tanda */}
          <div className="space-y-2.5">
            <span className="block text-xs font-bold text-zinc-200">
              Productos por carga en el catálogo
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([12, 16, 24] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setCatalogConfig((prev) => ({ ...prev, pageSize: size }))}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    catalogConfig.pageSize === size
                      ? "bg-amber-400/10 border-amber-400 text-amber-200 ring-1 ring-amber-400"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="block text-sm font-mono font-bold text-zinc-100">
                    {size} productos
                  </span>
                  <span className="block text-[11px] text-zinc-400 mt-0.5">
                    {size === 12
                      ? "Recomendado (cierra en 2, 3 y 4 col.)"
                      : size === 16
                      ? "Ideal para 2 y 4 columnas"
                      : "Catálogo amplio"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtros habilitados */}
          <div className="space-y-2.5 pt-3 border-t border-zinc-800">
            <span className="block text-xs font-bold text-zinc-200">
              Filtros activos en la tienda pública
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: "categories", label: "Categorías (árbol jerárquico)" },
                { key: "size", label: "Talle (chips de selección rápida)" },
                { key: "color", label: "Color (muestra cromática + nombre)" },
                { key: "price", label: "Precio (rango mínimo y máximo)" },
                { key: "availability", label: "Disponibilidad (en stock)" },
                { key: "sale", label: "En oferta / Sale" },
                ...attributes.map((a) => ({
                  key: a.key,
                  label: `Atributo: ${a.label}`,
                })),
              ].map((item) => {
                const active = (catalogConfig.enabledFilters || []).includes(item.key);
                return (
                  <label
                    key={item.key}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 cursor-pointer hover:border-zinc-700 transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleFilterOption(item.key)}
                      className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400"
                    />
                    <Filter size={13} className="text-zinc-500 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveCatalogConfig}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs transition-all cursor-pointer"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Guardar Configuración de Catálogo</span>
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDeleteAttrId !== null}
        onClose={() => setPendingDeleteAttrId(null)}
        onConfirm={confirmDeleteAttribute}
        title="Eliminar atributo"
        message="¿Seguro que deseás eliminar este atributo del rubro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar atributo"
        isLoading={isDeletingAttr}
      />
    </div>
  );
}

