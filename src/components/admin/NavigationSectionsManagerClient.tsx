"use client";

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Laptop,
  Layers,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  X,
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

export type SectionsTabId = "secciones" | "atributos" | "filtros";

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
  const [activeTab, setActiveTab] = useState<SectionsTabId>("secciones");
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">(
    "desktop"
  );

  const [sections, setSections] = useState<NavigationSection[]>(initialSections);
  const [attributes, setAttributes] =
    useState<ProductAttributeDefinition[]>(initialAttributes);
  const [catalogConfig, setCatalogConfig] =
    useState<CatalogSettingsConfig>(initialCatalogConfig);

  // 1. Estado del Formulario de Sección
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [secName, setSecName] = useState("");
  const [secSlug, setSecSlug] = useState("");
  const [secRuleType, setSecRuleType] =
    useState<NavigationRuleType>("ATTRIBUTE");
  const [secAttrKey, setSecAttrKey] = useState("para");
  const [secAttrValue, setSecAttrValue] = useState("Mujer");
  const [secCategorySlugs, setSecCategorySlugs] = useState<string[]>([]);
  const [secDaysWindow, setSecDaysWindow] = useState<number>(30);
  const [secPosition, setSecPosition] = useState<number>(sections.length + 1);
  const [secVisible, setSecVisible] = useState<boolean>(true);
  const [secShowInHome, setSecShowInHome] = useState<boolean>(true);
  const [secAccentColor, setSecAccentColor] = useState<string>("");
  const [secBannerImage, setSecBannerImage] = useState<string>("");

  // 2. Estado del Formulario de Atributo
  const [attrKey, setAttrKey] = useState("");
  const [attrLabel, setAttrLabel] = useState("");
  const [attrOptionsText, setAttrOptionsText] = useState("");
  const [attrFilterable, setAttrFilterable] = useState(true);

  // Estados de control
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  // Detección de cambios pendientes
  const isSectionFormDirty = Boolean(secName.trim() || secSlug.trim());
  const isAttrFormDirty = Boolean(attrLabel.trim() || attrOptionsText.trim());
  const isCatalogDirty =
    catalogConfig.pageSize !== initialCatalogConfig.pageSize ||
    JSON.stringify(catalogConfig.enabledFilters) !==
      JSON.stringify(initialCatalogConfig.enabledFilters);

  const handleTabChange = (targetTab: SectionsTabId) => {
    if (activeTab === targetTab) return;
    const isCurrentDirty =
      (activeTab === "secciones" && isSectionFormDirty) ||
      (activeTab === "atributos" && isAttrFormDirty) ||
      (activeTab === "filtros" && isCatalogDirty);

    if (
      isCurrentDirty &&
      !window.confirm(
        "Tenés datos sin guardar en este formulario. ¿Querés cambiar de pestaña de todos modos?"
      )
    ) {
      return;
    }
    setActiveTab(targetTab);
    setFeedback(null);
  };

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
    setSecPosition(sec.position);
    setSecVisible(sec.isVisible);
    setSecShowInHome(sec.showInHomeMosaic ?? false);
    setSecAccentColor(sec.accentColor || "");
    setSecBannerImage(sec.bannerImageUrl || "");

    if (sec.ruleConfig) {
      if (sec.ruleConfig.attributeKey) setSecAttrKey(sec.ruleConfig.attributeKey);
      if (sec.ruleConfig.attributeValue)
        setSecAttrValue(sec.ruleConfig.attributeValue);
      if (sec.ruleConfig.categorySlugs)
        setSecCategorySlugs(sec.ruleConfig.categorySlugs);
      if (sec.ruleConfig.daysWindow) setSecDaysWindow(sec.ruleConfig.daysWindow);
    }
    // Desplazar suave al formulario
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secName.trim()) return;

    if (secRuleType === "ATTRIBUTE" && attributes.length === 0) {
      setFeedback({
        type: "error",
        text: "Antes de guardar una sección por atributo, debés definir al menos un atributo en la pestaña 'Atributos del Rubro'.",
      });
      return;
    }

    if (secRuleType === "ATTRIBUTE" && attributes.length === 0) {
      setFeedback({
        type: "error",
        text: "Antes de guardar una sección por atributo, debés definir al menos un atributo en la pestaña 'Atributos del Rubro'.",
      });
      return;
    }

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
      const payload = {
        name: secName.trim(),
        slug: secSlug.trim() || undefined,
        ruleType: secRuleType,
        ruleConfig,
        position: secPosition,
        isVisible: secVisible,
        showInHomeMosaic: secShowInHome,
        accentColor: secAccentColor.trim() || null,
        bannerImageUrl: secBannerImage.trim() || null,
      };

      const url = editingSectionId
        ? `/api/admin/navigation?id=${editingSectionId}`
        : "/api/admin/navigation";
      const method = editingSectionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    if (!window.confirm("¿Seguro que deseás eliminar esta sección del menú?")) {
      return;
    }
    if (secRuleType === "ATTRIBUTE" && attributes.length === 0) {
      setFeedback({
        type: "error",
        text: "Antes de guardar una sección por atributo, debés definir al menos un atributo en la pestaña 'Atributos del Rubro'.",
      });
      return;
    }

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
    if (secRuleType === "ATTRIBUTE" && attributes.length === 0) {
      setFeedback({
        type: "error",
        text: "Antes de guardar una sección por atributo, debés definir al menos un atributo en la pestaña 'Atributos del Rubro'.",
      });
      return;
    }

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
          return prev.map((a) =>
            a.key === data.attribute.key ? data.attribute : a
          );
        }
        return [...prev, data.attribute];
      });
      if (attributes.length === 0) {
        setSecAttrKey(data.attribute.key);
        if (data.attribute.options?.[0]) {
          setSecAttrValue(data.attribute.options[0]);
        }
      }
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
    if (!window.confirm("¿Seguro que deseás eliminar este atributo del rubro?")) {
      return;
    }
    const res = await fetch(`/api/admin/attributes?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAttributes((prev) => prev.filter((a) => a.id !== id));
      setFeedback({ type: "ok", text: "Atributo eliminado." });
    }
  };

  const handleSaveCatalogConfig = async () => {
    if (secRuleType === "ATTRIBUTE" && attributes.length === 0) {
      setFeedback({
        type: "error",
        text: "Antes de guardar una sección por atributo, debés definir al menos un atributo en la pestaña 'Atributos del Rubro'.",
      });
      return;
    }

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

  // Lista simulada de secciones en vivo combinando las guardadas con la que se está editando
  const previewSections = useMemo(() => {
    const list = [...sections];
    if (secName.trim()) {
      if (editingSectionId) {
        const idx = list.findIndex((s) => s.id === editingSectionId);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            name: secName.trim(),
            slug: secSlug.trim() || list[idx].slug,
            isVisible: secVisible,
            accentColor: secAccentColor.trim() || null,
          };
        }
      } else {
        list.push({
          id: 9999,
          name: secName.trim(),
          slug: secSlug.trim() || "preview",
          ruleType: secRuleType,
          ruleConfig: {},
          position: secPosition,
          isVisible: secVisible,
          showInHomeMosaic: secShowInHome,
          accentColor: secAccentColor.trim() || null,
          productCount: 4,
        });
      }
    }
    return list.filter((s) => s.isVisible);
  }, [
    sections,
    editingSectionId,
    secName,
    secSlug,
    secVisible,
    secAccentColor,
    secRuleType,
    secPosition,
    secShowInHome,
  ]);

  return (
    <div className="space-y-8 pb-24">
      {/* 1. Encabezado de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Compass size={15} aria-hidden="true" />
            <span>Navegación y Catálogo</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-100 mt-1">
            Secciones, Atributos y Filtros
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Gestioná las colecciones con reglas del menú principal, definí los
            atributos de tu rubro y organizá los filtros de la barra lateral con
            vista previa de impacto en tiempo real.
          </p>
        </div>

        {/* Notificación de cambios pendientes */}
        {(isSectionFormDirty || isAttrFormDirty || isCatalogDirty) && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-semibold shrink-0">
            <AlertTriangle size={14} className="animate-pulse" />
            <span>Cambios sin guardar</span>
          </div>
        )}
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
            feedback.type === "ok"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-rose-950/40 border-rose-800 text-rose-300"
          }`}
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2. Barra de Pestañas (ADM-02: Secciones, Atributos de rubro, Filtros) */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("secciones")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "secciones"
                ? "bg-amber-300 text-zinc-950 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Compass size={15} aria-hidden="true" />
            <span>Secciones de Navegación ({sections.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("atributos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "atributos"
                ? "bg-amber-300 text-zinc-950 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Sparkles size={15} aria-hidden="true" />
            <span>Atributos del Rubro ({attributes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("filtros")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "filtros"
                ? "bg-amber-300 text-zinc-950 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span>Filtros del Catálogo</span>
          </button>
        </div>

        {/* Selector de Dispositivo para la Vista Previa de Impacto */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          <button
            type="button"
            onClick={() => setPreviewViewport("desktop")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              previewViewport === "desktop"
                ? "bg-zinc-800 text-amber-300 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Vista previa en escritorio"
          >
            <Laptop size={14} />
            <span>Escritorio</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewViewport("mobile")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              previewViewport === "mobile"
                ? "bg-zinc-800 text-amber-300 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Vista previa en celular"
          >
            <Smartphone size={14} />
            <span>Celular</span>
          </button>
        </div>
      </div>

      {/* 3. Contenedor Principal: Editor + Vista Previa de Impacto */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Formularios y Listados (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: SECCIONES DE NAVEGACIÓN */}
          {activeTab === "secciones" && (
            <div className="space-y-6">
              {attributes.length === 0 && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-300">
                        Paso previo recomendado: Atributos del Rubro
                      </p>
                      <p className="text-[11px] text-amber-200/90 mt-0.5">
                        Antes de crear secciones automáticas (ej: &ldquo;Para: Mujer / Hombre&rdquo;), definí primero los atributos de tu catálogo para que estén disponibles como reglas y filtros.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("atributos")}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Cargar Atributos</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
              {/* Formulario Crear/Editar */}
              <form
                onSubmit={handleSaveSection}
                className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    {editingSectionId
                      ? "Editar Sección de Navegación"
                      : "+ Nueva Sección de Navegación"}
                  </h3>
                  {editingSectionId && (
                    <button
                      type="button"
                      onClick={resetSectionForm}
                      className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="sec-name"
                      className="block text-xs font-bold text-zinc-200"
                    >
                      Nombre en el menú *
                    </label>
                    <input
                      id="sec-name"
                      type="text"
                      value={secName}
                      onChange={(e) => setSecName(e.target.value)}
                      placeholder="Ej: MUJER, SALE, RECIÉN LLEGADOS"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="sec-slug"
                      className="block text-xs font-bold text-zinc-200"
                    >
                      URL amigable (slug)
                    </label>
                    <input
                      id="sec-slug"
                      type="text"
                      value={secSlug}
                      onChange={(e) => setSecSlug(e.target.value)}
                      placeholder="ej: mujer, sale"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="sec-rule-type"
                    className="block text-xs font-bold text-zinc-200"
                  >
                    Regla de contenido automático
                  </label>
                  <select
                    id="sec-rule-type"
                    value={secRuleType}
                    onChange={(e) =>
                      setSecRuleType(e.target.value as NavigationRuleType)
                    }
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
                  attributes.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-bold">
                        <AlertTriangle size={15} className="shrink-0 text-amber-400" />
                        <span>Aún no cargaste atributos del rubro</span>
                      </div>
                      <p className="text-[11px] text-zinc-300">
                        Para vincular una sección a un atributo (ej: Para = Mujer, Material = Lino), primero tenés que dar de alta los atributos en la pestaña &ldquo;Atributos del Rubro&rdquo;.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("atributos")}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sparkles size={13} />
                        <span>Ir a cargar Atributos del Rubro</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="space-y-1">
                      <label
                        htmlFor="sec-attr-key"
                        className="block text-[11px] text-zinc-400"
                      >
                        Atributo
                      </label>
                      <select
                        id="sec-attr-key"
                        value={secAttrKey}
                        onChange={(e) => {
                          const nextKey = e.target.value;
                          setSecAttrKey(nextKey);
                          const def = attributes.find((a) => a.key === nextKey);
                          if (def && def.options[0])
                            setSecAttrValue(def.options[0]);
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
                      <label
                        htmlFor="sec-attr-val"
                        className="block text-[11px] text-zinc-400"
                      >
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
                  )
                )}

                {secRuleType === "RECENCY" && (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <label
                      htmlFor="sec-days"
                      className="block text-[11px] text-zinc-400"
                    >
                      Días de antigüedad para considerar nuevo:
                    </label>
                    <input
                      id="sec-days"
                      type="number"
                      min={1}
                      max={365}
                      value={secDaysWindow}
                      onChange={(e) =>
                        setSecDaysWindow(Number(e.target.value) || 30)
                      }
                      className="w-28 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>
                )}

                {secRuleType === "CATEGORY" && (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                    <span className="block text-[11px] text-zinc-400">
                      Categorías asociadas:
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
                    <label
                      htmlFor="sec-pos"
                      className="block text-xs text-zinc-300"
                    >
                      Orden
                    </label>
                    <input
                      id="sec-pos"
                      type="number"
                      min={1}
                      value={secPosition}
                      onChange={(e) =>
                        setSecPosition(Number(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="sec-accent"
                      className="block text-xs text-zinc-300"
                    >
                      Color acento (ej: #be123c para SALE)
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

                <div className="flex flex-col gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secVisible}
                      onChange={(e) => setSecVisible(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-400"
                    />
                    <span>Visible en el menú de navegación</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secShowInHome}
                      onChange={(e) => setSecShowInHome(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-400"
                    />
                    <span>Destacar en mosaico de la Home</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving || !secName.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>
                    {editingSectionId
                      ? "Guardar cambios de sección"
                      : "Crear sección"}
                  </span>
                </button>
              </form>

              {/* Listado de Secciones */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Secciones activas ({sections.length})
                  </h3>
                  <span className="text-[11px] text-zinc-400">
                    Se ocultan solas si no tienen stock
                  </span>
                </div>

                <div className="space-y-3">
                  {sections.map((sec) => {
                    const isEmpty = (sec.productCount ?? 0) === 0;
                    return (
                      <div
                        key={sec.id}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono text-zinc-500">
                              #{sec.position}
                            </span>
                            <span
                              className="font-bold text-sm text-zinc-100 truncate"
                              style={
                                sec.accentColor
                                  ? { color: sec.accentColor }
                                  : undefined
                              }
                            >
                              {sec.name}
                            </span>
                            <code className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                              /{sec.slug}
                            </code>
                            {!sec.isVisible ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                                <EyeOff size={11} /> Oculta
                              </span>
                            ) : isEmpty ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/60">
                                Auto-oculta (0 prod)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                                <Eye size={11} /> Activa ({sec.productCount})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {RULE_TYPE_LABELS[sec.ruleType]}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
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
          )}

          {/* TAB 2: ATRIBUTOS DE RUBRO */}
          {activeTab === "atributos" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Atributos Configurables del Comercio</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Definí qué atributos caracterizan a tus piezas (ej: &ldquo;Para: Mujer, Hombre, Unisex&rdquo; en indumentaria; &ldquo;Material&rdquo;, &ldquo;Colección&rdquo; o &ldquo;Marca&rdquo; en otros rubros).
                  </p>
                </div>

                <div className="space-y-2.5">
                  {attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-100">
                            {attr.label}
                          </span>
                          <code className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-amber-300 font-mono">
                            {attr.key}
                          </code>
                          {attr.isFilterable && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-semibold">
                              Filtro activo en catálogo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Valores posibles:{" "}
                          <span className="text-zinc-300">
                            {attr.options.join(", ")}
                          </span>
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

                {/* Formulario Agregar Atributo */}
                <form
                  onSubmit={handleSaveAttribute}
                  className="pt-4 border-t border-zinc-800 space-y-3"
                >
                  <h4 className="text-xs font-bold text-zinc-300">
                    + Nuevo Atributo de Rubro
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="attr-lbl"
                        className="block text-[11px] text-zinc-400"
                      >
                        Etiqueta visible *
                      </label>
                      <input
                        id="attr-lbl"
                        type="text"
                        value={attrLabel}
                        onChange={(e) => setAttrLabel(e.target.value)}
                        placeholder="Ej: Para, Material, Marca"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="attr-opts"
                        className="block text-[11px] text-zinc-400"
                      >
                        Opciones separadas por coma *
                      </label>
                      <input
                        id="attr-opts"
                        type="text"
                        value={attrOptionsText}
                        onChange={(e) => setAttrOptionsText(e.target.value)}
                        placeholder="Ej: Mujer, Hombre, Unisex"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attrFilterable}
                        onChange={(e) => setAttrFilterable(e.target.checked)}
                        className="w-4 h-4 rounded accent-amber-400"
                      />
                      <span>Habilitar como filtro en la barra lateral</span>
                    </label>

                    <button
                      type="submit"
                      disabled={
                        saving || !attrLabel.trim() || !attrOptionsText.trim()
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Guardar Atributo</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: FILTROS DEL CATÁLOGO */}
          {activeTab === "filtros" && (
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-amber-400" />
                  <span>Configuración de Filtros y Tandas</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Elegí qué filtros se muestran en la barra lateral de la tienda pública y el tamaño de tanda de productos.
                </p>
              </div>

              {/* Tamaño de tanda */}
              <div className="space-y-2.5">
                <span className="block text-xs font-bold text-zinc-200">
                  Tamaño de tanda (productos por carga)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {([12, 16, 24] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setCatalogConfig((prev) => ({ ...prev, pageSize: size }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
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

              {/* Filtros habilitados */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                <span className="block text-xs font-bold text-zinc-200">
                  Filtros activos en la barra lateral
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: "categories", label: "Categorías (árbol jerárquico)" },
                    { key: "size", label: "Talle (chips de selección)" },
                    { key: "color", label: "Color (muestra + nombre)" },
                    { key: "price", label: "Precio (rango mínimo y máximo)" },
                    { key: "availability", label: "Disponibilidad (en stock)" },
                    { key: "sale", label: "En oferta (Sale)" },
                    ...attributes.map((a) => ({
                      key: a.key,
                      label: `Atributo: ${a.label}`,
                    })),
                  ].map((item) => {
                    const active = (
                      catalogConfig.enabledFilters || []
                    ).includes(item.key);
                    return (
                      <label
                        key={item.key}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 cursor-pointer hover:border-zinc-700 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleFilterOption(item.key)}
                          className="w-4 h-4 rounded accent-amber-400"
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
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-300 hover:bg-amber-200 text-zinc-950 font-bold text-xs transition-all cursor-pointer"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                <span>Guardar configuración de catálogo</span>
              </button>
            </div>
          )}
        </div>

        {/* Columna Derecha: Vista Previa de Impacto en Vivo (5 cols - ADM-02) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Vista Previa de Impacto
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400">
                {previewViewport === "desktop" ? "Escritorio" : "Móvil (375px)"}
              </span>
            </div>

            {/* Canvas de Vista Previa */}
            <div
              className={`mx-auto bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl transition-all duration-300 ${
                previewViewport === "mobile" ? "max-w-[320px]" : "w-full"
              }`}
            >
              {/* IMPACTO TAB 1: Cabecera con Menú de Secciones */}
              {activeTab === "secciones" && (
                <div className="p-3 bg-zinc-950 text-zinc-100">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                    <span className="font-serif font-bold text-xs tracking-wider">
                      AURA STUDIO
                    </span>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Search size={12} />
                      <ShoppingBag size={12} />
                    </div>
                  </div>

                  {previewViewport === "desktop" ? (
                    <nav
                      aria-label="Vista previa de menú"
                      className="flex items-center gap-3 overflow-x-auto text-[11px] uppercase tracking-wider font-semibold py-1 scrollbar-none"
                    >
                      {previewSections.map((sec) => (
                        <span
                          key={sec.id}
                          className="shrink-0 transition-colors"
                          style={
                            sec.accentColor
                              ? { color: sec.accentColor, fontWeight: "bold" }
                              : undefined
                          }
                        >
                          {sec.name}
                        </span>
                      ))}
                      <span className="text-zinc-500 shrink-0">CATÁLOGO</span>
                    </nav>
                  ) : (
                    <div className="space-y-1.5 py-1">
                      <div className="flex items-center justify-between p-1.5 rounded bg-zinc-900 text-xs font-bold">
                        <span className="flex items-center gap-1.5">
                          <Menu size={12} /> Menú desplegado
                        </span>
                        <ChevronDown size={12} />
                      </div>
                      <div className="pl-3 space-y-1 text-xs border-l border-zinc-800">
                        {previewSections.map((sec) => (
                          <div
                            key={sec.id}
                            className="text-[11px] font-bold"
                            style={
                              sec.accentColor
                                ? { color: sec.accentColor }
                                : undefined
                            }
                          >
                            {sec.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400">
                    💡 Así se refleja la navegación en la tienda pública. Las
                    secciones con 0 productos se ocultarán automáticamente.
                  </div>
                </div>
              )}

              {/* IMPACTO TAB 2: Tarjeta de Producto con Atributos de Rubro */}
              {activeTab === "atributos" && (
                <div className="p-3 bg-zinc-950 text-zinc-100 space-y-3">
                  <div className="aspect-[4/3] rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 text-xs font-mono">
                    Foto de Prenda / Producto
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-100">
                        Top Lino Cuello Halter
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        $48.000
                      </span>
                    </div>

                    {/* Chips de Atributos */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {attributes.map((attr) => (
                        <span
                          key={attr.id}
                          className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-300"
                        >
                          {attr.label}: {attr.options[0] || "Opción"}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center gap-1">
                      {["XS", "S", "M", "L"].map((talle) => (
                        <span
                          key={talle}
                          className="w-6 h-6 rounded border border-zinc-800 bg-zinc-900 text-[10px] flex items-center justify-center text-zinc-400 font-mono"
                        >
                          {talle}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400">
                    💡 Los atributos definidos se aplican como etiquetas,
                    variantes y selectores en la ficha del producto.
                  </div>
                </div>
              )}

              {/* IMPACTO TAB 3: Barra Lateral de Filtros */}
              {activeTab === "filtros" && (
                <div className="p-3 bg-zinc-950 text-zinc-100 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Filter size={12} /> Filtros del Catálogo
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {catalogConfig.pageSize} por tanda
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {(catalogConfig.enabledFilters || []).map((filterKey) => (
                      <div
                        key={filterKey}
                        className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between"
                      >
                        <span className="text-zinc-300 capitalize font-medium">
                          {filterKey === "categories"
                            ? "Categorías"
                            : filterKey === "size"
                            ? "Talle"
                            : filterKey === "color"
                            ? "Color"
                            : filterKey === "price"
                            ? "Rango de Precio"
                            : filterKey === "availability"
                            ? "Disponibilidad"
                            : filterKey === "sale"
                            ? "Sale / Oferta"
                            : `Atributo: ${filterKey}`}
                        </span>
                        <ChevronRight size={12} className="text-zinc-500" />
                      </div>
                    ))}
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400">
                    💡 La tienda pública renderiza la barra lateral únicamente
                    con los filtros que activaste aquí.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
