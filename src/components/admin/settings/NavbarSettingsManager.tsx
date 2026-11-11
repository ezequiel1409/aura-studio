"use client";

import { useState } from "react";
import { Plus, RefreshCw, Tag } from "lucide-react";
import {
  NavbarAlignment,
  NavbarConfig,
  NavbarItemConfig,
  DEFAULT_NAVBAR_CONFIG,
} from "../../../services/settings.service";
import { NavigationSection } from "../../../domain/navigation/types";
import { Category } from "../../../domain/category/types";
import { NavbarMasterSwitch } from "./navbar/NavbarMasterSwitch";
import { NavbarAlignmentSection } from "./navbar/NavbarAlignmentSection";
import { NavbarItemRow } from "./navbar/NavbarItemRow";
import { NavbarNewItemForm } from "./navbar/NavbarNewItemForm";
import { reorderNavbarItems } from "./navbar/navbar-settings.utils";

interface NavbarSettingsManagerProps {
  config: NavbarConfig;
  onChange: (newConfig: NavbarConfig) => void;
  sections?: NavigationSection[];
  categories?: Category[];
}

export function NavbarSettingsManager({
  config,
  onChange,
  sections = [],
  categories = [],
}: NavbarSettingsManagerProps) {
  const isEnabled = config.enabled !== false;
  const alignment = config.alignment || "left";
  const items = config.items || DEFAULT_NAVBAR_CONFIG.items;

  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedSubItemIndex, setExpandedSubItemIndex] = useState<number | null>(null);

  const handleToggleEnabled = () => {
    onChange({
      ...config,
      enabled: !isEnabled,
    });
  };

  const handleAlignmentChange = (newAlign: NavbarAlignment) => {
    onChange({
      ...config,
      alignment: newAlign,
    });
  };

  const handleSecondRowColorsChange = (
    secondRowBgColor: string | null,
    secondRowTextColor: string | null
  ) => {
    onChange({
      ...config,
      secondRowBgColor,
      secondRowTextColor,
    });
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = reorderNavbarItems(items, index, targetIndex);
    onChange({
      ...config,
      items: reordered,
    });
  };

  const handleUpdateItem = (
    index: number,
    patch: Partial<NavbarItemConfig>
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    onChange({
      ...config,
      items: updated,
    });
  };

  const handleDeleteItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    const reordered = updated.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));
    onChange({
      ...config,
      items: reordered,
    });
    if (expandedSubItemIndex === index) {
      setExpandedSubItemIndex(null);
    }
  };

  const handleAddItem = (newItemData: Omit<NavbarItemConfig, "id" | "position">) => {
    const newItem: NavbarItemConfig = {
      ...newItemData,
      id: `nav-${Date.now()}`,
      position: items.length + 1,
    };

    onChange({
      ...config,
      items: [...items, newItem],
    });
    setShowAddForm(false);
  };

  const handleResetDefaults = () => {
    onChange({
      ...DEFAULT_NAVBAR_CONFIG,
    });
    setExpandedSubItemIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Interruptor Maestro de la Navbar */}
      <NavbarMasterSwitch
        isEnabled={isEnabled}
        onToggle={handleToggleEnabled}
      />

      {/* 2. Alineación, Segunda Fila y Diagrama en Vivo */}
      <NavbarAlignmentSection
        isEnabled={isEnabled}
        alignment={alignment}
        onAlignmentChange={handleAlignmentChange}
        secondRowBgColor={config.secondRowBgColor}
        secondRowTextColor={config.secondRowTextColor}
        onSecondRowColorsChange={handleSecondRowColorsChange}
        items={items}
      />

      {/* 3. Lista de Enlaces con Ordenamiento y Subsecciones */}
      <div
        className={`p-5 rounded-2xl border space-y-4 transition-all duration-200 ${
          !isEnabled
            ? "opacity-45 grayscale pointer-events-none select-none bg-zinc-950/40 border-zinc-800/60"
            : "bg-zinc-900/80 border-zinc-800"
        }`}
        aria-disabled={!isEnabled}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Tag size={14} className="text-amber-300" aria-hidden="true" />
                <span>Enlaces y Orden de la Barra ({items.length})</span>
              </h3>
              {!isEnabled && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Pausado (Navbar apagada)
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Subí o bajá los ítems para definir su orden de aparición de izquierda a derecha.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isEnabled}
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors p-1 disabled:opacity-40 cursor-pointer"
              title="Restablecer a valores por defecto"
            >
              <RefreshCw size={12} />
              <span>Predeterminados</span>
            </button>
            <button
              type="button"
              disabled={!isEnabled}
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Plus size={14} />
              <span>Nuevo Enlace</span>
            </button>
          </div>
        </div>

        {/* Formulario para nuevo enlace */}
        {showAddForm && (
          <NavbarNewItemForm
            onAddItem={handleAddItem}
            onCancel={() => setShowAddForm(false)}
            categories={categories}
            sections={sections}
          />
        )}

        {/* Listado de ítems de la barra */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="p-6 rounded-xl bg-zinc-950/50 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
              No tenés enlaces configurados en la navbar. Podés agregar uno o presionar
              &ldquo;Predeterminados&rdquo;.
            </div>
          ) : (
            items.map((item, index) => (
              <NavbarItemRow
                key={item.id}
                item={item}
                index={index}
                totalItems={items.length}
                isEnabled={isEnabled}
                isSubExpanded={expandedSubItemIndex === index}
                onToggleSubExpand={() =>
                  setExpandedSubItemIndex((prev) =>
                    prev === index ? null : index
                  )
                }
                onMoveItem={(direction) => handleMoveItem(index, direction)}
                onUpdateItem={(patch) => handleUpdateItem(index, patch)}
                onDeleteItem={() => handleDeleteItem(index)}
                categories={categories}
                sections={sections}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
