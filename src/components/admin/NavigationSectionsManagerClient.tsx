"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Compass,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  Plus,
  Save,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  NavigationRuleConfig,
  NavigationRuleType,
  NavigationSection,
  ProductAttributeDefinition,
} from "../../domain/navigation/types";
import { Category } from "../../domain/category/types";
import { CatalogSettingsConfig } from "../../services/settings.service";

interface NavigationSectionsManagerClientProps {
  initialSections: NavigationSection[];
  initialAttributes: ProductAttributeDefinition[];
  categories: Category[];
  initialCatalogConfig: CatalogSettingsConfig;
}

const RULE_TYPE_LABELS: Record<NavigationRuleType, string> = {
  ATTRIBUTE: "Por atributo del rubro (ej: Para = Mujer)",
  CATEGORY: "Por categoría del catálogo",
  SALE: "En oferta (Precio anterior > Precio actual)",
  DISCOUNT: "En oferta (Precio anterior > Precio actual)",
  RECENCY: "Recién llegados (Por antigüedad en días)",
  RECENT: "Recién llegados (Por antigüedad en días)",
  FEATURED: "Productos destacados",
  MANUAL: "Selección manual de productos",
};

export function NavigationSectionsManagerClient({
  initialSections,
  initialAttributes,
  categories,
  initialCatalogConfig,
}: NavigationSectionsManagerClientProps) {
  const [sections, setSections] = useState<NavigationSection[]>(initialSections);
  const [attributes, setAttributes] =
    useState<ProductAttributeDefinition[]>(initialAttributes);
  const [catalogConfig, setCatalogConfig] =
    useState<CatalogSettingsConfig>(initialCatalogConfig);

  // Estado del formulario de sección
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [secName, setSecName] = useState("");
  const [secSlug, setSecSlug] = useState("");
  const [secRuleType, setSecRuleType] = useState<NavigationRuleType>("ATTRIBUTE");
  const [secAttrKey, setSecAttrKey] = useState("para");
  const [secAttrValue, setSecAttrValue] = useState("Mujer");
  const [secCategorySlugs, setSecCategorySlugs] = useState<string[]>([]);
  const [secDaysWindow, setSecDaysWindow] = useState<number>(30);
  const [secPosition, setSecPosition] = useState<number>(sections.length + 1);
  const [secVisible, setSecVisible] = useState<boolean>(true);
  const [secShowInHome, setSecShowInHome] = useState<boolean>(true);
  const [secAccentColor, setSecAccentColor] = useState<string>("");
  const [secBannerImage, setSecBannerImage] = useState<string>("");

  // Estado de nuevo atributo de rubro
  const [attrKey, setAttrKey] = useState("");
  const [attrLabel, setAttrLabel] = useState("");
  const [attrOptionsText, setAttrOptionsText] = useState("");
  const [attrFilterable, setAttrFilterable] = useState(true);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const resetSectionForm = () => {
    setEditingSectionId(null);
    setSecName("");
    setSecSlug("");
    setSecRuleType("ATTRIBUTE");
    setSecAttrKey(attributes[0]?.key || "para");
    setSecAttrValue(attributes[0]?.options[0] || "Mujer");
    setSecCategorySlugs([]);
    setSecDaysWindow(30);
    setSecPosition(sections.length + 1);
    setSecVisible(true);
    setSecShowInHome(true);
    setSecAccentColor("");
    setSecBannerImage("");
  };

  const startEditSection = (sec: NavigationSection) => {
    setEditingSectionId(sec.id);
    setSecName(sec.name);
    setSecSlug(sec.slug);
    setSecRuleType(sec.ruleType);
    setSecAttrKey(sec.ruleConfig.attributeKey || sec.ruleConfig.attributeSlug || "para");
    setSecAttrValue(sec.ruleConfig.attributeValue || "");
    setSecCategorySlugs(sec.ruleConfig.categorySlugs || []);
    setSecDaysWindow(sec.ruleConfig.daysWindow || sec.ruleConfig.days || 30);
    setSecPosition(sec.position);
    setSecVisible(sec.isVisible);
    setSecShowInHome(sec.showInHomeMosaic ?? true);
    setSecAccentColor(sec.accentColor || "");
    setSecBannerImage(sec.bannerImageUrl || sec.coverImageUrl || "");
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secName.trim()) return;
    setSaving(true);
    setFeedback(null);

    const ruleConfig: NavigationRuleConfig = {};
    if (secRuleType === "ATTRIBUTE") {
      ruleConfig.attributeKey = secAttrKey;
      ruleConfig.attributeValue = secAttrValue;
    } else if (secRuleType === "CATEGORY") {
      ruleConfig.categorySlugs = secCategorySlugs;
    } else if (secRuleType === "RECENCY") {
      ruleConfig.daysWindow = secDaysWindow;
    }

    try {
      const res = await fetch("/api/admin/navigation", {
        method: editingSectionId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSectionId ?? undefined,
          name: secName.trim(),
          slug: secSlug.trim() || undefined,
          ruleType: secRuleType,
          ruleConfig,
          position: secPosition,
          isVisible: secVisible,
          showInHomeMosaic: secShowInHome,
          accentColor: secAccentColor.trim() || null,
          bannerImageUrl: secBannerImage.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar la sección");
      }

      // Recargar listado con conteos actualizados
      const reloadRes = await fetch("/api/admin/navigation");
      const reloadData = await reloadRes.json();
      if (reloadData.ok) {
        setSections(reloadData.sections);
      }
      resetSectionForm();
      setFeedback({
        type: "ok",
        text: editingSectionId
          ? "Sección actualizada con éxito."
          : "Nueva sección creada con éxito.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error al guardar sección",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: number) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/navigation?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSections((prev) => prev.filter((s) => s.id !== id));
        if (editingSectionId === id) resetSectionForm();
        setFeedback({ type: "ok", text: "Sección eliminada." });
      }
    } finally {
      setSaving(false);
    }
  };

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
      const res = await fetch("/api/admin/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "attribute",
          key: attrKey.trim() || attrLabel.trim(),
          label: attrLabel.trim(),
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
          return prev.map((a) =>
            a.key === data.attribute.key ? data.attribute : a
          );
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

  const handleDeleteAttribute = async (id: number) => {
    const res = await fetch(`/api/admin/navigation?entity=attribute&id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAttributes((prev) => prev.filter((a) => a.id !== id));
      setFeedback({ type: "ok", text: "Atributo eliminado." });
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
        throw new Error(data.error || "No se pudo guardar la configuración");
      }
      setFeedback({
        type: "ok",
        text: "Configuración de catálogo y filtros guardada.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error al guardar",
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

  const selectedAttrDef = attributes.find((a) => a.key === secAttrKey);

  return (
    <div className="space-y-8 pb-20">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Compass size={15} aria-hidden="true" />
            <span>Navegación y Catálogo</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-100 mt-1">
            Secciones, Atributos de Rubro y Filtros
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Definí las colecciones con reglas del menú superior (ej: MUJER, HOMBRE, SALE, RECIÉN LLEGADOS), los atributos propios de tu rubro y el tamaño de tanda del catálogo. Las secciones sin productos disponibles se ocultan solas en la tienda.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === "ok"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-rose-950/40 border-rose-800 text-rose-300"
          }`}
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. Secciones de Navegación */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Secciones del Menú y Home ({sections.length})
              </h2>
              <span className="text-[11px] text-zinc-400">
                Máximo recomendado: 6 a 7 ítems
              </span>
            </div>

            <div className="space-y-3">
              {sections.map((sec) => {
                const isEmpty = (sec.productCount ?? 0) === 0;
                return (
                  <div
                    key={sec.id}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500">
                          #{sec.position}
                        </span>
                        <span
                          className="font-bold text-sm text-zinc-100"
                          style={
                            sec.accentColor ? { color: sec.accentColor } : undefined
                          }
                        >
                          {sec.name}
                        </span>
                        <code className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                          /{sec.slug}
                        </code>
                        {!sec.isVisible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                            <EyeOff size={11} /> Oculta manualmente
                          </span>
                        ) : isEmpty ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/60">
                            Auto-oculta (0 productos hoy)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                            <Eye size={11} /> Activa ({sec.productCount} prod.)
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-400">
                        {RULE_TYPE_LABELS[sec.ruleType]}
                        {sec.ruleType === "ATTRIBUTE" &&
                          ` · ${sec.ruleConfig.attributeKey}: ${sec.ruleConfig.attributeValue}`}
                        {sec.ruleType === "RECENCY" &&
                          ` · Últimos ${sec.ruleConfig.daysWindow ?? 30} días`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => startEditSection(sec)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-amber-300 transition-colors"
                      >
                        <Edit3 size={13} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 text-zinc-400 hover:text-rose-300 transition-colors"
                        aria-label={`Eliminar sección ${sec.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Formulario Crear/Editar Sección */}
        <form
          onSubmit={handleSaveSection}
          className="lg:col-span-5 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              {editingSectionId ? "Editar Sección" : "+ Nueva Sección de Navegación"}
            </h3>
            {editingSectionId && (
              <button
                type="button"
                onClick={resetSectionForm}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="sec-name" className="block text-xs font-bold text-zinc-200">
                Nombre en el menú
              </label>
              <input
                id="sec-name"
                type="text"
                value={secName}
                onChange={(e) => setSecName(e.target.value)}
                placeholder="Ej: MUJER, SALE, ACCESORIOS"
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sec-slug" className="block text-xs font-bold text-zinc-200">
                URL amigable (opcional)
              </label>
              <input
                id="sec-slug"
                type="text"
                value={secSlug}
                onChange={(e) => setSecSlug(e.target.value)}
                placeholder="ej: mujer, sale"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="sec-rule-type" className="block text-xs font-bold text-zinc-200">
              Regla automática de la colección
            </label>
            <select
              id="sec-rule-type"
              value={secRuleType}
              onChange={(e) => setSecRuleType(e.target.value as NavigationRuleType)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
            >
              {Object.entries(RULE_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {secRuleType === "ATTRIBUTE" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="space-y-1">
                <label htmlFor="sec-attr-key" className="block text-[11px] text-zinc-400">
                  Atributo
                </label>
                <select
                  id="sec-attr-key"
                  value={secAttrKey}
                  onChange={(e) => {
                    const nextKey = e.target.value;
                    setSecAttrKey(nextKey);
                    const def = attributes.find((a) => a.key === nextKey);
                    if (def && def.options[0]) setSecAttrValue(def.options[0]);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                >
                  {attributes.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.label} ({a.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="sec-attr-val" className="block text-[11px] text-zinc-400">
                  Valor requerido
                </label>
                {selectedAttrDef && selectedAttrDef.options.length > 0 ? (
                  <select
                    id="sec-attr-val"
                    value={secAttrValue}
                    onChange={(e) => setSecAttrValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                  >
                    {selectedAttrDef.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="sec-attr-val"
                    type="text"
                    value={secAttrValue}
                    onChange={(e) => setSecAttrValue(e.target.value)}
                    placeholder="Ej: Mujer"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                  />
                )}
              </div>
            </div>
          )}

          {secRuleType === "RECENCY" && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <label htmlFor="sec-days" className="block text-[11px] text-zinc-400">
                Mostrar productos publicados en los últimos (días):
              </label>
              <input
                id="sec-days"
                type="number"
                min={1}
                max={365}
                value={secDaysWindow}
                onChange={(e) => setSecDaysWindow(Number(e.target.value) || 30)}
                className="w-28 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100"
              />
            </div>
          )}

          {secRuleType === "CATEGORY" && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <span className="block text-[11px] text-zinc-400">
                Seleccioná las categorías incluidas:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {categories.map((cat) => {
                  const checked = secCategorySlugs.includes(cat.slug);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setSecCategorySlugs((prev) =>
                          checked
                            ? prev.filter((s) => s !== cat.slug)
                            : [...prev, cat.slug]
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                        checked
                          ? "bg-amber-300 text-zinc-950 border-amber-300 font-bold"
                          : "bg-zinc-900 text-zinc-300 border-zinc-800"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="sec-pos" className="block text-xs text-zinc-300">
                Orden
              </label>
              <input
                id="sec-pos"
                type="number"
                min={1}
                value={secPosition}
                onChange={(e) => setSecPosition(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sec-accent" className="block text-xs text-zinc-300">
                Color acento (ej: SALE)
              </label>
              <input
                id="sec-accent"
                type="text"
                value={secAccentColor}
                onChange={(e) => setSecAccentColor(e.target.value)}
                placeholder="#be123c (opcional)"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="sec-banner" className="block text-xs text-zinc-300">
              Imagen para mosaico de Secciones Destacadas en Home (URL opcional)
            </label>
            <input
              id="sec-banner"
              type="text"
              value={secBannerImage}
              onChange={(e) => setSecBannerImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={secVisible}
                onChange={(e) => setSecVisible(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-400"
              />
              <span>Visible en menú de navegación</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={secShowInHome}
                onChange={(e) => setSecShowInHome(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-400"
              />
              <span>Destacar en el mosaico de secciones de la Home</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving || !secName.trim()}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{editingSectionId ? "Guardar cambios de sección" : "Crear sección"}</span>
          </button>
        </form>
      </div>

      {/* 2. Atributos Configurables por Rubro y Configuración del Panel de Catálogo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Atributos del Rubro */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              <span>Atributos Configurables del Rubro</span>
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Adaptá los campos y filtros a tu comercio (ej: &ldquo;Para: Mujer, Hombre, Unisex&rdquo; en moda; o &ldquo;Marca&rdquo;, &ldquo;Línea&rdquo;, &ldquo;Material&rdquo; en otros rubros).
            </p>
          </div>

          <div className="space-y-2">
            {attributes.map((attr) => (
              <div
                key={attr.id}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100">
                      {attr.label}
                    </span>
                    <code className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-amber-300">
                      {attr.key}
                    </code>
                    {attr.isFilterable && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                        Filtro lateral activo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Opciones: {attr.options.join(", ")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteAttribute(attr.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
                  aria-label={`Eliminar atributo ${attr.label}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleSaveAttribute} className="pt-3 border-t border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-300">
              + Agregar o actualizar atributo del rubro
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={attrLabel}
                onChange={(e) => setAttrLabel(e.target.value)}
                placeholder="Nombre visible (ej: Para, Marca)"
                aria-label="Nombre visible del atributo"
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
              <input
                type="text"
                value={attrOptionsText}
                onChange={(e) => setAttrOptionsText(e.target.value)}
                placeholder="Opciones separadas por coma (ej: Mujer, Hombre, Unisex)"
                aria-label="Opciones del atributo separadas por coma"
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attrFilterable}
                  onChange={(e) => setAttrFilterable(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-400"
                />
                <span>Mostrar en la barra lateral de filtros del catálogo</span>
              </label>

              <button
                type="submit"
                disabled={saving || !attrLabel.trim() || !attrOptionsText.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Plus size={13} />
                <span>Guardar atributo</span>
              </button>
            </div>
          </form>
        </div>

        {/* Configuración del Panel de Catálogo (Tanda y Filtros) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-amber-400" />
              <span>Paginación por Tandas y Filtros del Catálogo</span>
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              12 productos por tanda se reparten exacto en 2, 3 y 4 columnas sin dejar huecos en la grilla.
            </p>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-bold text-zinc-200">
              Tamaño de tanda (productos por carga)
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {([12, 16, 24] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    setCatalogConfig((prev) => ({ ...prev, pageSize: size }))
                  }
                  className={`p-3 rounded-xl border text-left transition-all ${
                    catalogConfig.pageSize === size
                      ? "bg-amber-300/15 border-amber-400 text-amber-200"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="block text-sm font-mono font-bold text-zinc-100">
                    {size} productos
                  </span>
                  <span className="block text-[10px] mt-0.5">
                    {size === 12
                      ? "Recomendado (2, 3 y 4 col.)"
                      : size === 16
                      ? "Cierra en 2 y 4 col."
                      : "Cierra en 2, 3 y 4 col."}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <span className="block text-xs font-bold text-zinc-200">
              Filtros visibles en la barra lateral izquierda
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "categories", label: "Categorías (árbol)" },
                { key: "size", label: "Talle" },
                { key: "color", label: "Color (muestra + nombre)" },
                { key: "price", label: "Precio (mínimo y máximo)" },
                { key: "availability", label: "Disponibilidad" },
                { key: "sale", label: "En oferta (Sale)" },
                ...attributes.map((a) => ({
                  key: a.key,
                  label: `Atributo: ${a.label}`,
                })),
              ].map((item) => {
                const active = (catalogConfig.enabledFilters || []).includes(item.key);
                return (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleFilterOption(item.key)}
                      className="w-4 h-4 rounded accent-amber-400"
                    />
                    <Filter size={12} className="text-zinc-500" />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveCatalogConfig}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 font-bold text-xs transition-all cursor-pointer"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Guardar configuración de catálogo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
