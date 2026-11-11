"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Layers,
  Percent,
  Trash2,
} from "lucide-react";
import {
  NavbarItemConfig,
  NavbarSubItemConfig,
} from "../../../../services/settings.service";
import { Category } from "../../../../domain/category/types";
import { NavigationSection } from "../../../../domain/navigation/types";
import {
  toggleCategoryMapping,
  toggleSectionMapping,
} from "./navbar-settings.utils";

interface NavbarSubItemsEditorProps {
  item: NavbarItemConfig;
  itemIndex: number;
  categories?: Category[];
  sections?: NavigationSection[];
  onUpdateSubItems: (newSubItems: NavbarSubItemConfig[]) => void;
}

export function NavbarSubItemsEditor({
  item,
  categories = [],
  sections = [],
  onUpdateSubItems,
}: NavbarSubItemsEditorProps) {
  const [newSubLabel, setNewSubLabel] = useState("");
  const [newSubHref, setNewSubHref] = useState("");
  const [newSubIsSale, setNewSubIsSale] = useState(false);

  const subItems = item.subItems || [];
  const subItemCount = subItems.length;

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubLabel.trim() || !newSubHref.trim()) return;

    const newSub: NavbarSubItemConfig = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: newSubLabel.trim().toUpperCase(),
      href: newSubHref.trim(),
      isSale: newSubIsSale,
    };

    onUpdateSubItems([...subItems, newSub]);
    setNewSubLabel("");
    setNewSubHref("");
    setNewSubIsSale(false);
  };

  const handleMoveSub = (subIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? subIndex - 1 : subIndex + 1;
    if (targetIndex < 0 || targetIndex >= subItems.length) return;

    const updated = [...subItems];
    const [moved] = updated.splice(subIndex, 1);
    updated.splice(targetIndex, 0, moved);
    onUpdateSubItems(updated);
  };

  const handleRemoveSub = (subIndex: number) => {
    onUpdateSubItems(subItems.filter((_, idx) => idx !== subIndex));
  };

  const handleUpdateSub = (
    subIndex: number,
    patch: Partial<NavbarSubItemConfig>
  ) => {
    const updated = [...subItems];
    updated[subIndex] = { ...updated[subIndex], ...patch };
    onUpdateSubItems(updated);
  };

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3.5 bg-zinc-900/60 p-3.5 rounded-xl border border-amber-400/25 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Layers size={13} />
            <span>
              Subsecciones para {item.label || "este enlace"} ({subItemCount})
            </span>
          </span>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Estas subcategorías y enlaces se desplegarán cuando el cliente pase el mouse o toque &ldquo;{item.label}&rdquo; en la tienda.
          </p>
        </div>
      </div>

      {/* 1. Mapeo Rápido desde Categorías */}
      {categories.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
              Mapear con 1 clic desde Categorías de la tienda:
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {categories.length} disponibles
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => {
              const isMapped = subItems.some(
                (s) =>
                  s.categorySlug === cat.slug ||
                  s.href.includes(`categoria=${cat.slug}`)
              );
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() =>
                    onUpdateSubItems(
                      toggleCategoryMapping(subItems, item.href, cat)
                    )
                  }
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    isMapped
                      ? "bg-amber-400 text-zinc-950 font-bold shadow-xs ring-1 ring-amber-300"
                      : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700/80"
                  }`}
                  title={
                    isMapped
                      ? "Hacé clic para desmapear"
                      : "Hacé clic para mapear a este menú"
                  }
                >
                  {isMapped && <Check size={11} className="stroke-[3]" />}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Mapeo Rápido desde Secciones destacadas */}
      {sections.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300/80">
              Mapear con 1 clic desde Secciones destacadas:
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {sections.length} disponibles
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {sections.map((sec) => {
              const secTarget = sec.targetUrl || `/${sec.slug}`;
              const isMapped = subItems.some(
                (s) =>
                  s.href === secTarget ||
                  s.label.toLowerCase() === sec.name.toLowerCase()
              );
              return (
                <button
                  key={sec.slug}
                  type="button"
                  onClick={() =>
                    onUpdateSubItems(toggleSectionMapping(subItems, sec))
                  }
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    isMapped
                      ? "bg-amber-400 text-zinc-950 font-bold shadow-xs ring-1 ring-amber-300"
                      : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700/80"
                  }`}
                  title={
                    isMapped
                      ? "Hacé clic para desmapear"
                      : "Hacé clic para mapear como subsección"
                  }
                >
                  {isMapped && <Check size={11} className="stroke-[3]" />}
                  <span>{sec.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Formulario para agregar subsección manual */}
      <form
        onSubmit={handleAddManual}
        className="pt-2 border-t border-zinc-800/80 space-y-2"
      >
        <span className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
          O agregá una subsección personalizada:
        </span>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={newSubLabel}
            onChange={(e) => setNewSubLabel(e.target.value)}
            placeholder="Nombre (ej: REMERAS)"
            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
          />
          <input
            type="text"
            value={newSubHref}
            onChange={(e) => setNewSubHref(e.target.value)}
            placeholder="Ruta (ej: /mujer?categoria=remeras)"
            className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
          />
          <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 px-2 py-1 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={newSubIsSale}
              onChange={(e) => setNewSubIsSale(e.target.checked)}
              className="rounded border-zinc-700 text-rose-500 focus:ring-rose-400"
            />
            <span className="flex items-center gap-1">
              <Percent size={11} className="text-rose-400" />
              <span>Sale</span>
            </span>
          </label>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 transition-colors shrink-0 cursor-pointer"
          >
            + Agregar
          </button>
        </div>
      </form>

      {/* 4. Lista de subsecciones activas con ordenamiento y eliminación */}
      <div className="space-y-1.5 pt-1">
        {subItems.length === 0 ? (
          <div className="p-3 rounded-lg bg-zinc-950/40 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
            Sin subsecciones asignadas todavía. Hacé clic en cualquiera de las categorías o secciones de arriba para mapearlas automáticamente, o escribí una a medida.
          </div>
        ) : (
          subItems.map((sub, sIdx) => (
            <div
              key={sub.id}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveSub(sIdx, "up")}
                    disabled={sIdx === 0}
                    className="p-1 rounded text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 disabled:opacity-20 transition-colors"
                    title="Subir orden"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSub(sIdx, "down")}
                    disabled={sIdx === subItems.length - 1}
                    className="p-1 rounded text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 disabled:opacity-20 transition-colors"
                    title="Bajar orden"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
                <input
                  type="text"
                  value={sub.label}
                  onChange={(e) =>
                    handleUpdateSub(sIdx, {
                      label: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-1/3 px-2 py-1 text-xs font-semibold rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:border-amber-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={sub.href}
                  onChange={(e) =>
                    handleUpdateSub(sIdx, { href: e.target.value })
                  }
                  className="flex-1 px-2 py-1 text-xs font-mono rounded bg-zinc-900 border border-zinc-800 text-zinc-400 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="inline-flex items-center gap-1 text-[10px] text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(sub.isSale)}
                    onChange={(e) =>
                      handleUpdateSub(sIdx, {
                        isSale: e.target.checked,
                      })
                    }
                    className="rounded border-zinc-700 text-rose-500 focus:ring-rose-400"
                  />
                  <span>Sale</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveSub(sIdx)}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Eliminar esta subsección"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

