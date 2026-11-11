"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ExternalLink,
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
import { NavbarSubItemsEditor } from "./NavbarSubItemsEditor";

interface NavbarItemRowProps {
  item: NavbarItemConfig;
  index: number;
  totalItems: number;
  isEnabled: boolean;
  isSubExpanded: boolean;
  onToggleSubExpand: () => void;
  onMoveItem: (direction: "up" | "down") => void;
  onUpdateItem: (patch: Partial<NavbarItemConfig>) => void;
  onDeleteItem: () => void;
  categories?: Category[];
  sections?: NavigationSection[];
}

export function NavbarItemRow({
  item,
  index,
  totalItems,
  isEnabled,
  isSubExpanded,
  onToggleSubExpand,
  onMoveItem,
  onUpdateItem,
  onDeleteItem,
  categories,
  sections,
}: NavbarItemRowProps) {
  const subItems = item.subItems || [];
  const subItemCount = subItems.length;

  return (
    <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Botones de Ordenamiento Subir / Bajar */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onMoveItem("up")}
              disabled={!isEnabled || index === 0}
              aria-label={`Subir posición de ${item.label}`}
              className="p-1 rounded text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="Mover enlace hacia la izquierda / antes"
            >
              <ArrowUp size={14} />
            </button>
            <span className="text-[11px] font-mono text-zinc-500 w-4 text-center">
              {index + 1}
            </span>
            <button
              type="button"
              onClick={() => onMoveItem("down")}
              disabled={!isEnabled || index === totalItems - 1}
              aria-label={`Bajar posición de ${item.label}`}
              className="p-1 rounded text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="Mover enlace hacia la derecha / después"
            >
              <ArrowDown size={14} />
            </button>
          </div>

          {/* Inputs de edición inline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0">
            <input
              type="text"
              disabled={!isEnabled}
              value={item.label}
              onChange={(e) =>
                onUpdateItem({
                  label: e.target.value.toUpperCase(),
                })
              }
              aria-label={`Etiqueta de enlace ${index + 1}`}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:border-amber-400 focus:outline-none disabled:opacity-50"
            />
            <input
              type="text"
              disabled={!isEnabled}
              value={item.href}
              onChange={(e) => onUpdateItem({ href: e.target.value })}
              aria-label={`URL de enlace ${index + 1}`}
              className="px-2.5 py-1.5 text-xs font-mono text-zinc-400 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Flags de estilo, acordeón de subsecciones y acción de eliminar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end sm:self-center">
          <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={!isEnabled}
              checked={Boolean(item.isSale)}
              onChange={(e) => onUpdateItem({ isSale: e.target.checked })}
              className="rounded border-zinc-700 text-rose-500 focus:ring-rose-400 disabled:opacity-50"
            />
            <span className="flex items-center gap-1">
              <Percent size={11} className="text-rose-400" />
              <span>Sale</span>
            </span>
          </label>

          <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={!isEnabled}
              checked={Boolean(item.openInNewTab)}
              onChange={(e) => onUpdateItem({ openInNewTab: e.target.checked })}
              className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 disabled:opacity-50"
            />
            <span className="flex items-center gap-1">
              <ExternalLink size={11} />
              <span>Pestaña</span>
            </span>
          </label>

          {/* Botón para expandir y mapear subsecciones */}
          <button
            type="button"
            disabled={!isEnabled}
            onClick={onToggleSubExpand}
            aria-expanded={isSubExpanded}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
              isSubExpanded
                ? "bg-amber-400 text-zinc-950 font-bold shadow-xs"
                : subItemCount > 0
                ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-750 border border-zinc-700"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
            title="Mapear y gestionar subsecciones de este menú"
          >
            <Layers
              size={13}
              className={
                isSubExpanded
                  ? "text-zinc-950"
                  : subItemCount > 0
                  ? "text-amber-300"
                  : "text-zinc-500"
              }
            />
            <span>{`Subsecciones (${subItemCount})`}</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-150 ${
                isSubExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          <button
            type="button"
            disabled={!isEnabled}
            onClick={onDeleteItem}
            aria-label={`Eliminar enlace ${item.label}`}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors disabled:opacity-20 disabled:pointer-events-none"
            title="Eliminar este enlace"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Subpanel expandible para mapeo de subsecciones */}
      {isSubExpanded && (
        <NavbarSubItemsEditor
          item={item}
          itemIndex={index}
          categories={categories}
          sections={sections}
          onUpdateSubItems={(newSubItems: NavbarSubItemConfig[]) =>
            onUpdateItem({ subItems: newSubItems })
          }
        />
      )}
    </div>
  );
}

